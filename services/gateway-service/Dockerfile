# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY services/gateway-service/package.json ./services/gateway-service/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/types ./packages/types
COPY services/gateway-service ./services/gateway-service
COPY tsconfig.base.json ./

# Build
RUN npm run build --filter=@crypto-monitor/gateway-service

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/services/gateway-service/dist ./services/gateway-service/dist
COPY --from=builder /app/services/gateway-service/package.json ./services/gateway-service/

# Install production dependencies only
WORKDIR /app/services/gateway-service
RUN npm install --production

EXPOSE 3000

CMD ["node", "dist/index.js"]
