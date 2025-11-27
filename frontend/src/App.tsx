import { useEffect, useState } from 'react';
import { useWebSocketStore } from './store/websocket.store';
import { useAlertStore } from './store/alert.store';
import { useUserStore } from './store/user.store';
import { PriceCard } from './components/PriceCard';
import { CreateAlertModal } from './components/CreateAlertModal';
import { AlertList } from './components/AlertList';
import { AlertNotification } from './components/AlertNotification';
import { Portfolio } from './components/Portfolio';
import { Watchlist } from './components/Watchlist';
import { CandlestickChart } from './components/CandlestickChart';
import { Profile } from './components/Profile';
import { getWebSocketUrl, MOCK_USER_ID, MONITORED_SYMBOLS } from './config';

function App() {
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'watchlist' | 'portfolio' | 'profile'>('all');
  const [portfolioFlash, setPortfolioFlash] = useState(false);
  const [prevPortfolioValue, setPrevPortfolioValue] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const { connect, disconnect, connected, prices, isUsingRealData } = useWebSocketStore();
  const { alerts, fetchAlerts } = useAlertStore();
  const { user, watchlist, portfolio, portfolioValue, addToWatchlist, removeFromWatchlist, calculatePortfolioValue } = useUserStore();

  useEffect(() => {
    // Connect to WebSocket
    connect(getWebSocketUrl(), MONITORED_SYMBOLS, MOCK_USER_ID);

    // Fetch user alerts
    fetchAlerts(MOCK_USER_ID);

    return () => {
      disconnect();
    };
  }, []);

  useEffect(() => {
    if (prices.size > 0) {
      calculatePortfolioValue(prices);
      setLastUpdate(new Date()); // Aggiorna timestamp
    }
  }, [prices, portfolio]);

  // Flash animation per portfolio value changes
  useEffect(() => {
    if (portfolioValue !== prevPortfolioValue && prevPortfolioValue !== 0) {
      setPortfolioFlash(true);
      const timer = setTimeout(() => setPortfolioFlash(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevPortfolioValue(portfolioValue);
  }, [portfolioValue, prevPortfolioValue]);

  const priceArray = Array.from(prices.values());

  const toggleWatchlist = async (symbol: string) => {
    console.log('Toggle watchlist for:', symbol, 'Current watchlist:', watchlist);
    if (watchlist.includes(symbol.toUpperCase())) {
      await removeFromWatchlist(symbol);
    } else {
      await addToWatchlist(symbol);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">
                <span className="bg-gradient-to-r from-primary-400 to-purple-400 text-transparent bg-clip-text">
                  Crypto Assets Monitor
                </span>
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Real-time cryptocurrency tracking with portfolio management
              </p>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="text-right bg-gray-700 px-4 py-2 rounded-lg border border-gray-600 relative overflow-hidden">
                  {portfolioFlash && (
                    <div className="absolute inset-0 bg-green-500 opacity-20 animate-pulse" />
                  )}
                  <p className="text-sm text-gray-400 mb-1">Portfolio Value</p>
                  <div className="flex items-center gap-2">
                    <p className={`text-xl font-bold transition-all duration-300 ${
                      portfolioFlash ? 'text-green-400 scale-105' : 'text-green-400'
                    }`}>
                      ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded-lg border border-green-500/30">
                <div className={`w-3 h-3 rounded-full transition-all ${
                  connected ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50' : 'bg-red-500'
                }`}></div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-300 font-medium">
                    {connected ? '🔴 LIVE' : 'Disconnected'}
                  </span>
                  {connected && (
                    <span className="text-xs text-gray-400">
                      {isUsingRealData ? '📡 Real Data (CoinGecko)' : '🎮 Demo Mode'}
                    </span>
                  )}
                </div>
                {connected && (
                  <span className="text-xs text-green-400 font-mono animate-pulse ml-2">
                    {lastUpdate.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowCreateAlert(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Create Alert
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'all'
                  ? 'text-primary-400 border-primary-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              All Coins
            </button>
            <button
              onClick={() => setActiveTab('watchlist')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'watchlist'
                  ? 'text-primary-400 border-primary-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Watchlist ({watchlist.length})
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'portfolio'
                  ? 'text-primary-400 border-primary-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Portfolio ({portfolio.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                activeTab === 'profile'
                  ? 'text-primary-400 border-primary-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              Profile
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area - 2/3 width */}
          <div className="lg:col-span-2">
            {activeTab === 'all' && (
              <>
                <h2 className="text-2xl font-bold mb-6">Live Prices</h2>
                {priceArray.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading prices...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {priceArray.map(asset => (
                      <PriceCard
                        key={asset.symbol}
                        asset={asset}
                        isInWatchlist={watchlist.includes(asset.symbol.toUpperCase())}
                        onToggleWatchlist={toggleWatchlist}
                        onShowChart={(symbol) => {
                          console.log('Opening chart for:', symbol);
                          setSelectedSymbol(symbol);
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'watchlist' && <Watchlist />}

            {activeTab === 'portfolio' && <Portfolio />}

            {activeTab === 'profile' && <Profile />}
          </div>

          {/* Alerts Sidebar - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <h2 className="text-2xl font-bold mb-6">Your Alerts</h2>
              <AlertList alerts={alerts} />
            </div>
          </div>
        </div>
      </main>

      {/* Modals and Notifications */}
      <CreateAlertModal
        isOpen={showCreateAlert}
        onClose={() => setShowCreateAlert(false)}
        availableSymbols={MONITORED_SYMBOLS}
        userId={MOCK_USER_ID}
      />
      <AlertNotification />
      
      {selectedSymbol && (
        <CandlestickChart
          symbol={selectedSymbol}
          onClose={() => setSelectedSymbol(null)}
        />
      )}
    </div>
  );
}

export default App;
