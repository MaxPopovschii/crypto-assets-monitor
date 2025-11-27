import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import {
  WebSocketMessage,
  WebSocketMessageType,
  SubscribePayload,
  UnsubscribePayload,
  PriceUpdatePayload,
  ErrorPayload,
  RedisPriceUpdate,
  RedisAlertTriggered
} from '@crypto-monitor/types';
import { logger } from './logger';

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  subscribedSymbols: Set<string>;
  isAlive: boolean;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private symbolSubscriptions: Map<string, Set<WebSocket>> = new Map();
  private userConnections: Map<string, Set<WebSocket>> = new Map();
  private pingInterval?: NodeJS.Timeout;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientIp = req.socket.remoteAddress;
      logger.info({ clientIp }, 'New WebSocket connection');

      const client: ClientConnection = {
        ws,
        subscribedSymbols: new Set(),
        isAlive: true
      };

      this.clients.set(ws, client);

      // Handle pong responses
      ws.on('pong', () => {
        const client = this.clients.get(ws);
        if (client) {
          client.isAlive = true;
        }
      });

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        this.handleMessage(ws, data);
      });

      // Handle connection close
      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error({ error, clientIp }, 'WebSocket error');
      });

      // Send welcome message
      this.sendMessage(ws, {
        type: WebSocketMessageType.PING,
        payload: { message: 'Connected to Crypto Monitor' },
        timestamp: new Date()
      });
    });
  }

  private handleMessage(ws: WebSocket, data: Buffer): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      const client = this.clients.get(ws);

      if (!client) return;

      switch (message.type) {
        case WebSocketMessageType.SUBSCRIBE:
          this.handleSubscribe(ws, message.payload as SubscribePayload);
          break;

        case WebSocketMessageType.UNSUBSCRIBE:
          this.handleUnsubscribe(ws, message.payload as UnsubscribePayload);
          break;

        case WebSocketMessageType.PING:
          this.sendMessage(ws, {
            type: WebSocketMessageType.PONG,
            payload: {},
            timestamp: new Date()
          });
          break;

        default:
          logger.warn({ type: message.type }, 'Unknown message type');
      }
    } catch (error) {
      logger.error({ error }, 'Failed to handle WebSocket message');
      this.sendError(ws, 'Invalid message format');
    }
  }

  private handleSubscribe(ws: WebSocket, payload: SubscribePayload): void {
    const client = this.clients.get(ws);
    if (!client) return;

    const { symbols, userId } = payload;

    // Store user ID if provided
    if (userId && !client.userId) {
      client.userId = userId;
      
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(ws);
    }

    // Subscribe to symbols
    for (const symbol of symbols) {
      const normalizedSymbol = symbol.toUpperCase();
      client.subscribedSymbols.add(normalizedSymbol);

      if (!this.symbolSubscriptions.has(normalizedSymbol)) {
        this.symbolSubscriptions.set(normalizedSymbol, new Set());
      }
      this.symbolSubscriptions.get(normalizedSymbol)!.add(ws);
    }

    logger.info(
      { userId, symbols, totalSubscriptions: client.subscribedSymbols.size },
      'Client subscribed to symbols'
    );
  }

  private handleUnsubscribe(ws: WebSocket, payload: UnsubscribePayload): void {
    const client = this.clients.get(ws);
    if (!client) return;

    const { symbols } = payload;

    for (const symbol of symbols) {
      const normalizedSymbol = symbol.toUpperCase();
      client.subscribedSymbols.delete(normalizedSymbol);

      const subscribers = this.symbolSubscriptions.get(normalizedSymbol);
      if (subscribers) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          this.symbolSubscriptions.delete(normalizedSymbol);
        }
      }
    }

    logger.info({ symbols }, 'Client unsubscribed from symbols');
  }

  private handleDisconnect(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (!client) return;

    // Remove from symbol subscriptions
    for (const symbol of client.subscribedSymbols) {
      const subscribers = this.symbolSubscriptions.get(symbol);
      if (subscribers) {
        subscribers.delete(ws);
        if (subscribers.size === 0) {
          this.symbolSubscriptions.delete(symbol);
        }
      }
    }

    // Remove from user connections
    if (client.userId) {
      const userWs = this.userConnections.get(client.userId);
      if (userWs) {
        userWs.delete(ws);
        if (userWs.size === 0) {
          this.userConnections.delete(client.userId);
        }
      }
    }

    this.clients.delete(ws);
    logger.info({ userId: client.userId }, 'Client disconnected');
  }

  public broadcastPriceUpdate(update: RedisPriceUpdate): void {
    const payload: PriceUpdatePayload = {
      assets: update.assets
    };

    const message: WebSocketMessage<PriceUpdatePayload> = {
      type: WebSocketMessageType.PRICE_UPDATE,
      payload,
      timestamp: update.timestamp
    };

    // Group clients by their subscribed symbols to avoid duplicate messages
    const notifiedClients = new Set<WebSocket>();

    for (const asset of update.assets) {
      const subscribers = this.symbolSubscriptions.get(asset.symbol);
      if (subscribers) {
        for (const ws of subscribers) {
          if (!notifiedClients.has(ws)) {
            this.sendMessage(ws, message);
            notifiedClients.add(ws);
          }
        }
      }
    }

    logger.debug(
      { clientsNotified: notifiedClients.size },
      'Broadcasted price update'
    );
  }

  public sendAlertToUser(userId: string, alert: RedisAlertTriggered): void {
    const userWs = this.userConnections.get(userId);
    
    if (!userWs || userWs.size === 0) {
      logger.debug({ userId }, 'No active connections for user');
      return;
    }

    const message: WebSocketMessage = {
      type: WebSocketMessageType.ALERT_TRIGGERED,
      payload: alert.alert,
      timestamp: alert.timestamp
    };

    for (const ws of userWs) {
      this.sendMessage(ws, message);
    }

    logger.info({ userId, alertId: alert.alert.alertId }, 'Sent alert to user');
  }

  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: WebSocket, errorMessage: string): void {
    const payload: ErrorPayload = {
      message: errorMessage
    };

    const message: WebSocketMessage<ErrorPayload> = {
      type: WebSocketMessageType.ERROR,
      payload,
      timestamp: new Date()
    };

    this.sendMessage(ws, message);
  }

  private startHeartbeat(): void {
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        const client = this.clients.get(ws);
        
        if (!client) return;

        if (!client.isAlive) {
          ws.terminate();
          return;
        }

        client.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  public getStats(): {
    totalConnections: number;
    totalSubscriptions: number;
    subscribedSymbols: string[];
  } {
    return {
      totalConnections: this.clients.size,
      totalSubscriptions: Array.from(this.clients.values()).reduce(
        (sum, client) => sum + client.subscribedSymbols.size,
        0
      ),
      subscribedSymbols: Array.from(this.symbolSubscriptions.keys())
    };
  }

  public shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.wss.clients.forEach((ws) => {
      ws.close(1000, 'Server shutting down');
    });

    this.clients.clear();
    this.symbolSubscriptions.clear();
    this.userConnections.clear();

    logger.info('WebSocket manager shut down');
  }
}
