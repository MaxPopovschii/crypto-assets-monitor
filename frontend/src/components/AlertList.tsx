import { Alert, AlertStatus } from '../types';
import { useAlertStore } from '../store/alert.store';

interface AlertListProps {
  alerts: Alert[];
}

export function AlertList({ alerts }: AlertListProps) {
  const { deleteAlert, loading } = useAlertStore();

  const activeAlerts = alerts.filter(a => a.status === AlertStatus.ACTIVE);
  const triggeredAlerts = alerts.filter(a => a.status === AlertStatus.TRIGGERED);

  const formatCondition = (condition: string) => {
    return condition.replace(/_/g, ' ').toLowerCase();
  };

  return (
    <div className="space-y-6">
      {/* Active Alerts */}
      <div>
        <h3 className="text-xl font-bold mb-4">Active Alerts ({activeAlerts.length})</h3>
        <div className="space-y-3">
          {activeAlerts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No active alerts</p>
          ) : (
            activeAlerts.map(alert => (
              <div key={alert.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-white">{alert.symbol}</span>
                      <span className="px-2 py-1 bg-blue-900 text-blue-300 text-xs rounded-full">
                        {formatCondition(alert.condition)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Target: <span className="text-white font-medium">${alert.targetValue.toLocaleString()}</span>
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Created {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    disabled={loading}
                    className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4">Triggered Alerts ({triggeredAlerts.length})</h3>
          <div className="space-y-3">
            {triggeredAlerts.map(alert => (
              <div key={alert.id} className="bg-gray-800 rounded-lg p-4 border border-green-700">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-white">{alert.symbol}</span>
                      <span className="px-2 py-1 bg-green-900 text-green-300 text-xs rounded-full">
                        Triggered
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      Target: <span className="text-white font-medium">${alert.targetValue.toLocaleString()}</span>
                    </p>
                    {alert.triggeredAt && (
                      <p className="text-green-400 text-xs mt-1">
                        Triggered {new Date(alert.triggeredAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
