import { RedisAlertTriggered, AlertCondition } from '@crypto-monitor/types';
import { EmailProvider } from './email.provider';
import { logger } from './logger';

// Mock user database - in production, this would query a real database
const MOCK_USERS: Record<string, { email: string; name: string }> = {
  'user-1': { email: 'user1@example.com', name: 'Alice' },
  'user-2': { email: 'user2@example.com', name: 'Bob' }
};

export class NotificationService {
  constructor(private emailProvider: EmailProvider) {}

  async handleAlertTriggered(alertData: RedisAlertTriggered): Promise<void> {
    const { alert } = alertData;

    logger.info(
      { alertId: alert.alertId, userId: alert.userId, symbol: alert.symbol },
      'Processing alert notification'
    );

    try {
      // Get user information (mock - in production, query database)
      const user = MOCK_USERS[alert.userId];
      
      if (!user) {
        logger.warn({ userId: alert.userId }, 'User not found');
        return;
      }

      // Format condition for email
      const conditionText = this.formatCondition(alert.condition);

      // Send email notification
      await this.emailProvider.sendAlertNotification(
        user.email,
        alert.symbol,
        conditionText,
        alert.targetValue,
        alert.currentPrice
      );

      logger.info(
        { alertId: alert.alertId, email: user.email },
        'Notification sent successfully'
      );
    } catch (error) {
      logger.error(
        { error, alertId: alert.alertId },
        'Failed to send notification'
      );
      
      // In production, you might want to:
      // 1. Retry with exponential backoff
      // 2. Store failed notifications in a dead letter queue
      // 3. Alert monitoring system
    }
  }

  private formatCondition(condition: AlertCondition): string {
    switch (condition) {
      case AlertCondition.ABOVE:
        return 'Price Above Target';
      case AlertCondition.BELOW:
        return 'Price Below Target';
      case AlertCondition.PERCENT_CHANGE_UP:
        return 'Price Increased by %';
      case AlertCondition.PERCENT_CHANGE_DOWN:
        return 'Price Decreased by %';
      default:
        return 'Unknown Condition';
    }
  }

  async sendTestNotification(email: string): Promise<void> {
    try {
      await this.emailProvider.sendAlertNotification(
        email,
        'BTC',
        'Price Above Target',
        50000,
        51234.56
      );
      logger.info({ email }, 'Test notification sent');
    } catch (error) {
      logger.error({ error, email }, 'Failed to send test notification');
      throw error;
    }
  }
}
