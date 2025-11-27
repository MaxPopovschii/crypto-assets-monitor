import { create } from 'zustand';
import { User, PortfolioItem, AssetPrice } from '../types';

interface UserState {
  user: User | null;
  token: string | null;
  watchlist: string[];
  portfolio: PortfolioItem[];
  portfolioValue: number;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname?: string) => Promise<void>;
  logout: () => void;
  fetchWatchlist: () => Promise<void>;
  addToWatchlist: (symbol: string) => Promise<void>;
  removeFromWatchlist: (symbol: string) => Promise<void>;
  fetchPortfolio: () => Promise<void>;
  addToPortfolio: (symbol: string, amount: number, avgPrice?: number) => Promise<void>;
  calculatePortfolioValue: (prices: Map<string, AssetPrice>) => void;
}

// Mock user for demo
const MOCK_USER: User = {
  id: 'demo-user-001',
  email: 'demo@crypto-monitor.com',
  nickname: 'Crypto Trader Pro',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date()
};

export const useUserStore = create<UserState>((set, get) => ({
  user: MOCK_USER, // Auto-login with demo user
  token: 'demo-token-' + Date.now(),
  watchlist: JSON.parse(localStorage.getItem('watchlist') || '[]'),
  portfolio: JSON.parse(localStorage.getItem('portfolio') || '[]'),
  portfolioValue: 0,

  login: async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      set({ user: data.data.user, token: data.data.token });
      get().fetchWatchlist();
      get().fetchPortfolio();
    } else {
      throw new Error(data.error?.message || 'Login failed');
    }
  },

  register: async (email: string, password: string, nickname?: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, nickname })
    });
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      set({ user: data.data.user, token: data.data.token });
    } else {
      throw new Error(data.error?.message || 'Registration failed');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, watchlist: [], portfolio: [], portfolioValue: 0 });
  },

  fetchWatchlist: async () => {
    const { user } = get();
    if (!user) return;

    const response = await fetch(`/api/watchlist/${user.id}`);
    const data = await response.json();
    
    if (data.success) {
      set({ watchlist: data.data });
    }
  },

  addToWatchlist: async (symbol: string) => {
    const { user, watchlist } = get();
    if (!user) return;

    console.log('Adding to watchlist:', symbol);
    const newWatchlist = [...watchlist, symbol.toUpperCase()];
    set({ watchlist: newWatchlist });
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    
    // Try API but don't fail if not available
    try {
      await fetch(`/api/watchlist/${user.id}/${symbol}`, { method: 'POST' });
    } catch (e) {
      console.log('API not available, using localStorage only');
    }
  },

  removeFromWatchlist: async (symbol: string) => {
    const { user, watchlist } = get();
    if (!user) return;

    console.log('Removing from watchlist:', symbol);
    const newWatchlist = watchlist.filter(s => s !== symbol.toUpperCase());
    set({ watchlist: newWatchlist });
    localStorage.setItem('watchlist', JSON.stringify(newWatchlist));
    
    // Try API but don't fail if not available
    try {
      await fetch(`/api/watchlist/${user.id}/${symbol}`, { method: 'DELETE' });
    } catch (e) {
      console.log('API not available, using localStorage only');
    }
  },

  fetchPortfolio: async () => {
    const { user } = get();
    if (!user) return;

    // Load from localStorage first
    const stored = localStorage.getItem('portfolio');
    if (stored) {
      set({ portfolio: JSON.parse(stored) });
    }
    
    // Try API in background
    try {
      const response = await fetch(`/api/portfolio/${user.id}`);
      const data = await response.json();
      if (data.success) {
        set({ portfolio: data.data });
        localStorage.setItem('portfolio', JSON.stringify(data.data));
      }
    } catch (e) {
      console.log('API not available, using localStorage only');
    }
  },

  addToPortfolio: async (symbol: string, amount: number, avgPrice?: number) => {
    const { user, portfolio } = get();
    if (!user) return;

    const newItem: PortfolioItem = {
      id: `portfolio-${Date.now()}`,
      userId: user.id,
      tokenSymbol: symbol.toUpperCase(),
      amount,
      averageBuyPrice: avgPrice,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const newPortfolio = [...portfolio, newItem];
    set({ portfolio: newPortfolio });
    localStorage.setItem('portfolio', JSON.stringify(newPortfolio));
    
    // Try API in background
    try {
      await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          tokenSymbol: symbol,
          amount,
          averageBuyPrice: avgPrice
        })
      });
    } catch (e) {
      console.log('API not available, using localStorage only');
    }
  },

  calculatePortfolioValue: (prices: Map<string, AssetPrice>) => {
    const { portfolio } = get();
    let totalValue = 0;

    portfolio.forEach(item => {
      const price = prices.get(item.tokenSymbol);
      if (price) {
        totalValue += item.amount * price.currentPrice;
      }
    });

    set({ portfolioValue: totalValue });
  }
}));
