// Get the WebSocket URL based on the environment
export function getWebSocketUrl(): string {
  // Check if we're in GitHub Codespaces by examining the hostname
  const hostname = window.location.hostname;
  
  if (hostname.includes('app.github.dev')) {
    // In Codespaces, use the forwarded port URL
    // Replace the frontend port (5173) with gateway port (3000)
    const wsHostname = hostname.replace('-5173.', '-3000.');
    return `wss://${wsHostname}/ws`;
  }
  
  // Local development
  return 'ws://localhost:3000/ws';
}

// Get the API base URL
export function getApiBaseUrl(): string {
  // In Codespaces or production, use relative URLs which will be proxied by Vite
  if (import.meta.env.VITE_CODESPACE_NAME || window.location.hostname !== 'localhost') {
    return '/api';
  }
  
  // Local development - direct connection
  return 'http://localhost:3000/api';
}

export const MOCK_USER_ID = 'user-1';
export const MONITORED_SYMBOLS = ['BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'AVAX', 'LINK', 'MATIC', 'UNI', 'ATOM'];
