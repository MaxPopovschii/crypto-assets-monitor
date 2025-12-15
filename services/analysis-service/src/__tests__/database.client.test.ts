import { DatabaseClient } from '../database.client';
import { AlertCondition } from '@crypto-monitor/types';
import { Pool } from 'pg';

jest.mock('pg');

describe('DatabaseClient', () => {
  let dbClient: DatabaseClient;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    mockPool = {
      connect: jest.fn(),
      query: jest.fn(),
      on: jest.fn(),
      end: jest.fn(),
    } as unknown as jest.Mocked<Pool>;

    (Pool as jest.MockedClass<typeof Pool>).mockImplementation(() => mockPool);

    dbClient = new DatabaseClient({
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      password: 'test_pass',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should create tables and hypertables', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({} as never),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient as never);

      await dbClient.initialize();

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE EXTENSION IF NOT EXISTS timescaledb')
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS alerts')
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS price_history')
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Connection failed');
      mockPool.connect.mockRejectedValue(error as never);

      await expect(dbClient.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('createAlert', () => {
    it('should create a new alert', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({
          rows: [
            {
              id: 'test-uuid',
              user_id: 'user123',
              symbol: 'BTC',
              condition: 'ABOVE',
              target_value: 50000,
              status: 'ACTIVE',
            },
          ],
        }),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient as never);

      const alert = await dbClient.createAlert({
        userId: 'user123',
        symbol: 'BTC',
        condition: AlertCondition.ABOVE,
        targetValue: 50000,
      });

      expect(alert.symbol).toBe('BTC');
      expect(alert.targetValue).toBe(50000);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
