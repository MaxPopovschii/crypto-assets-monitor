import { AssetPrice } from '../types';
import { useState, useEffect } from 'react';

interface PriceCardProps {
  asset: AssetPrice;
  isInWatchlist?: boolean;
  onToggleWatchlist?: (symbol: string) => void;
  onShowChart?: (symbol: string) => void;
}

export function PriceCard({ asset, isInWatchlist, onToggleWatchlist, onShowChart }: PriceCardProps) {
  const isPositive = asset.priceChangePercentage24h >= 0;
  const [priceFlash, setPriceFlash] = useState<'up' | 'down' | null>(null);
  const [prevPrice, setPrevPrice] = useState(asset.currentPrice);

  // Flash animation quando cambia il prezzo
  useEffect(() => {
    if (asset.currentPrice !== prevPrice) {
      setPriceFlash(asset.currentPrice > prevPrice ? 'up' : 'down');
      setPrevPrice(asset.currentPrice);
      
      const timer = setTimeout(() => setPriceFlash(null), 500);
      return () => clearTimeout(timer);
    }
  }, [asset.currentPrice, prevPrice]);
  
  return (
    <div 
      className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 hover:border-primary-500 transition-all cursor-pointer relative overflow-hidden"
      onClick={() => onShowChart?.(asset.symbol)}
    >
      {/* Flash overlay for price changes */}
      {priceFlash && (
        <div 
          className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
            priceFlash === 'up' 
              ? 'bg-green-500 opacity-10' 
              : 'bg-red-500 opacity-10'
          }`}
        />
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white">{asset.symbol}</h3>
          <p className="text-sm text-gray-400">{asset.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {onToggleWatchlist && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatchlist(asset.symbol);
              }}
              className={`text-2xl transition-all ${
                isInWatchlist 
                  ? 'text-yellow-400 scale-110' 
                  : 'text-gray-600 hover:text-gray-400 hover:scale-110'
              }`}
            >
              {isInWatchlist ? '★' : '☆'}
            </button>
          )}
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            isPositive ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'
          }`}>
            {isPositive ? '+' : ''}{asset.priceChangePercentage24h.toFixed(2)}%
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <div className="flex items-center gap-2">
            <p className={`text-3xl font-bold transition-all duration-300 ${
              priceFlash === 'up' ? 'text-green-400' : 
              priceFlash === 'down' ? 'text-red-400' : 
              'text-white'
            }`}>
              ${asset.currentPrice.toLocaleString(undefined, { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2 
              })}
            </p>
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
          <p className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}${asset.priceChange24h.toFixed(2)} (24h)
          </p>
        </div>
        
        <div className="pt-4 border-t border-gray-700 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Market Cap</span>
            <span className="text-white font-medium">
              ${(asset.marketCap / 1e9).toFixed(2)}B
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Volume (24h)</span>
            <span className="text-white font-medium">
              ${(asset.volume24h / 1e9).toFixed(2)}B
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Last Updated</span>
            <span className="text-white font-medium">
              {new Date(asset.lastUpdated).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
