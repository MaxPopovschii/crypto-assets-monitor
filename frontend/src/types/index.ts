// Asset Price Data Types
export interface AssetPrice {
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap: number;
  volume24h: number;
  lastUpdated: Date;
}

// Alert Types
export enum AlertCondition {
  ABOVE = 'ABOVE',
  BELOW = 'BELOW',
  PERCENT_CHANGE_UP = 'PERCENT_CHANGE_UP',
  PERCENT_CHANGE_DOWN = 'PERCENT_CHANGE_DOWN'
}

export interface User {
  id: string;
  email: string;
  nickname?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioItem {
  id: string;
  userId: string;
  tokenSymbol: string;
  amount: number;
  averageBuyPrice?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OHLCData {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  TRIGGERED = 'TRIGGERED',
  CANCELLED = 'CANCELLED'
}

export interface Alert {
  id: string;
  userId: string;
  symbol: string;
  condition: AlertCondition;
  targetValue: number;
  status: AlertStatus;
  createdAt: Date;
  triggeredAt?: Date;
  notificationSent: boolean;
}

export interface CreateAlertRequest {
  userId: string;
  symbol: string;
  condition: AlertCondition;
  targetValue: number;
}

export interface AlertTriggered {
  alertId: string;
  userId: string;
  symbol: string;
  condition: AlertCondition;
  targetValue: number;
  currentPrice: number;
  triggeredAt: Date;
}

// WebSocket Message Types
export enum WebSocketMessageType {
  PRICE_UPDATE = 'PRICE_UPDATE',
  ALERT_CREATED = 'ALERT_CREATED',
  ALERT_TRIGGERED = 'ALERT_TRIGGERED',
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  ERROR = 'ERROR',
  PING = 'PING',
  PONG = 'PONG'
}

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: Date;
}

export interface PriceUpdatePayload {
  assets: AssetPrice[];
}

export interface SubscribePayload {
  symbols: string[];
  userId?: string;
}

export interface UnsubscribePayload {
  symbols: string[];
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
  timestamp: Date;
}
