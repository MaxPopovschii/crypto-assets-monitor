import {
  Alert,
  AlertCondition,
  AlertStatus,
  AlertTriggered,
  AssetPrice,
  AssetPriceTimeSeries,
  RedisPriceUpdate,
  RedisAlertTriggered
} from '@crypto-monitor/types';
import { DatabaseClient } from './database.client';
import { RedisClient } from './redis.client';
import { logger } from './logger';

export class AnalysisService {
  private activeAlerts: Map<string, Alert> = new Map();

  constructor(
    private databaseClient: DatabaseClient,
    private redisClient: RedisClient
  ) {}

  async start(): Promise<void> {
    logger.info('Starting Analysis Service');

    // Load active alerts from database
    await this.loadActiveAlerts();

    // Subscribe to price updates
    await this.redisClient.subscribeToPriceUpdates(
      this.handlePriceUpdate.bind(this)
    );

    logger.info('Analysis Service started successfully');
  }

  private async loadActiveAlerts(): Promise<void> {
    try {
      const alerts = await this.databaseClient.getActiveAlerts();
      this.activeAlerts.clear();
      
      for (const alert of alerts) {
        this.activeAlerts.set(alert.id, alert);
      }

      logger.info(
        { count: alerts.length },
        'Loaded active alerts from database'
      );
    } catch (error) {
      logger.error({ error }, 'Failed to load active alerts');
      throw error;
    }
  }

  private async handlePriceUpdate(update: RedisPriceUpdate): Promise<void> {
    logger.debug(
      { assetCount: update.assets.length },
      'Processing price update'
    );

    try {
      // Store price history
      const priceHistory: AssetPriceTimeSeries[] = update.assets.map(asset => ({
        symbol: asset.symbol,
        timestamp: update.timestamp,
        price: asset.currentPrice,
        volume: asset.volume24h
      }));

      await this.databaseClient.insertPriceHistory(priceHistory);

      // Check alerts for each asset
      for (const asset of update.assets) {
        await this.checkAlerts(asset);
      }
    } catch (error) {
      logger.error({ error }, 'Error processing price update');
    }
  }

  private async checkAlerts(asset: AssetPrice): Promise<void> {
    const alertsToCheck = Array.from(this.activeAlerts.values()).filter(
      alert => alert.symbol === asset.symbol
    );

    for (const alert of alertsToCheck) {
      const isTriggered = this.evaluateAlertCondition(
        alert.condition,
        asset.currentPrice,
        alert.targetValue
      );

      if (isTriggered) {
        await this.triggerAlert(alert, asset.currentPrice);
      }
    }
  }

  private evaluateAlertCondition(
    condition: AlertCondition,
    currentPrice: number,
    targetValue: number
  ): boolean {
    switch (condition) {
      case AlertCondition.ABOVE:
        return currentPrice > targetValue;
      case AlertCondition.BELOW:
        return currentPrice < targetValue;
      case AlertCondition.PERCENT_CHANGE_UP:
        // For percentage change, targetValue represents the percentage threshold
        // This would require tracking previous prices, simplified for now
        return false;
      case AlertCondition.PERCENT_CHANGE_DOWN:
        return false;
      default:
        return false;
    }
  }

  private async triggerAlert(alert: Alert, currentPrice: number): Promise<void> {
    try {
      const triggeredAt = new Date();

      logger.info(
        { alertId: alert.id, symbol: alert.symbol, currentPrice },
        'Alert triggered'
      );

      // Update alert status in database
      await this.databaseClient.updateAlertStatus(
        alert.id,
        AlertStatus.TRIGGERED,
        triggeredAt
      );

      // Remove from active alerts
      this.activeAlerts.delete(alert.id);

      // Publish alert triggered event
      const alertTriggered: AlertTriggered = {
        alertId: alert.id,
        userId: alert.userId,
        symbol: alert.symbol,
        condition: alert.condition,
        targetValue: alert.targetValue,
        currentPrice,
        triggeredAt
      };

      const redisMessage: RedisAlertTriggered = {
        alert: alertTriggered,
        timestamp: triggeredAt
      };

      await this.redisClient.publishAlertTriggered(redisMessage);

      logger.info(
        { alertId: alert.id },
        'Alert triggered and notification sent to queue'
      );
    } catch (error) {
      logger.error({ error, alertId: alert.id }, 'Failed to trigger alert');
    }
  }

  async addAlert(alert: Alert): Promise<void> {
    this.activeAlerts.set(alert.id, alert);
    logger.info({ alertId: alert.id }, 'Added new alert to active alerts');
  }

  async removeAlert(alertId: string): Promise<void> {
    this.activeAlerts.delete(alertId);
    logger.info({ alertId }, 'Removed alert from active alerts');
  }

  getActiveAlertsCount(): number {
    return this.activeAlerts.size;
  }
}
