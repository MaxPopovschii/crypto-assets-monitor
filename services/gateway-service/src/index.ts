import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { loadConfig } from './config';
import { RedisSubscriber } from './redis.client';
import { WebSocketManager } from './websocket.manager';
import { logger } from './logger';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

async function main() {
  logger.info('Starting Gateway Service');

  const config = loadConfig();

  // Create Express app
  const app = express();

  // Security middleware
  app.use(helmet());
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
  });
  app.use('/api/', limiter);
  
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Create HTTP server
  const server = createServer(app);

  // Create WebSocket server
  const wss = new WebSocketServer({ server, path: '/ws' });
  const wsManager = new WebSocketManager(wss);

  // Health check endpoint
  app.get('/health', (_req, res) => {
    const stats = wsManager.getStats();
    res.json({
      status: 'healthy',
      service: 'gateway-service',
      websocket: stats,
      timestamp: new Date()
    });
  });

  // Proxy endpoints to analysis service (optional - for REST API)
  app.post('/api/alerts', async (req, res) => {
    try {
      const response = await fetch(`${config.analysisServiceUrl}/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      logger.error({ error }, 'Failed to proxy request');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/alerts/user/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const response = await fetch(`${config.analysisServiceUrl}/alerts/user/${userId}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      logger.error({ error }, 'Failed to proxy request');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/alerts/:alertId', async (req, res) => {
    try {
      const { alertId } = req.params;
      const response = await fetch(`${config.analysisServiceUrl}/alerts/${alertId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      logger.error({ error }, 'Failed to proxy request');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Proxy chart data
  app.get('/api/market/history/:symbol', async (req, res) => {
    try {
      const { symbol } = req.params;
      const queryParams = new URLSearchParams(req.query as any).toString();
      const response = await fetch(`${config.analysisServiceUrl}/market/history/${symbol}?${queryParams}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      logger.error({ error }, 'Failed to proxy chart request');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Proxy user authentication
  app.post('/api/auth/register', async (req, res) => {
    try {
      const response = await fetch(`${config.userServiceUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      logger.error({ error }, 'Failed to proxy auth request');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const response = await fetch(`${config.userServiceUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      logger.error({ error }, 'Failed to proxy auth request');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Proxy watchlist
  app.get('/api/watchlist/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const response = await fetch(`${config.userServiceUrl}/watchlist/${userId}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      logger.error({ error }, 'Failed to proxy watchlist request');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/watchlist/:userId/:tokenSymbol', async (req, res) => {
    try {
      const { userId, tokenSymbol } = req.params;
      const response = await fetch(`${config.userServiceUrl}/watchlist/${userId}/${tokenSymbol}`, {
        method: 'POST'
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      logger.error({ error }, 'Failed to proxy watchlist request');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/watchlist/:userId/:tokenSymbol', async (req, res) => {
    try {
      const { userId, tokenSymbol } = req.params;
      const response = await fetch(`${config.userServiceUrl}/watchlist/${userId}/${tokenSymbol}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      logger.error({ error }, 'Failed to proxy watchlist request');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Proxy portfolio
  app.get('/api/portfolio/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const response = await fetch(`${config.userServiceUrl}/portfolio/${userId}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      logger.error({ error }, 'Failed to proxy portfolio request');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/portfolio', async (req, res) => {
    try {
      const response = await fetch(`${config.userServiceUrl}/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      logger.error({ error }, 'Failed to proxy portfolio request');
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Initialize Redis subscriber
  const redisSubscriber = new RedisSubscriber(config.redis);

  // Wait for Redis connection
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Subscribe to price updates
  await redisSubscriber.subscribeToPriceUpdates((update) => {
    wsManager.broadcastPriceUpdate(update);
  });

  // Subscribe to alert triggered events
  await redisSubscriber.subscribeToAlertTriggered((alert) => {
    wsManager.sendAlertToUser(alert.alert.userId, alert);
  });

  // Error handling middleware (must be last)
  app.use(errorHandler);

  // Start server
  server.listen(config.port, () => {
    logger.info(
      { port: config.port, wsPath: '/ws' },
      'Gateway service started'
    );
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    
    wsManager.shutdown();
    await redisSubscriber.disconnect();
    
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch(error => {
  logger.error({ error }, 'Fatal error in main');
  process.exit(1);
});
