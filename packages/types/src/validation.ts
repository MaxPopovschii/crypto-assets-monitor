import { z } from 'zod';

// Alert validation schemas
export const createAlertSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  symbol: z.string().min(1, 'Symbol is required').max(20),
  condition: z.enum(['ABOVE', 'BELOW', 'PERCENT_CHANGE_UP', 'PERCENT_CHANGE_DOWN']),
  targetValue: z.number().positive('Target value must be positive'),
});

export const updateAlertSchema = z.object({
  status: z.enum(['ACTIVE', 'TRIGGERED', 'CANCELLED']).optional(),
  targetValue: z.number().positive().optional(),
});

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  nickname: z.string().max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Portfolio validation schemas
export const createPortfolioItemSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  tokenSymbol: z.string().min(1, 'Token symbol is required').max(20),
  amount: z.number().positive('Amount must be positive'),
  averageBuyPrice: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

export const updatePortfolioItemSchema = z.object({
  amount: z.number().positive().optional(),
  averageBuyPrice: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
});

// Watchlist validation schemas
export const addToWatchlistSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  tokenSymbol: z.string().min(1, 'Token symbol is required').max(20),
});

// Chart data query validation
export const chartQuerySchema = z.object({
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d', '1w']).optional().default('1h'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().int().positive().max(1000).optional().default(100),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type UpdateAlertInput = z.infer<typeof updateAlertSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePortfolioItemInput = z.infer<typeof createPortfolioItemSchema>;
export type UpdatePortfolioItemInput = z.infer<typeof updatePortfolioItemSchema>;
export type AddToWatchlistInput = z.infer<typeof addToWatchlistSchema>;
export type ChartQueryInput = z.infer<typeof chartQuerySchema>;
