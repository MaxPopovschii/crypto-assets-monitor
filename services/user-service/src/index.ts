import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { loadConfig } from './config';
import { UserDatabaseClient } from './database.client';
import { createAuthRoutes } from './routes/auth.routes';
import { createWatchlistRoutes } from './routes/watchlist.routes';
import { createPortfolioRoutes } from './routes/portfolio.routes';
import { logger } from './logger';

dotenv.config();

async function main() {
  logger.info('Starting User Service');

  const config = loadConfig();
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Initialize database
  const db = new UserDatabaseClient({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.username,
    password: config.database.password
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ 
      status: 'healthy', 
      service: 'user-service',
      timestamp: new Date()
    });
  });

  // Routes
  app.use('/auth', createAuthRoutes(db, config.jwt));
  app.use('/watchlist', createWatchlistRoutes(db));
  app.use('/portfolio', createPortfolioRoutes(db));

  // Start server
  app.listen(config.port, () => {
    logger.info({ port: config.port }, 'User service started');
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    await db.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch(error => {
  logger.error({ error }, 'Fatal error in main');
  process.exit(1);
});
