import dotenv from 'dotenv';
import { loadConfig } from './config';
import { DatabaseClient } from './database.client';
import { RedisClient } from './redis.client';
import { AnalysisService } from './analysis.service';
import { createApiServer } from './api.server';
import { logger } from './logger';

// Load environment variables
dotenv.config();

async function main() {
  logger.info('Starting Analysis Service');

  const config = loadConfig();

  // Initialize database
  const databaseClient = new DatabaseClient(config.database);
  await databaseClient.initialize();

  // Initialize Redis
  const redisClient = new RedisClient(config.redis);

  // Wait for connections
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Initialize analysis service
  const analysisService = new AnalysisService(databaseClient, redisClient);
  await analysisService.start();

  // Start API server
  createApiServer(databaseClient, analysisService, config.port);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    await redisClient.disconnect();
    await databaseClient.close();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('Analysis Service is running');
}

main().catch(error => {
  logger.error({ error }, 'Fatal error in main');
  process.exit(1);
});
