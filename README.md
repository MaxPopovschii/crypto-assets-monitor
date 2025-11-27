# 🚀 Crypto Assets Monitor - Real-Time Price Tracking System

A high-performance, scalable microservices-based cryptocurrency monitoring platform with real-time WebSocket updates, intelligent alerting, and time-series data analytics.

## 📋 Overview

This system monitors cryptocurrency prices in real-time, processes market data, triggers user-defined alerts, and delivers instant notifications. Built with TypeScript and a modern microservices architecture, it demonstrates enterprise-level patterns for handling streaming data and high-throughput scenarios.

### 🎯 Key Features

- **Real-time Price Ingestion**: Fetches crypto prices from CoinGecko API every 10 seconds
- **WebSocket Live Updates**: Instant price updates pushed to connected clients
- **Smart Alerts**: User-defined price alerts with multiple conditions
- **Time-Series Storage**: Historical price data stored in TimescaleDB
- **Multi-Channel Notifications**: Email notifications (extendable to push/Telegram)
- **Strict TypeScript**: End-to-end type safety from backend to frontend
- **Microservices Architecture**: Independent, scalable services
- **Redis Pub/Sub**: High-performance message broker
- **React Dashboard**: Modern, responsive UI with real-time updates

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │ (WebSocket Client)
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│ Gateway Service │────▶│    Redis     │
│  (WebSocket +   │     │   Pub/Sub    │
│   REST API)     │     └──────┬───────┘
└─────────────────┘            │
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌──────────────────┐
│    Ingestion    │   │    Analysis     │   │   Notification   │
│     Service     │   │     Service     │   │     Service      │
│                 │   │                 │   │                  │
│ • Fetch prices  │   │ • Check alerts  │   │ • Send emails    │
│ • Publish data  │   │ • Store history │   │ • Push notifs    │
└────────┬────────┘   └────────┬────────┘   └──────────────────┘
         │                     │
         │                     ▼
         │            ┌─────────────────┐
         └───────────▶│  TimescaleDB    │
                      │ (Time Series)   │
                      └─────────────────┘
```

## 🛠️ Technology Stack

### Backend Services
- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3+
- **Message Broker**: Redis (Pub/Sub)
- **Database**: TimescaleDB (PostgreSQL with time-series extension)
- **WebSocket**: ws library
- **HTTP Framework**: Express.js
- **Logging**: Pino

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Charts**: Recharts (ready for integration)

### DevOps
- **Containerization**: Docker & Docker Compose
- **Monorepo**: Turborepo
- **Package Manager**: npm workspaces

## 📦 Project Structure

```
crypto-assets-monitor/
├── packages/
│   └── types/                    # Shared TypeScript types
│       ├── src/
│       │   └── index.ts         # Complete type definitions
│       └── package.json
│
├── services/
│   ├── ingestion-service/       # Price data ingestion
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── coingecko.client.ts
│   │   │   ├── redis.client.ts
│   │   │   └── ingestion.service.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── analysis-service/        # Alert checking & analytics
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── database.client.ts
│   │   │   ├── analysis.service.ts
│   │   │   └── api.server.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── notification-service/    # Email/Push notifications
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── email.provider.ts
│   │   │   └── notification.service.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── gateway-service/         # API Gateway + WebSocket
│       ├── src/
│       │   ├── index.ts
│       │   └── websocket.manager.ts
│       ├── Dockerfile
│       └── package.json
│
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/
│   │   │   ├── PriceCard.tsx
│   │   │   ├── AlertList.tsx
│   │   │   ├── CreateAlertModal.tsx
│   │   │   └── AlertNotification.tsx
│   │   ├── store/
│   │   │   ├── websocket.store.ts
│   │   │   └── alert.store.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── docker-compose.yml
├── turbo.json
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Docker and Docker Compose
- Gmail account (for email notifications) or SMTP server

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/crypto-assets-monitor.git
cd crypto-assets-monitor
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
# Edit .env with your SMTP credentials
nano .env
```

4. **Start infrastructure with Docker**
```bash
# Start Redis and TimescaleDB
docker-compose up redis timescaledb -d
```

5. **Build the project**
```bash
npm run build
```

### Running in Development

**Option 1: Run all services with Turbo (recommended)**
```bash
npm run dev
```

**Option 2: Run services individually**

```bash
# Terminal 1 - Ingestion Service
cd services/ingestion-service
npm run dev

# Terminal 2 - Analysis Service
cd services/analysis-service
npm run dev

# Terminal 3 - Notification Service
cd services/notification-service
npm run dev

# Terminal 4 - Gateway Service
cd services/gateway-service
npm run dev

