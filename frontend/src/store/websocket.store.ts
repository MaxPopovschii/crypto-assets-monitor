import { create } from 'zustand';
import {
  AssetPrice,
  WebSocketMessage,
  WebSocketMessageType,
  PriceUpdatePayload,
  SubscribePayload,
  Alert,
  AlertTriggered
} from '../types';

interface WebSocketState {
  socket: WebSocket | null;
  connected: boolean;
  prices: Map<string, AssetPrice>;
  alerts: Alert[];
  triggeredAlert: AlertTriggered | null;
  priceSimulatorInterval: NodeJS.Timeout | null;
  isUsingRealData: boolean; // Nuovo flag
  connect: (url: string, symbols: string[], userId?: string) => void;
  disconnect: () => void;
  subscribe: (symbols: string[]) => void;
  unsubscribe: (symbols: string[]) => void;
  clearTriggeredAlert: () => void;
  startPriceSimulator: (symbols: string[]) => void;
  stopPriceSimulator: () => void;
}

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  socket: null,
  connected: false,
  prices: new Map(),
  alerts: [],
  triggeredAlert: null,
  priceSimulatorInterval: null,
  isUsingRealData: false,

  connect: (url: string, symbols: string[], userId?: string) => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('WebSocket connected');
      set({ connected: true });

      // Subscribe to symbols
      const subscribeMessage: WebSocketMessage<SubscribePayload> = {
        type: WebSocketMessageType.SUBSCRIBE,
        payload: { symbols, userId },
        timestamp: new Date()
      };
      socket.send(JSON.stringify(subscribeMessage));
      
      // Avvia simulatore come FALLBACK (si stoppa se arrivano dati reali)
      console.log('🎮 Starting price simulator as fallback (will stop if real data arrives)');
      get().startPriceSimulator(symbols);
    };

    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);

        switch (message.type) {
          case WebSocketMessageType.PRICE_UPDATE:
            const payload = message.payload as PriceUpdatePayload;
            const newPrices = new Map(get().prices);
            payload.assets.forEach(asset => {
              newPrices.set(asset.symbol, asset);
            });
            set({ prices: newPrices, isUsingRealData: true });
            
            // ✅ Dati REALI ricevuti - stoppa simulatore
            console.log('📡 Real data received from CoinGecko API');
            get().stopPriceSimulator();
            break;

          case WebSocketMessageType.ALERT_TRIGGERED:
            set({ triggeredAlert: message.payload as AlertTriggered });
            break;

          case WebSocketMessageType.PONG:
            console.log('Pong received');
            break;

          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      set({ connected: false, socket: null });
    };

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();
    get().stopPriceSimulator();
    if (socket) {
      socket.close();
      set({ socket: null, connected: false });
    }
  },

  subscribe: (symbols: string[]) => {
    const { socket, connected } = get();
    if (socket && connected) {
      const message: WebSocketMessage<SubscribePayload> = {
        type: WebSocketMessageType.SUBSCRIBE,
        payload: { symbols },
        timestamp: new Date()
      };
      socket.send(JSON.stringify(message));
    }
  },

  unsubscribe: (symbols: string[]) => {
    const { socket, connected } = get();
    if (socket && connected) {
      const message: WebSocketMessage = {
        type: WebSocketMessageType.UNSUBSCRIBE,
        payload: { symbols },
        timestamp: new Date()
      };
      socket.send(JSON.stringify(message));
    }
  },

  clearTriggeredAlert: () => {
    set({ triggeredAlert: null });
  },

  // Simulatore di prezzi real-time per demo
  startPriceSimulator: (symbols: string[]) => {
    // Stop existing simulator
    get().stopPriceSimulator();

    // Inizializza prezzi base se vuoti
    const currentPrices = get().prices;
    if (currentPrices.size === 0) {
      const basePrices: Record<string, number> = {
        'BTC': 96500,
        'ETH': 3450,
        'SOL': 185,
        'AVAX': 42,
        'LINK': 15.5
      };

      const initialPrices = new Map<string, AssetPrice>();
      symbols.forEach(symbol => {
        const basePrice = basePrices[symbol] || 100;
        initialPrices.set(symbol, {
          symbol,
          name: symbol === 'BTC' ? 'Bitcoin' : 
                symbol === 'ETH' ? 'Ethereum' :
                symbol === 'SOL' ? 'Solana' :
                symbol === 'AVAX' ? 'Avalanche' :
                symbol === 'LINK' ? 'Chainlink' : symbol,
          currentPrice: basePrice,
          priceChange24h: 0,
          priceChangePercentage24h: 0,
          marketCap: basePrice * 1e9,
          volume24h: basePrice * 1e8,
          lastUpdated: new Date()
        });
      });
      set({ prices: initialPrices });
    }

    // Aggiorna prezzi ogni 1 secondo per esperienza real-time
    const interval = setInterval(() => {
      const prices = get().prices;
      const newPrices = new Map(prices);
      
      newPrices.forEach((asset, symbol) => {
        // Variazione random ±0.05% ogni secondo (più realistico)
        const volatility = 0.0005; // 0.05%
        const change = asset.currentPrice * (Math.random() - 0.5) * volatility * 2;
        const newPrice = Math.max(0.01, asset.currentPrice + change); // Min 0.01
        const dailyChange = asset.priceChange24h + change;
        
        newPrices.set(symbol, {
          ...asset,
          currentPrice: newPrice,
          priceChange24h: dailyChange,
          priceChangePercentage24h: (dailyChange / (newPrice - dailyChange)) * 100,
          lastUpdated: new Date()
        });
      });
      
      set({ prices: newPrices });
    }, 1000); // Aggiorna ogni 1 secondo per real-time

    set({ priceSimulatorInterval: interval });
    console.log('🎮 Simulated price updates started (±0.05% every 1s)');
  },

  stopPriceSimulator: () => {
    const { priceSimulatorInterval } = get();
    if (priceSimulatorInterval) {
      clearInterval(priceSimulatorInterval);
      set({ priceSimulatorInterval: null });
      console.log('✅ Simulator stopped - using real data');
    }
  }
}));
