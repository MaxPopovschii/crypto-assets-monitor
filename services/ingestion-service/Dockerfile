# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY services/ingestion-service/package.json ./services/ingestion-service/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/types ./packages/types
COPY services/ingestion-service ./services/ingestion-service
COPY tsconfig.base.json ./

# Build
RUN npm run build --filter=@crypto-monitor/ingestion-service

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/services/ingestion-service/dist ./services/ingestion-service/dist
COPY --from=builder /app/services/ingestion-service/package.json ./services/ingestion-service/

# Install production dependencies only
WORKDIR /app/services/ingestion-service
RUN npm install --production

CMD ["node", "dist/index.js"]
