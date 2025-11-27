import { useState } from 'react';
import { AlertCondition, CreateAlertRequest } from '../types';
import { useAlertStore } from '../store/alert.store';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableSymbols: string[];
  userId: string;
}

export function CreateAlertModal({ isOpen, onClose, availableSymbols, userId }: CreateAlertModalProps) {
  const [symbol, setSymbol] = useState('');
  const [condition, setCondition] = useState<AlertCondition>(AlertCondition.ABOVE);
  const [targetValue, setTargetValue] = useState('');
  
  const { createAlert, loading } = useAlertStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const request: CreateAlertRequest = {
      userId,
      symbol,
      condition,
      targetValue: parseFloat(targetValue)
    };

    await createAlert(request);
    
    // Reset form
    setSymbol('');
    setCondition(AlertCondition.ABOVE);
    setTargetValue('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Create Price Alert</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Symbol</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select a symbol</option>
              {availableSymbols.map(sym => (
                <option key={sym} value={sym}>{sym}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Condition</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as AlertCondition)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value={AlertCondition.ABOVE}>Above</option>
              <option value={AlertCondition.BELOW}>Below</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Target Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Alert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
