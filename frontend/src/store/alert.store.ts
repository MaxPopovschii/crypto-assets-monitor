import { create } from 'zustand';
import {
  Alert,
  CreateAlertRequest,
  AlertCondition,
  ApiResponse
} from '../types';

interface AlertState {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  fetchAlerts: (userId: string) => Promise<void>;
  createAlert: (request: CreateAlertRequest) => Promise<void>;
  deleteAlert: (alertId: string) => Promise<void>;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  loading: false,
  error: null,

  fetchAlerts: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/alerts/user/${userId}`);
      const data: ApiResponse<Alert[]> = await response.json();
      
      if (data.success && data.data) {
        set({ alerts: data.data, loading: false });
      } else {
        set({ error: data.error?.message || 'Failed to fetch alerts', loading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch alerts', loading: false });
    }
  },

  createAlert: async (request: CreateAlertRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      
      const data: ApiResponse<Alert> = await response.json();
      
      if (data.success && data.data) {
        set((state) => ({
          alerts: [...state.alerts, data.data!],
          loading: false
        }));
      } else {
        set({ error: data.error?.message || 'Failed to create alert', loading: false });
      }
    } catch (error) {
      set({ error: 'Failed to create alert', loading: false });
    }
  },

  deleteAlert: async (alertId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE'
      });
      
      const data: ApiResponse<null> = await response.json();
      
      if (data.success) {
        set((state) => ({
          alerts: state.alerts.filter(alert => alert.id !== alertId),
          loading: false
        }));
      } else {
        set({ error: data.error?.message || 'Failed to delete alert', loading: false });
      }
    } catch (error) {
      set({ error: 'Failed to delete alert', loading: false });
    }
  }
}));
