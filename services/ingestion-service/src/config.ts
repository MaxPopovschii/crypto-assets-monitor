import { RedisConfig, DatabaseConfig } from '@crypto-monitor/types';

export interface Config {
  port: number;
  nodeEnv: string;
  logLevel: string;
  redis: RedisConfig;
  database: DatabaseConfig;
  coinGecko: {
    apiUrl: string;
    apiKey?: string;
  };
  ingestion: {
    intervalMs: number;
    symbols: string[];
  };
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: 0
    },
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'crypto_monitor',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    },
    coinGecko: {
      apiUrl: process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3',
      apiKey: process.env.COINGECKO_API_KEY || undefined
    },
    ingestion: {
      intervalMs: parseInt(process.env.INGESTION_INTERVAL_MS || '60000', 10),
      symbols: (process.env.MONITORED_SYMBOLS || 'bitcoin,ethereum,cardano,solana').split(',').map(s => s.trim())
    }
  };
}
