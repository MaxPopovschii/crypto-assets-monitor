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

export interface AssetPriceTimeSeries {
  symbol: string;
  timestamp: Date;
  price: number;
  volume: number;
}

// OHLC (Candlestick) Data Types
export interface OHLCData {
  time: Date;
  symbol: string;
  timeframe: string; // '1m', '5m', '15m', '1h', '4h', '1d'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export enum ChartTimeframe {
  ONE_MINUTE = '1m',
  FIVE_MINUTES = '5m',
  FIFTEEN_MINUTES = '15m',
  ONE_HOUR = '1h',
  FOUR_HOURS = '4h',
  ONE_DAY = '1d',
  ONE_WEEK = '1w'
}

// Alert Types
export enum AlertCondition {
  ABOVE = 'ABOVE',
  BELOW = 'BELOW',
  PERCENT_CHANGE_UP = 'PERCENT_CHANGE_UP',
  PERCENT_CHANGE_DOWN = 'PERCENT_CHANGE_DOWN'
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

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  notificationPreferences: NotificationPreferences;
  createdAt: Date;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  telegram?: string;
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

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Notification Types
export enum NotificationType {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  TELEGRAM = 'TELEGRAM'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  subject: string;
  message: string;
  sentAt?: Date;
  error?: string;
}

export interface SendNotificationRequest {
  userId: string;
  type: NotificationType;
  subject: string;
  message: string;
  metadata?: Record<string, unknown>;
}

// Redis Message Types
export enum RedisChannel {
  PRICE_UPDATES = 'price:updates',
  ALERT_TRIGGERED = 'alerts:triggered',
  NOTIFICATIONS = 'notifications:queue'
}

export interface RedisPriceUpdate {
  assets: AssetPrice[];
  timestamp: Date;
}

export interface RedisAlertTriggered {
  alert: AlertTriggered;
  timestamp: Date;
}

// External API Types (CoinGecko)
export interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  last_updated: string;
}

export interface CoinGeckoResponse {
  data: CoinGeckoPrice[];
}

// Health Check Types
export interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy';
  timestamp: Date;
  details?: Record<string, unknown>;
}

// Configuration Types
export interface ServiceConfig {
  serviceName: string;
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

// User Types
export interface User {
  id: string;
  email: string;
  nickname?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  nickname?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Watchlist Types
export interface WatchlistItem {
  userId: string;
  tokenSymbol: string;
  addedAt: Date;
}

// Portfolio Types
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

export interface PortfolioSummary {
  items: PortfolioItem[];
  totalValue: number;
  totalInvested: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface CreatePortfolioItemRequest {
  userId: string;
  tokenSymbol: string;
  amount: number;
  averageBuyPrice?: number;
  notes?: string;
}

export interface UpdatePortfolioItemRequest {
  amount?: number;
  averageBuyPrice?: number;
  notes?: string;
}
