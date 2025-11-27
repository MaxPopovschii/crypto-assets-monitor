import dotenv from 'dotenv';
import { loadConfig } from './config';
import { CoinGeckoClient } from './coingecko.client';
import { RedisPublisher } from './redis.client';
import { IngestionDatabaseClient } from './database.client';
import { IngestionService } from './ingestion.service';
import { logger } from './logger';

// Load environment variables
dotenv.config();

async function main() {
  logger.info('Starting Ingestion Service');

  const config = loadConfig();

  // Initialize clients
  const coinGeckoClient = new CoinGeckoClient(
    config.coinGecko.apiUrl,
    config.coinGecko.apiKey
  );

  const redisPublisher = new RedisPublisher(config.redis);

  const databaseClient = new IngestionDatabaseClient({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.username,
    password: config.database.password
  });

  // Wait for Redis connection
  await new Promise(resolve => setTimeout(resolve, 1000));

  if (!redisPublisher.isConnected()) {
    logger.error('Failed to connect to Redis');
    process.exit(1);
  }

  // Check CoinGecko API
  const isApiHealthy = await coinGeckoClient.ping();
  if (!isApiHealthy) {
    logger.warn('CoinGecko API health check failed, but continuing...');
  }

  // Initialize and start ingestion service
  const ingestionService = new IngestionService(
    coinGeckoClient,
    redisPublisher,
    databaseClient,
    config.ingestion.symbols,
    config.ingestion.intervalMs
  );

  await ingestionService.start();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    await ingestionService.stop();
    await redisPublisher.disconnect();
    await databaseClient.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('Ingestion Service is running');
}

main().catch(error => {
  logger.error({ error }, 'Fatal error in main');
  process.exit(1);
});
