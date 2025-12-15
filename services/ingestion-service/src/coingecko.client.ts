import axios, { AxiosInstance } from 'axios';
import {
  AssetPrice,
  CoinGeckoPrice
} from '@crypto-monitor/types';
import { logger } from './logger';

export class CoinGeckoClient {
  private client: AxiosInstance;

  constructor(baseURL: string, apiKey?: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: apiKey ? { 'x-cg-demo-api-key': apiKey } : {}
    });
  }

  async fetchPrices(symbols: string[]): Promise<AssetPrice[]> {
    try {
      const ids = symbols.join(',');
      logger.debug({ symbols }, 'Fetching prices from CoinGecko');

      const response = await this.client.get<CoinGeckoPrice[]>('/coins/markets', {
        params: {
          vs_currency: 'usd',
          ids,
          order: 'market_cap_desc',
          sparkline: false,
          price_change_percentage: '24h'
        }
      });

      const assets: AssetPrice[] = response.data.map(coin => ({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        currentPrice: coin.current_price,
        priceChange24h: coin.price_change_24h,
        priceChangePercentage24h: coin.price_change_percentage_24h,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        lastUpdated: new Date(coin.last_updated)
      }));

      logger.info({ count: assets.length }, 'Successfully fetched prices');
      return assets;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch prices from CoinGecko');
      throw error;
    }
  }

  async ping(): Promise<boolean> {
    try {
      await this.client.get('/ping');
      return true;
    } catch (error) {
      logger.error({ error }, 'CoinGecko ping failed');
      return false;
    }
  }
}
