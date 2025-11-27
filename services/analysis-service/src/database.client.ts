import { Pool, PoolClient } from 'pg';
import {
  DatabaseConfig,
  Alert,
  AlertStatus,
  AlertCondition,
  CreateAlertRequest,
  AssetPriceTimeSeries
} from '@crypto-monitor/types';
import { logger } from './logger';

export class DatabaseClient {
  private pool: Pool;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });

    this.pool.on('error', (err) => {
      logger.error({ error: err }, 'Unexpected error on idle database client');
    });
  }

  async initialize(): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Enable TimescaleDB extension
      await client.query('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE');

      // Create alerts table
      await client.query(`
        CREATE TABLE IF NOT EXISTS alerts (
          id UUID PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          symbol VARCHAR(20) NOT NULL,
          condition VARCHAR(50) NOT NULL,
          target_value DECIMAL(20, 8) NOT NULL,
          status VARCHAR(20) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          triggered_at TIMESTAMPTZ,
          notification_sent BOOLEAN DEFAULT FALSE
        )
      `);

      // Create indexes for alerts table
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts (user_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON alerts (symbol)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status)
      `);

      // Create price_history table as hypertable
      await client.query(`
        CREATE TABLE IF NOT EXISTS price_history (
          time TIMESTAMPTZ NOT NULL,
          symbol VARCHAR(20) NOT NULL,
          price DECIMAL(20, 8) NOT NULL,
          volume DECIMAL(30, 8) NOT NULL
        )
      `);

      // Convert to hypertable if not already
      await client.query(`
        SELECT create_hypertable('price_history', 'time', if_not_exists => TRUE)
      `);

      // Create index on symbol for faster queries
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_price_history_symbol_time 
        ON price_history (symbol, time DESC)
      `);

      // Create OHLC (candlestick) table for charts
      await client.query(`
        CREATE TABLE IF NOT EXISTS ohlc_data (
          time TIMESTAMPTZ NOT NULL,
          symbol VARCHAR(20) NOT NULL,
          timeframe VARCHAR(10) NOT NULL,
          open DECIMAL(20, 8) NOT NULL,
          high DECIMAL(20, 8) NOT NULL,
          low DECIMAL(20, 8) NOT NULL,
          close DECIMAL(20, 8) NOT NULL,
          volume DECIMAL(30, 8) NOT NULL,
          PRIMARY KEY (time, symbol, timeframe)
        )
      `);

      // Convert OHLC to hypertable
      await client.query(`
        SELECT create_hypertable('ohlc_data', 'time', if_not_exists => TRUE)
      `);

      // Create index for OHLC queries
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_ohlc_symbol_timeframe_time 
        ON ohlc_data (symbol, timeframe, time DESC)
      `);

      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          nickname VARCHAR(100),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `);

      // Create user_watchlist table (Many-to-Many)
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_watchlist (
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          token_symbol VARCHAR(10) NOT NULL,
          added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, token_symbol)
        )
      `);

      // Create user_portfolio table
      await client.query(`
        CREATE TABLE IF NOT EXISTS user_portfolio (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          token_symbol VARCHAR(10) NOT NULL,
          amount DECIMAL(30, 18) NOT NULL,
          average_buy_price DECIMAL(20, 8),
          notes TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(user_id, token_symbol)
        )
      `);

      // Create indexes for user tables
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON user_watchlist (user_id)
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON user_portfolio (user_id)
      `);

      logger.info('Database initialized successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize database');
      throw error;
    } finally {
      client.release();
    }
  }

  async createAlert(request: CreateAlertRequest): Promise<Alert> {
    const client = await this.pool.connect();
    try {
      const id = require('uuid').v4();
      const result = await client.query(
        `INSERT INTO alerts (id, user_id, symbol, condition, target_value, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          id,
          request.userId,
          request.symbol.toUpperCase(),
          request.condition,
          request.targetValue,
          AlertStatus.ACTIVE
        ]
      );

      return this.mapRowToAlert(result.rows[0]);
    } catch (error) {
      logger.error({ error, request }, 'Failed to create alert');
      throw error;
    } finally {
      client.release();
    }
  }

  async getActiveAlerts(): Promise<Alert[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM alerts WHERE status = $1',
        [AlertStatus.ACTIVE]
      );
      return result.rows.map(row => this.mapRowToAlert(row));
    } catch (error) {
      logger.error({ error }, 'Failed to get active alerts');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAlertsByUser(userId: string): Promise<Alert[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM alerts WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return result.rows.map(row => this.mapRowToAlert(row));
    } catch (error) {
      logger.error({ error, userId }, 'Failed to get user alerts');
      throw error;
    } finally {
      client.release();
    }
  }

  async updateAlertStatus(
    alertId: string,
    status: AlertStatus,
    triggeredAt?: Date
  ): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `UPDATE alerts 
         SET status = $1, triggered_at = $2 
         WHERE id = $3`,
        [status, triggeredAt, alertId]
      );
    } catch (error) {
      logger.error({ error, alertId, status }, 'Failed to update alert status');
      throw error;
    } finally {
      client.release();
    }
  }

  async markNotificationSent(alertId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        'UPDATE alerts SET notification_sent = TRUE WHERE id = $1',
        [alertId]
      );
    } catch (error) {
      logger.error({ error, alertId }, 'Failed to mark notification sent');
      throw error;
    } finally {
      client.release();
    }
  }

  async insertPriceHistory(data: AssetPriceTimeSeries[]): Promise<void> {
    if (data.length === 0) return;

    const client = await this.pool.connect();
    try {
      const values = data
        .map((item, i) => {
          const base = i * 4;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
        })
        .join(',');

      const params = data.flatMap(item => [
        item.timestamp,
        item.symbol.toUpperCase(),
        item.price,
        item.volume
      ]);

      await client.query(
        `INSERT INTO price_history (time, symbol, price, volume) VALUES ${values}`,
        params
      );

      logger.debug({ count: data.length }, 'Inserted price history records');
    } catch (error) {
      logger.error({ error }, 'Failed to insert price history');
      throw error;
    } finally {
      client.release();
    }
  }

  async getPriceHistory(
    symbol: string,
    fromTime: Date,
    toTime: Date
  ): Promise<AssetPriceTimeSeries[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM price_history 
         WHERE symbol = $1 AND time >= $2 AND time <= $3
         ORDER BY time ASC`,
        [symbol.toUpperCase(), fromTime, toTime]
      );

      return result.rows.map(row => ({
        symbol: row.symbol,
        timestamp: row.time,
        price: parseFloat(row.price),
        volume: parseFloat(row.volume)
      }));
    } catch (error) {
      logger.error({ error, symbol }, 'Failed to get price history');
      throw error;
    } finally {
      client.release();
    }
  }

  async getOHLCData(
    symbol: string,
    timeframe: string,
    startTime: Date,
    endTime: Date
  ): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT time, open, high, low, close, volume
         FROM ohlc_data
         WHERE symbol = $1 AND timeframe = $2 AND time >= $3 AND time <= $4
         ORDER BY time ASC`,
        [symbol.toUpperCase(), timeframe, startTime, endTime]
      );

      return result.rows.map(row => ({
        time: Math.floor(new Date(row.time).getTime() / 1000), // Unix timestamp for charts
        open: parseFloat(row.open),
        high: parseFloat(row.high),
        low: parseFloat(row.low),
        close: parseFloat(row.close),
        volume: parseFloat(row.volume)
      }));
    } catch (error) {
      logger.error({ error, symbol, timeframe }, 'Failed to get OHLC data');
      throw error;
    } finally {
      client.release();
    }
  }

  private mapRowToAlert(row: any): Alert {
    return {
      id: row.id,
      userId: row.user_id,
      symbol: row.symbol,
      condition: row.condition as AlertCondition,
      targetValue: parseFloat(row.target_value),
      status: row.status as AlertStatus,
      createdAt: row.created_at,
      triggeredAt: row.triggered_at || undefined,
      notificationSent: row.notification_sent
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }
}
