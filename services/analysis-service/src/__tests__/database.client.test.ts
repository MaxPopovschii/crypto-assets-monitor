import { DatabaseClient } from '../database.client';
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
        query: jest.fn().mockResolvedValue({}),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient as unknown as any);

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
      mockPool.connect.mockRejectedValue(error);

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
      mockPool.connect.mockResolvedValue(mockClient as unknown as any);

      const alert = await dbClient.createAlert({
        userId: 'user123',
        symbol: 'BTC',
        condition: 'ABOVE',
        targetValue: 50000,
      });

      expect(alert.symbol).toBe('BTC');
      expect(alert.targetValue).toBe(50000);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('savePriceData', () => {
    it('should save price data to database', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({}),
        release: jest.fn(),
      };
      mockPool.connect.mockResolvedValue(mockClient as unknown as any);

      await dbClient.savePriceData({
        symbol: 'BTC',
        price: 50000,
        volume: 1000000,
        timestamp: new Date(),
      });

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO price_history'),
        expect.any(Array)
      );
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
