import { RedisConfig } from '@crypto-monitor/types';

export interface Config {
  port: number;
  nodeEnv: string;
  logLevel: string;
  corsOrigin: string;
  redis: RedisConfig;
  analysisServiceUrl: string;
  userServiceUrl: string;
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: 0
    },
    analysisServiceUrl: process.env.ANALYSIS_SERVICE_URL || 'http://localhost:3002',
    userServiceUrl: process.env.USER_SERVICE_URL || 'http://localhost:3003'
  };
}
