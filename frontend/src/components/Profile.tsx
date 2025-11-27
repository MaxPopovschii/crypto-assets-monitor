import { useState, useEffect } from 'react';
import { useUserStore } from '../store/user.store';
import { useWebSocketStore } from '../store/websocket.store';
import { useAlertStore } from '../store/alert.store';
import './Profile.css';

export function Profile() {
  const { user, watchlist, portfolio, portfolioValue } = useUserStore();
  const { prices } = useWebSocketStore();
  const { alerts } = useAlertStore();
  const [activeSection, setActiveSection] = useState<'overview' | 'stats' | 'settings'>('overview');
  const [totalProfitLoss, setTotalProfitLoss] = useState(0);
  const [totalProfitLossPercentage, setTotalProfitLossPercentage] = useState(0);

  useEffect(() => {
    if (portfolio.length > 0 && prices.size > 0) {
      let totalCost = 0;
      let currentValue = 0;

      portfolio.forEach(item => {
        const price = prices.get(item.tokenSymbol);
        if (price) {
          const cost = item.amount * (item.averageBuyPrice || 0);
          const value = item.amount * price.currentPrice;
          totalCost += cost;
          currentValue += value;
        }
      });

      const profitLoss = currentValue - totalCost;
      const profitLossPercentage = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
      
      setTotalProfitLoss(profitLoss);
      setTotalProfitLossPercentage(profitLossPercentage);
    }
  }, [portfolio, prices]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Please login to view your profile</p>
      </div>
    );
  }

  const totalInvested = portfolio.reduce((sum, item) => {
    return sum + (item.amount * (item.averageBuyPrice || 0));
  }, 0);

  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE').length;
  const triggeredAlerts = alerts.filter(a => a.status === 'TRIGGERED').length;

  // Generate avatar gradient based on user email
  const generateAvatarGradient = (email: string) => {
    const hash = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue1 = hash % 360;
    const hue2 = (hash * 2) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 70%, 60%), hsl(${hue2}, 70%, 50%))`;
  };

  return (
    <div className="space-y-6">
      {/* Profile Header - Completamente Ridisegnato */}
      <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden border border-gray-700/50 shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        {/* Gradient Overlay Top */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600/20 to-transparent"></div>
        
        <div className="relative p-8">
          <div className="flex items-start gap-8">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div 
                className="relative w-32 h-32 rounded-3xl flex items-center justify-center text-5xl font-bold text-white shadow-2xl ring-4 ring-white/10 transition-transform group-hover:scale-105"
                style={{ background: generateAvatarGradient(user.email) }}
              >
                <span className="drop-shadow-lg">
                  {user.nickname?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full border-4 border-gray-900 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 pt-2">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                    {user.nickname || 'Crypto Trader'}
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
                      PRO
                    </span>
                  </h2>
                  <p className="text-gray-300 text-lg mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {user.email}
                  </p>
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Member since {new Date(user.createdAt).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Active now
                    </div>
                  </div>
                </div>

                {/* Edit Profile Button */}
                <button className="px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg transition-colors flex items-center gap-2 border border-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Profile
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-gradient-to-br from-blue-600/20 to-blue-700/10 rounded-xl p-4 border border-blue-500/30">
                  <p className="text-sm text-blue-300 mb-1">Portfolio Value</p>
                  <p className="text-3xl font-bold text-white">
                    ${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className={`bg-gradient-to-br rounded-xl p-4 border ${
                  totalProfitLoss >= 0 
                    ? 'from-green-600/20 to-green-700/10 border-green-500/30' 
                    : 'from-red-600/20 to-red-700/10 border-red-500/30'
                }`}>
                  <p className={`text-sm mb-1 ${totalProfitLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    Total P/L
                  </p>
                  <p className={`text-3xl font-bold ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {totalProfitLoss >= 0 ? '+' : ''}${Math.abs(totalProfitLoss).toLocaleString(undefined, { 
                      minimumFractionDigits: 2, 
                      maximumFractionDigits: 2 
                    })}
                  </p>
                  <p className={`text-sm ${totalProfitLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLossPercentage.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-600/20 to-purple-700/10 rounded-xl p-4 border border-purple-500/30">
                  <p className="text-sm text-purple-300 mb-1">Total Invested</p>
                  <p className="text-3xl font-bold text-white">
                    ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex gap-4 border-b border-gray-700/50 bg-gray-900/50 rounded-t-xl px-6">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-6 py-4 font-semibold transition-all border-b-2 relative ${
            activeSection === 'overview'
              ? 'text-blue-400 border-blue-400'
              : 'text-gray-400 border-transparent hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Overview
          </div>
        </button>
        <button
          onClick={() => setActiveSection('stats')}
          className={`px-6 py-4 font-semibold transition-all border-b-2 relative ${
            activeSection === 'stats'
              ? 'text-blue-400 border-blue-400'
              : 'text-gray-400 border-transparent hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Statistics
          </div>
        </button>
        <button
          onClick={() => setActiveSection('settings')}
          className={`px-6 py-4 font-semibold transition-all border-b-2 relative ${
            activeSection === 'settings'
              ? 'text-blue-400 border-blue-400'
              : 'text-gray-400 border-transparent hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </div>
        </button>
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="section-content grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Portfolio Card */}
          <div className="overview-card stat-card bg-gradient-to-br from-blue-600/10 to-blue-700/5 rounded-xl p-6 border border-blue-500/20 hover:border-blue-500/40">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">
                PORTFOLIO
              </span>
            </div>
            <h3 className="text-sm font-semibold text-blue-300 mb-2">Total Assets</h3>
            <p className="text-5xl font-bold text-white mb-3">{portfolio.length}</p>
            <p className="text-sm text-gray-400 mb-6">cryptocurrencies tracked</p>
            <div className="pt-4 border-t border-blue-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 font-semibold">TOTAL INVESTED</span>
                <span className="text-lg font-bold text-white">
                  ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Watchlist Card */}
          <div className="overview-card stat-card bg-gradient-to-br from-yellow-600/10 to-yellow-700/5 rounded-xl p-6 border border-yellow-500/20 hover:border-yellow-500/40">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </div>
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-bold rounded-full">
                WATCHLIST
              </span>
            </div>
            <h3 className="text-sm font-semibold text-yellow-300 mb-2">Favorite Coins</h3>
            <p className="text-5xl font-bold text-white mb-3">{watchlist.length}</p>
            <p className="text-sm text-gray-400 mb-6">coins being monitored</p>
            <div className="pt-4 border-t border-yellow-500/20">
              <div className="flex flex-wrap gap-2">
                {watchlist.slice(0, 5).map(symbol => (
                  <span key={symbol} className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-lg text-xs text-yellow-300 font-semibold transition-colors">
                    {symbol}
                  </span>
                ))}
                {watchlist.length > 5 && (
                  <span className="px-3 py-1.5 bg-gray-700/50 rounded-lg text-xs text-gray-400 font-semibold">
                    +{watchlist.length - 5}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Alerts Card */}
          <div className="overview-card stat-card bg-gradient-to-br from-purple-600/10 to-purple-700/5 rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40">
            <div className="flex items-start justify-between mb-6">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">
                ALERTS
              </span>
            </div>
            <h3 className="text-sm font-semibold text-purple-300 mb-2">Price Notifications</h3>
            <p className="text-5xl font-bold text-white mb-3">{alerts.length}</p>
            <p className="text-sm text-gray-400 mb-6">total alerts configured</p>
            <div className="pt-4 border-t border-purple-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-400">Active</span>
                </div>
                <span className="text-lg text-green-400 font-bold">{activeAlerts}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-400">Triggered</span>
                </div>
                <span className="text-lg text-yellow-400 font-bold">{triggeredAlerts}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Section */}
      {activeSection === 'stats' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">Performance Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Total Profit/Loss</p>
                <p className={`text-3xl font-bold ${totalProfitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalProfitLoss >= 0 ? '+' : ''}${Math.abs(totalProfitLoss).toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </p>
                <p className={`text-sm ${totalProfitLoss >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {totalProfitLoss >= 0 ? '+' : ''}{totalProfitLossPercentage.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Average Position Size</p>
                <p className="text-3xl font-bold text-white">
                  ${portfolio.length > 0 ? (totalInvested / portfolio.length).toLocaleString(undefined, { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  }) : '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">Top Holdings</h3>
            <div className="space-y-4">
              {portfolio
                .map(item => {
                  const price = prices.get(item.tokenSymbol);
                  const value = price ? item.amount * price.currentPrice : 0;
                  return { ...item, value };
                })
                .sort((a, b) => b.value - a.value)
                .slice(0, 5)
                .map((item, index) => {
                  const price = prices.get(item.tokenSymbol);
                  const profitLoss = price && item.averageBuyPrice 
                    ? (price.currentPrice - item.averageBuyPrice) * item.amount 
                    : 0;
                  const percentage = portfolioValue > 0 ? (item.value / portfolioValue) * 100 : 0;

                  return (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-semibold text-white">{item.tokenSymbol}</span>
                          <span className="text-white font-medium">
                            ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">{item.amount} units</span>
                          <span className={profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {profitLoss >= 0 ? '+' : ''}${Math.abs(profitLoss).toLocaleString(undefined, { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">Account Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Nickname</label>
                <input
                  type="text"
                  value={user.nickname || ''}
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Email Notifications</p>
                  <p className="text-sm text-gray-400">Receive alerts via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Browser Notifications</p>
                  <p className="text-sm text-gray-400">Show desktop notifications</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-6">Data Management</h3>
            <div className="space-y-4">
              <button className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                Export Portfolio Data
              </button>
              <button className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                Clear Watchlist
              </button>
              <button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
