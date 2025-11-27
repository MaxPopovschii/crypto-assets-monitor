import { DatabaseConfig } from '@crypto-monitor/types';

export interface Config {
  port: number;
  nodeEnv: string;
  logLevel: string;
  database: DatabaseConfig;
  jwt: {
    secret: string;
    expiresIn: string;
  };
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || '3003', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'crypto_monitor',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  };
}
