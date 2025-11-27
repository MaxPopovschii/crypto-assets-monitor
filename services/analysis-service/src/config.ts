import { RedisConfig, DatabaseConfig } from '@crypto-monitor/types';

export interface Config {
  port: number;
  nodeEnv: string;
  logLevel: string;
  redis: RedisConfig;
  database: DatabaseConfig;
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || '3002', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: 0
    },
    database: {
      host: process.env.TIMESCALE_HOST || 'localhost',
      port: parseInt(process.env.TIMESCALE_PORT || '5432', 10),
      database: process.env.TIMESCALE_DATABASE || 'crypto_monitor',
      username: process.env.TIMESCALE_USER || 'postgres',
      password: process.env.TIMESCALE_PASSWORD || 'postgres',
      ssl: process.env.TIMESCALE_SSL === 'true'
    }
  };
}
