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

# Add non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy built files
COPY --from=builder --chown=nodejs:nodejs /app/packages/types/dist ./packages/types/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/types/package.json ./packages/types/
COPY --from=builder --chown=nodejs:nodejs /app/services/ingestion-service/dist ./services/ingestion-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/ingestion-service/package.json ./services/ingestion-service/
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Set working directory
WORKDIR /app/services/ingestion-service

# Switch to non-root user
USER nodejs

CMD ["node", "dist/index.js"]
