import express, { Request, Response } from 'express';
import pinoHttp from 'pino-http';
import {
  CreateAlertRequest,
  ApiResponse,
  Alert,
  AlertStatus
} from '@crypto-monitor/types';
import { DatabaseClient } from './database.client';
import { AnalysisService } from './analysis.service';
import { logger } from './logger';

export function createApiServer(
  databaseClient: DatabaseClient,
  analysisService: AnalysisService,
  port: number
): express.Application {
  const app = express();

  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'analysis-service',
      activeAlerts: analysisService.getActiveAlertsCount(),
      timestamp: new Date()
    });
  });

  // Create alert
  app.post('/alerts', async (req: Request, res: Response) => {
    try {
      const request: CreateAlertRequest = req.body;

      // Validate request
      if (!request.userId || !request.symbol || !request.condition || !request.targetValue) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Missing required fields',
            code: 'INVALID_REQUEST'
          },
          timestamp: new Date()
        };
        return res.status(400).json(response);
      }

      const alert = await databaseClient.createAlert(request);
      await analysisService.addAlert(alert);

      const response: ApiResponse<Alert> = {
        success: true,
        data: alert,
        timestamp: new Date()
      };

      res.status(201).json(response);
    } catch (error) {
      logger.error({ error }, 'Failed to create alert');
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: 'Failed to create alert',
          code: 'SERVER_ERROR'
        },
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  });

  // Get user alerts
  app.get('/alerts/user/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const alerts = await databaseClient.getAlertsByUser(userId);

      const response: ApiResponse<Alert[]> = {
        success: true,
        data: alerts,
        timestamp: new Date()
      };

      res.json(response);
    } catch (error) {
      logger.error({ error }, 'Failed to get user alerts');
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: 'Failed to get alerts',
          code: 'SERVER_ERROR'
        },
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  });

  // Cancel alert
  app.delete('/alerts/:alertId', async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      
      await databaseClient.updateAlertStatus(alertId, AlertStatus.CANCELLED);
      await analysisService.removeAlert(alertId);

      const response: ApiResponse<null> = {
        success: true,
        timestamp: new Date()
      };

      res.json(response);
    } catch (error) {
      logger.error({ error }, 'Failed to cancel alert');
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: 'Failed to cancel alert',
          code: 'SERVER_ERROR'
        },
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  });

  // Get price history
  app.get('/prices/:symbol/history', async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const { from, to } = req.query;

      if (!from || !to) {
        const response: ApiResponse<null> = {
          success: false,
          error: {
            message: 'Missing required query parameters: from, to',
            code: 'INVALID_REQUEST'
          },
          timestamp: new Date()
        };
        return res.status(400).json(response);
      }

      const fromTime = new Date(from as string);
      const toTime = new Date(to as string);

      const history = await databaseClient.getPriceHistory(symbol, fromTime, toTime);

      const response: ApiResponse<typeof history> = {
        success: true,
        data: history,
        timestamp: new Date()
      };

      res.json(response);
    } catch (error) {
      logger.error({ error }, 'Failed to get price history');
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: 'Failed to get price history',
          code: 'SERVER_ERROR'
        },
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  });

  // Get OHLC data for charts
  app.get('/market/history/:symbol', async (req: Request, res: Response) => {
    try {
      const { symbol } = req.params;
      const { timeframe = '1h', from, to } = req.query;

      const toTime = to ? new Date(to as string) : new Date();
      const fromTime = from ? new Date(from as string) : new Date(toTime.getTime() - 24 * 60 * 60 * 1000);

      const ohlcData = await databaseClient.getOHLCData(
        symbol,
        timeframe as string,
        fromTime,
        toTime
      );

      const response: ApiResponse<typeof ohlcData> = {
        success: true,
        data: ohlcData,
        timestamp: new Date()
      };

      res.json(response);
    } catch (error) {
      logger.error({ error }, 'Failed to get OHLC data');
      const response: ApiResponse<null> = {
        success: false,
        error: {
          message: 'Failed to get chart data',
          code: 'SERVER_ERROR'
        },
        timestamp: new Date()
      };
      res.status(500).json(response);
    }
  });

  app.listen(port, () => {
    logger.info({ port }, 'API server listening');
  });

  return app;
}
