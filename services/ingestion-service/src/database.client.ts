import { Pool, PoolClient } from 'pg';
import { AssetPrice, OHLCData } from '@crypto-monitor/types';
import { logger } from './logger';

export class IngestionDatabaseClient {
  private pool: Pool;

  constructor(config: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  }) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    this.pool.on('error', (err) => {
      logger.error({ error: err }, 'Unexpected database error');
    });
  }

  async savePriceHistory(assets: AssetPrice[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      const values: any[] = [];
      const placeholders: string[] = [];
      let paramIndex = 1;

      assets.forEach((asset) => {
        placeholders.push(
          `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`
        );
        values.push(
          new Date(asset.lastUpdated),
          asset.symbol,
          asset.currentPrice,
          asset.volume24h
        );
        paramIndex += 4;
      });

      const query = `
        INSERT INTO price_history (time, symbol, price, volume)
        VALUES ${placeholders.join(', ')}
      `;

      await client.query(query, values);
      logger.debug({ count: assets.length }, 'Saved price history to database');
    } catch (error) {
      logger.error({ error }, 'Failed to save price history');
      throw error;
    } finally {
      client.release();
    }
  }

  async generateOHLC(timeframe: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Calculate OHLC for each symbol based on price_history
      const timeframeMinutes = this.getTimeframeMinutes(timeframe);
      
      const query = `
        INSERT INTO ohlc_data (time, symbol, timeframe, open, high, low, close, volume)
        SELECT 
          time_bucket($1::interval, time) AS bucket,
          symbol,
          $2 AS timeframe,
          FIRST(price, time) AS open,
          MAX(price) AS high,
          MIN(price) AS low,
          LAST(price, time) AS close,
          SUM(volume) AS volume
        FROM price_history
        WHERE time >= NOW() - $1::interval * 2
        GROUP BY bucket, symbol
        ON CONFLICT (time, symbol, timeframe) 
        DO UPDATE SET
          open = EXCLUDED.open,
          high = EXCLUDED.high,
          low = EXCLUDED.low,
          close = EXCLUDED.close,
          volume = EXCLUDED.volume
      `;

      await client.query(query, [`${timeframeMinutes} minutes`, timeframe]);
      logger.debug({ timeframe }, 'Generated OHLC data');
    } catch (error) {
      logger.error({ error, timeframe }, 'Failed to generate OHLC');
    } finally {
      client.release();
    }
  }

  private getTimeframeMinutes(timeframe: string): number {
    const mapping: Record<string, number> = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '1h': 60,
      '4h': 240,
      '1d': 1440,
      '1w': 10080
    };
    return mapping[timeframe] || 60;
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }
}
