import { useState } from 'react';
import { useUserStore } from '../store/user.store';
import { useWebSocketStore } from '../store/websocket.store';
import { CandlestickChart } from './CandlestickChart';

export function Watchlist() {
  const { watchlist, addToWatchlist, removeFromWatchlist } = useUserStore();
  const { prices } = useWebSocketStore();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const toggleWatchlist = async (symbol: string) => {
    console.log('Watchlist toggle:', symbol);
    if (watchlist.includes(symbol.toUpperCase())) {
      await removeFromWatchlist(symbol);
    } else {
      await addToWatchlist(symbol);
    }
  };

  const watchlistPrices = Array.from(prices.values()).filter(p =>
    watchlist.includes(p.symbol.toUpperCase())
  );

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold mb-6">My Watchlist</h2>

      {watchlistPrices.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Click the star icon on any coin to add it to your watchlist
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlistPrices.map(price => (
            <div
              key={price.symbol}
              className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() => setSelectedSymbol(price.symbol)}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold">{price.symbol}</h3>
                  <p className="text-sm text-gray-400">{price.name}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWatchlist(price.symbol);
                  }}
                  className="text-yellow-400 text-xl"
                >
                  ★
                </button>
              </div>
              <p className="text-2xl font-bold">
                ${price.currentPrice.toLocaleString()}
              </p>
              <p
                className={`text-sm ${
                  price.priceChangePercentage24h >= 0
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {price.priceChangePercentage24h >= 0 ? '+' : ''}
                {price.priceChangePercentage24h.toFixed(2)}%
              </p>
            </div>
          ))}
        </div>
      )}

      {selectedSymbol && (
        <CandlestickChart
          symbol={selectedSymbol}
          onClose={() => setSelectedSymbol(null)}
        />
      )}
    </div>
  );
}
