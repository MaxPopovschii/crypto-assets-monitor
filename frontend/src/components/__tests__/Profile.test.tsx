import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Profile } from '../Profile';
import { useUserStore } from '../../store/user.store';
import { useWebSocketStore } from '../../store/websocket.store';
import { useAlertStore } from '../../store/alert.store';

// Mock stores
vi.mock('../../store/user.store');
vi.mock('../../store/websocket.store');
vi.mock('../../store/alert.store');

describe('Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show login message when user is not authenticated', () => {
    (useUserStore as any).mockReturnValue({
      user: null,
      watchlist: [],
      portfolio: [],
      portfolioValue: 0,
    });
    (useWebSocketStore as any).mockReturnValue({ prices: new Map() });
    (useAlertStore as any).mockReturnValue({ alerts: [] });

    render(<Profile />);
    
    expect(screen.getByText('Please login to view your profile')).toBeInTheDocument();
  });

  it('should render user profile when authenticated', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      displayName: 'Test User',
      isPro: true,
      isVerified: true,
    };

    (useUserStore as any).mockReturnValue({
      user: mockUser,
      watchlist: [],
      portfolio: [],
      portfolioValue: 10000,
    });
    (useWebSocketStore as any).mockReturnValue({ prices: new Map() });
    (useAlertStore as any).mockReturnValue({ alerts: [] });

    render(<Profile />);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('should calculate profit/loss correctly', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    const mockPortfolio = [
      { tokenSymbol: 'BTC', amount: 1, averageBuyPrice: 40000 },
      { tokenSymbol: 'ETH', amount: 10, averageBuyPrice: 2000 },
    ];

    const mockPrices = new Map([
      ['BTC', { currentPrice: 50000, priceChange24h: 5 }],
      ['ETH', { currentPrice: 2500, priceChange24h: 3 }],
    ]);

    (useUserStore as any).mockReturnValue({
      user: mockUser,
      watchlist: [],
      portfolio: mockPortfolio,
      portfolioValue: 75000,
    });
    (useWebSocketStore as any).mockReturnValue({ prices: mockPrices });
    (useAlertStore as any).mockReturnValue({ alerts: [] });

    render(<Profile />);

    // Total cost: 40000 + 20000 = 60000
    // Current value: 50000 + 25000 = 75000
    // Profit: 15000 (25%)
    await waitFor(() => {
      expect(screen.getByText(/15.*000/)).toBeInTheDocument(); // Profit display
    });
  });
});
