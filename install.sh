#!/bin/bash

echo "🚀 Installing Crypto Assets Monitor Dependencies"
echo ""

# Install root dependencies (includes turbo)
echo "📦 Installing root dependencies..."
npm install

echo ""
echo "📦 Installing workspace dependencies..."
npm install --workspaces

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Start Docker: docker-compose up -d redis timescaledb"
echo "2. Run dev mode: npm run dev"
echo "3. Open http://localhost:5173"
echo ""
echo "New features available:"
echo "  - TradingView Charts (click any coin)"
echo "  - Watchlist (star icon)"
echo "  - Portfolio Management"
echo "  - User Authentication"
