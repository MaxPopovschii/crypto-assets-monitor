import Redis from 'ioredis';
import {
  RedisConfig,
  RedisChannel,
  RedisPriceUpdate,
  RedisAlertTriggered
} from '@crypto-monitor/types';
import { logger } from './logger';

export class RedisSubscriber {
  private client: Redis;

  constructor(config: RedisConfig) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.client.on('connect', () => {
      logger.info('Redis subscriber connected');
    });

    this.client.on('error', (error) => {
      logger.error({ error }, 'Redis subscriber error');
    });
  }

  async subscribeToPriceUpdates(
    callback: (update: RedisPriceUpdate) => void
  ): Promise<void> {
    await this.client.subscribe(RedisChannel.PRICE_UPDATES);

    this.client.on('message', (channel, message) => {
      if (channel === RedisChannel.PRICE_UPDATES) {
        try {
          const update: RedisPriceUpdate = JSON.parse(message);
          callback(update);
        } catch (error) {
          logger.error({ error, message }, 'Failed to parse price update message');
        }
      }
    });

    logger.info('Subscribed to price updates');
  }

  async subscribeToAlertTriggered(
    callback: (alert: RedisAlertTriggered) => void
  ): Promise<void> {
    await this.client.subscribe(RedisChannel.ALERT_TRIGGERED);

    this.client.on('message', (channel, message) => {
      if (channel === RedisChannel.ALERT_TRIGGERED) {
        try {
          const alert: RedisAlertTriggered = JSON.parse(message);
          callback(alert);
        } catch (error) {
          logger.error({ error, message }, 'Failed to parse alert triggered message');
        }
      }
    });

    logger.info('Subscribed to alert triggered events');
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    logger.info('Redis subscriber disconnected');
  }
}
