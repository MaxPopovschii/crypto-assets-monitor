import Redis from 'ioredis';
import {
  RedisConfig,
  RedisChannel,
  RedisPriceUpdate,
  RedisAlertTriggered
} from '@crypto-monitor/types';
import { logger } from './logger';

export class RedisClient {
  private subscriber: Redis;
  private publisher: Redis;

  constructor(config: RedisConfig) {
    this.subscriber = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0
    });

    this.publisher = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0
    });

    this.subscriber.on('connect', () => {
      logger.info('Redis subscriber connected');
    });

    this.publisher.on('connect', () => {
      logger.info('Redis publisher connected');
    });

    this.subscriber.on('error', (error) => {
      logger.error({ error }, 'Redis subscriber error');
    });

    this.publisher.on('error', (error) => {
      logger.error({ error }, 'Redis publisher error');
    });
  }

  async subscribeToPriceUpdates(
    callback: (update: RedisPriceUpdate) => void
  ): Promise<void> {
    await this.subscriber.subscribe(RedisChannel.PRICE_UPDATES);

    this.subscriber.on('message', (channel, message) => {
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

  async publishAlertTriggered(alert: RedisAlertTriggered): Promise<void> {
    try {
      const message = JSON.stringify(alert);
      await this.publisher.publish(RedisChannel.ALERT_TRIGGERED, message);
      logger.debug({ alertId: alert.alert.alertId }, 'Published alert triggered event');
    } catch (error) {
      logger.error({ error }, 'Failed to publish alert triggered');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.subscriber.quit();
    await this.publisher.quit();
    logger.info('Disconnected from Redis');
  }
}
