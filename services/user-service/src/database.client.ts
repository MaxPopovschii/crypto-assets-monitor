import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import {
  User,
  CreateUserRequest,
  WatchlistItem,
  PortfolioItem,
  CreatePortfolioItemRequest,
  UpdatePortfolioItemRequest
} from '@crypto-monitor/types';
import { logger } from './logger';

export class UserDatabaseClient {
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
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
  }

  // User Methods
  async createUser(request: CreateUserRequest): Promise<User> {
    const client = await this.pool.connect();
    try {
      const passwordHash = await bcrypt.hash(request.password, 10);
      
      const result = await client.query(
        `INSERT INTO users (email, password_hash, nickname)
         VALUES ($1, $2, $3)
         RETURNING id, email, nickname, created_at, updated_at`,
        [request.email, passwordHash, request.nickname || null]
      );

      return this.mapUserRow(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async findUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        ...this.mapUserRow(row),
        passwordHash: row.password_hash
      };
    } finally {
      client.release();
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT id, email, nickname, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) return null;
      return this.mapUserRow(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async updateUser(id: string, nickname?: string): Promise<User> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE users 
         SET nickname = COALESCE($1, nickname), updated_at = NOW()
         WHERE id = $2
         RETURNING id, email, nickname, created_at, updated_at`,
        [nickname, id]
      );

      return this.mapUserRow(result.rows[0]);
    } finally {
      client.release();
    }
  }

  // Watchlist Methods
  async addToWatchlist(userId: string, tokenSymbol: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO user_watchlist (user_id, token_symbol)
         VALUES ($1, $2)
         ON CONFLICT (user_id, token_symbol) DO NOTHING`,
        [userId, tokenSymbol.toUpperCase()]
      );
    } finally {
      client.release();
    }
  }

  async removeFromWatchlist(userId: string, tokenSymbol: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        'DELETE FROM user_watchlist WHERE user_id = $1 AND token_symbol = $2',
        [userId, tokenSymbol.toUpperCase()]
      );
    } finally {
      client.release();
    }
  }

  async getWatchlist(userId: string): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT token_symbol FROM user_watchlist WHERE user_id = $1 ORDER BY added_at DESC',
        [userId]
      );

      return result.rows.map(row => row.token_symbol);
    } finally {
      client.release();
    }
  }

  // Portfolio Methods
  async createPortfolioItem(request: CreatePortfolioItemRequest): Promise<PortfolioItem> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO user_portfolio (user_id, token_symbol, amount, average_buy_price, notes)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, token_symbol)
         DO UPDATE SET
           amount = user_portfolio.amount + EXCLUDED.amount,
           updated_at = NOW()
         RETURNING *`,
        [
          request.userId,
          request.tokenSymbol.toUpperCase(),
          request.amount,
          request.averageBuyPrice || null,
          request.notes || null
        ]
      );

      return this.mapPortfolioRow(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async updatePortfolioItem(
    id: string,
    userId: string,
    update: UpdatePortfolioItemRequest
  ): Promise<PortfolioItem> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `UPDATE user_portfolio
         SET amount = COALESCE($1, amount),
             average_buy_price = COALESCE($2, average_buy_price),
             notes = COALESCE($3, notes),
             updated_at = NOW()
         WHERE id = $4 AND user_id = $5
         RETURNING *`,
        [update.amount, update.averageBuyPrice, update.notes, id, userId]
      );

      if (result.rows.length === 0) {
        throw new Error('Portfolio item not found');
      }

      return this.mapPortfolioRow(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async deletePortfolioItem(id: string, userId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        'DELETE FROM user_portfolio WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
    } finally {
      client.release();
    }
  }

  async getPortfolio(userId: string): Promise<PortfolioItem[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM user_portfolio WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      return result.rows.map(this.mapPortfolioRow);
    } finally {
      client.release();
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
  }

  private mapUserRow(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      email: row.email as string,
      nickname: row.nickname as string | undefined,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date
    };
  }

  private mapPortfolioRow(row: Record<string, unknown>): PortfolioItem {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      tokenSymbol: row.token_symbol as string,
      amount: parseFloat(row.amount as string),
      averageBuyPrice: row.average_buy_price ? parseFloat(row.average_buy_price as string) : undefined,
      notes: row.notes as string | undefined,
      createdAt: row.created_at as Date,
      updatedAt: row.updated_at as Date
    };
  }
}
