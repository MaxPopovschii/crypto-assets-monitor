import dotenv from 'dotenv';
import { loadConfig } from './config';
import { RedisSubscriber } from './redis.client';
import { EmailProvider } from './email.provider';
import { NotificationService } from './notification.service';
import { logger } from './logger';

// Load environment variables
dotenv.config();

async function main() {
  logger.info('Starting Notification Service');

  const config = loadConfig();

  // Initialize email provider
  const emailProvider = new EmailProvider(config.email);

  // Initialize notification service
  const notificationService = new NotificationService(emailProvider);

  // Initialize Redis subscriber
  const redisSubscriber = new RedisSubscriber(config.redis);

  // Wait for Redis connection
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Subscribe to alert triggered events
  await redisSubscriber.subscribeToAlertTriggered(
    (alert) => {
      notificationService.handleAlertTriggered(alert).catch(error => {
        logger.error({ error }, 'Error handling alert notification');
      });
    }
  );

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Received shutdown signal');
    await redisSubscriber.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  logger.info('Notification Service is running');
}

main().catch(error => {
  logger.error({ error }, 'Fatal error in main');
  process.exit(1);
});
