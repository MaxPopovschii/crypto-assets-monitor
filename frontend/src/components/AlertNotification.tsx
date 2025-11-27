import { useEffect } from 'react';
import { useWebSocketStore } from '../store/websocket.store';

export function AlertNotification() {
  const { triggeredAlert, clearTriggeredAlert } = useWebSocketStore();

  useEffect(() => {
    if (triggeredAlert) {
      // Auto-dismiss after 10 seconds
      const timeout = setTimeout(() => {
        clearTriggeredAlert();
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [triggeredAlert, clearTriggeredAlert]);

  if (!triggeredAlert) return null;

  return (
    <div className="fixed top-4 right-4 max-w-md bg-gradient-to-r from-primary-600 to-purple-600 text-white rounded-lg shadow-2xl p-6 z-50 animate-slide-in">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚨</span>
          <h3 className="text-lg font-bold">Alert Triggered!</h3>
        </div>
        <button
          onClick={clearTriggeredAlert}
          className="text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm">
          <span className="font-bold">{triggeredAlert.symbol}</span> has reached your alert price!
        </p>
        <div className="bg-white bg-opacity-20 rounded p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span>Target:</span>
            <span className="font-bold">${triggeredAlert.targetValue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Current:</span>
            <span className="font-bold">${triggeredAlert.currentPrice.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
