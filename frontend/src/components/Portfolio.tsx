import { useState } from 'react';
import { useUserStore } from '../store/user.store';
import { useWebSocketStore } from '../store/websocket.store';

export function Portfolio() {
  const { portfolio, portfolioValue, addToPortfolio } = useUserStore();
  const { prices } = useWebSocketStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [avgPrice, setAvgPrice] = useState('');

  const handleAdd = async () => {
    if (!symbol || !amount) return;
    
    await addToPortfolio(
      symbol.toUpperCase(),
      parseFloat(amount),
      avgPrice ? parseFloat(avgPrice) : undefined
    );
    
    setSymbol('');
    setAmount('');
    setAvgPrice('');
    setShowAddModal(false);
  };

  const calculateItemValue = (tokenSymbol: string, tokenAmount: number) => {
    const price = prices.get(tokenSymbol);
    return price ? tokenAmount * price.currentPrice : 0;
  };

  const calculateProfitLoss = (item: any) => {
    if (!item.averageBuyPrice) return null;
    const currentPrice = prices.get(item.tokenSymbol);
    if (!currentPrice) return null;
    
    const invested = item.amount * item.averageBuyPrice;
    const current = item.amount * currentPrice.currentPrice;
    const pl = current - invested;
    const plPercent = (pl / invested) * 100;
    
    return { pl, plPercent };
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Portfolio</h2>
          <p className="text-3xl font-bold text-green-400 mt-2">
            ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          + Add Position
        </button>
      </div>

      <div className="space-y-4">
        {portfolio.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No portfolio items yet</p>
        ) : (
          portfolio.map(item => {
            const currentValue = calculateItemValue(item.tokenSymbol, item.amount);
            const plData = calculateProfitLoss(item);
            
            return (
              <div key={item.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{item.tokenSymbol}</h3>
                    <p className="text-sm text-gray-400">Amount: {item.amount}</p>
                    {item.averageBuyPrice && (
                      <p className="text-sm text-gray-400">
                        Avg Buy: ${item.averageBuyPrice.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">
                      ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    {plData && (
                      <p className={`text-sm ${plData.pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {plData.pl >= 0 ? '+' : ''}${plData.pl.toFixed(2)} ({plData.plPercent.toFixed(2)}%)
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add to Portfolio</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Symbol</label>
                <input
                  type="text"
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  placeholder="BTC"
                  className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.5"
                  step="0.00000001"
                  className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Average Buy Price (Optional)</label>
                <input
                  type="number"
                  value={avgPrice}
                  onChange={e => setAvgPrice(e.target.value)}
                  placeholder="50000"
                  step="0.01"
                  className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
