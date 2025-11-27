import { RedisConfig } from '@crypto-monitor/types';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export interface Config {
  port: number;
  nodeEnv: string;
  logLevel: string;
  redis: RedisConfig;
  email: EmailConfig;
}

export function loadConfig(): Config {
  return {
    port: parseInt(process.env.PORT || '3003', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: 0
    },
    email: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
      from: process.env.EMAIL_FROM || 'Crypto Monitor <noreply@cryptomonitor.com>'
    }
  };
}