# Terminal 5 - Frontend
cd frontend
npm run dev
```

### Running with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## 🔧 Service Details

### Ingestion Service (Port: N/A - Background)
- **Purpose**: Fetches cryptocurrency prices from CoinGecko API
- **Interval**: Configurable (default: 10 seconds)
- **Output**: Publishes price updates to Redis
- **Monitored Assets**: BTC, ETH, ADA, SOL, DOT, AVAX, LINK, MATIC, UNI, ATOM

### Analysis Service (Port: 3002)
- **Purpose**: Processes price data and triggers alerts
- **Endpoints**:
  - `POST /alerts` - Create a new alert
  - `GET /alerts/user/:userId` - Get user alerts
  - `DELETE /alerts/:alertId` - Cancel an alert
  - `GET /prices/:symbol/history` - Get price history
  - `GET /health` - Health check
- **Database**: TimescaleDB for time-series data

### Notification Service (Port: N/A - Background)
- **Purpose**: Sends email notifications when alerts trigger
- **Channels**: Email (SMTP)
- **Extensible**: Ready for push notifications and Telegram

### Gateway Service (Port: 3000)
- **Purpose**: API Gateway + WebSocket server
- **WebSocket Path**: `/ws`
- **REST API**: Proxies requests to Analysis Service
- **Features**:
  - Real-time price broadcasting
  - Symbol-based subscriptions
  - User-specific alert notifications
  - Heartbeat/ping-pong

### Frontend (Port: 5173)
- **URL**: http://localhost:5173
- **Features**:
  - Real-time price cards with 24h changes
  - Create/manage price alerts
  - Live alert notifications
  - WebSocket connection status
  - Responsive design

## 📊 TypeScript Type Safety

The project demonstrates advanced TypeScript patterns:

### Shared Types Package
All services and frontend share the same type definitions from `@crypto-monitor/types`:

```typescript
// Asset price data with strict types
interface AssetPrice {
  symbol: string;
  currentPrice: number;
  priceChange24h: number;
  // ... more fields
}

// WebSocket messages are strongly typed
interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  payload: T;
  timestamp: Date;
}

// Alert conditions with enums
enum AlertCondition {
  ABOVE = 'ABOVE',
  BELOW = 'BELOW',
  // ...
}
```

### Type-Safe WebSocket Communication
```typescript
// Frontend knows exactly what data to expect
const message: WebSocketMessage<PriceUpdatePayload> = {
  type: WebSocketMessageType.PRICE_UPDATE,
  payload: { assets: [...] },
  timestamp: new Date()
};
```

## 🧪 Testing the System

### 1. Create an Alert

**Via Frontend:**
1. Open http://localhost:5173
2. Click "Create Alert"
3. Select symbol (e.g., BTC)
4. Set condition (Above/Below)
5. Enter target price
6. Submit

**Via API:**
```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-1",
    "symbol": "BTC",
    "condition": "ABOVE",
    "targetValue": 50000
  }'
```

### 2. Monitor Real-Time Updates
- Watch the frontend for live price updates
- Prices refresh every 10 seconds
- Connection status indicator shows WebSocket state

### 3. Receive Notifications
When an alert triggers:
1. Frontend shows popup notification
2. Email sent to configured address
3. Alert status updated in database

## 🔐 Environment Variables

### Ingestion Service
```bash
COINGECKO_API_URL=https://api.coingecko.com/api/v3
INGESTION_INTERVAL_MS=10000
MONITORED_SYMBOLS=bitcoin,ethereum,cardano,...
```

### Analysis Service
```bash
TIMESCALE_HOST=localhost
TIMESCALE_PORT=5432
TIMESCALE_DATABASE=crypto_monitor
TIMESCALE_USER=postgres
TIMESCALE_PASSWORD=postgres
```

### Notification Service
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=Crypto Monitor <noreply@cryptomonitor.com>
```

### Gateway Service
```bash
PORT=3000
CORS_ORIGIN=http://localhost:5173
ANALYSIS_SERVICE_URL=http://localhost:3002
```

## 📈 Scaling Considerations

### High Throughput Optimization
1. **Redis Pub/Sub**: Decouples services for horizontal scaling
2. **TimescaleDB**: Optimized for time-series queries
3. **Stateless Services**: Easy to replicate
4. **Connection Pooling**: Database connections reused

### Production Deployment
- Use Kubernetes for orchestration
- Implement rate limiting on Gateway
- Add Redis clustering for high availability
- Use managed TimescaleDB (e.g., Timescale Cloud)
- Implement circuit breakers between services
- Add monitoring with Prometheus/Grafana

## 🛡️ Security Best Practices

- API keys stored in environment variables
- Database credentials never committed
- CORS configured for frontend origin
- WebSocket connections can validate JWT tokens (extend as needed)
- Prepared statements prevent SQL injection

## 🎓 Learning Objectives Demonstrated

1. **Microservices Architecture**: Independent, scalable services
2. **Real-Time Communication**: WebSocket implementation
3. **Message Queuing**: Redis Pub/Sub patterns
4. **Time-Series Data**: TimescaleDB usage
5. **TypeScript Best Practices**: Strict typing, shared types
6. **Docker Containerization**: Multi-service orchestration
7. **Modern Frontend**: React with real-time state management
8. **API Design**: RESTful endpoints and WebSocket protocols

---

Built with ❤️ using TypeScript, Node.js, React, and modern cloud-native technologies.