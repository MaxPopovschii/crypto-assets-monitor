import Redis from 'ioredis';
import { RedisConfig, RedisChannel, RedisPriceUpdate } from '@crypto-monitor/types';
import { logger } from './logger';

export class RedisPublisher {
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
      logger.info('Connected to Redis');
    });

    this.client.on('error', (error) => {
      logger.error({ error }, 'Redis connection error');
    });
  }

  async publishPriceUpdate(update: RedisPriceUpdate): Promise<void> {
    try {
      const message = JSON.stringify(update);
      await this.client.publish(RedisChannel.PRICE_UPDATES, message);
      logger.debug({ assetCount: update.assets.length }, 'Published price update to Redis');
    } catch (error) {
      logger.error({ error }, 'Failed to publish price update');
      throw error;
    }
  }

  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    try {
      if (expirySeconds) {
        await this.client.setex(key, expirySeconds, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error({ error, key }, 'Failed to set Redis key');
      throw error;
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error({ error, key }, 'Failed to get Redis key');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
    logger.info('Disconnected from Redis');
  }

  isConnected(): boolean {
    return this.client.status === 'ready';
  }
}
