# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY services/notification-service/package.json ./services/notification-service/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/types ./packages/types
COPY services/notification-service ./services/notification-service
COPY tsconfig.base.json ./

# Build
RUN npm run build --filter=@crypto-monitor/notification-service

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist
COPY --from=builder /app/services/notification-service/package.json ./services/notification-service/

# Install production dependencies only
WORKDIR /app/services/notification-service
RUN npm install --production

CMD ["node", "dist/index.js"]
