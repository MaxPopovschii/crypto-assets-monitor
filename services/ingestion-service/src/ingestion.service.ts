import { AssetPrice, RedisPriceUpdate } from '@crypto-monitor/types';
import { CoinGeckoClient } from './coingecko.client';
import { RedisPublisher } from './redis.client';
import { IngestionDatabaseClient } from './database.client';
import { logger } from './logger';

export class IngestionService {
  private intervalId?: NodeJS.Timeout;
  private ohlcIntervalId?: NodeJS.Timeout;
  private isRunning = false;
  private retryCount = 0;
  private maxRetries = 5;
  private baseRetryDelayMs = 30000; // 30 seconds

  constructor(
    private coinGeckoClient: CoinGeckoClient,
    private redisPublisher: RedisPublisher,
    private databaseClient: IngestionDatabaseClient,
    private symbols: string[],
    private intervalMs: number
  ) {}

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Ingestion service is already running');
      return;
    }

    logger.info(
      { symbols: this.symbols, intervalMs: this.intervalMs },
      'Starting ingestion service'
    );

    // Initial fetch
    await this.ingest();

    // Schedule periodic fetches
    this.intervalId = setInterval(() => {
      this.ingest().catch(error => {
        logger.error({ error }, 'Error during scheduled ingestion');
      });
    }, this.intervalMs);

    // Schedule OHLC generation every minute
    this.ohlcIntervalId = setInterval(() => {
      this.generateOHLC().catch(error => {
        logger.error({ error }, 'Error during OHLC generation');
      });
    }, 60000); // Every minute

    this.isRunning = true;
    logger.info('Ingestion service started successfully');
  }

  async stop(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    if (this.ohlcIntervalId) {
      clearInterval(this.ohlcIntervalId);
      this.ohlcIntervalId = undefined;
    }
    this.isRunning = false;
    logger.info('Ingestion service stopped');
  }

  private async ingest(): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.debug('Starting price ingestion');
      
      const assets: AssetPrice[] = await this.coinGeckoClient.fetchPrices(this.symbols);
      
      if (assets.length === 0) {
        logger.warn('No assets fetched from CoinGecko');
        return;
      }

      // Reset retry count on success
      this.retryCount = 0;

      // Store latest prices in Redis with key pattern
      for (const asset of assets) {
        const key = `price:${asset.symbol}:latest`;
        await this.redisPublisher.set(
          key,
          JSON.stringify(asset),
          300 // 5 minutes expiry
        );
      }

      // Publish update to Redis Pub/Sub
      const update: RedisPriceUpdate = {
        assets,
        timestamp: new Date()
      };

      await this.redisPublisher.publishPriceUpdate(update);

      // Save to database for historical analysis
      await this.databaseClient.savePriceHistory(assets);

      const duration = Date.now() - startTime;
      logger.info(
        { assetCount: assets.length, durationMs: duration },
        'Price ingestion completed'
      );
    } catch (error: unknown) {
      // Handle rate limiting with exponential backoff
      const err = error as { response?: { status?: number }; status?: number };
      if (err?.response?.status === 429 || err?.status === 429) {
        this.retryCount++;
        const delay = Math.min(
          this.baseRetryDelayMs * Math.pow(2, this.retryCount - 1),
          300000 // Max 5 minutes
        );
        
        logger.warn(
          { 
            retryCount: this.retryCount, 
            maxRetries: this.maxRetries,
            nextRetryMs: delay 
          },
          'Rate limit hit, will retry with backoff'
        );
        
        if (this.retryCount >= this.maxRetries) {
          logger.error('Max retries reached, continuing with normal interval');
          this.retryCount = 0;
        }
      } else {
        logger.error({ error }, 'Failed to ingest prices');
      }
    }
  }

  private async generateOHLC(): Promise<void> {
    try {
      logger.debug('Generating OHLC data');
      
      // Generate OHLC for different timeframes
      const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];
      
      for (const timeframe of timeframes) {
        await this.databaseClient.generateOHLC(timeframe);
      }
      
      logger.debug('OHLC data generation completed');
    } catch (error) {
      logger.error({ error }, 'Failed to generate OHLC data');
    }
  }

  getStatus(): { isRunning: boolean; symbols: string[]; intervalMs: number } {
    return {
      isRunning: this.isRunning,
      symbols: this.symbols,
      intervalMs: this.intervalMs
    };
  }
}
