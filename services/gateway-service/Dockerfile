# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files for better layer caching
COPY package.json turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY services/gateway-service/package.json ./services/gateway-service/

# Install dependencies (cached if package.json unchanged)
RUN npm ci --only=production=false

# Copy source code
COPY packages/types ./packages/types
COPY services/gateway-service ./services/gateway-service
COPY tsconfig.base.json ./

# Build
RUN npm run build --filter=@crypto-monitor/gateway-service

# Production stage
FROM node:18-alpine

# Add security: non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy built files with correct ownership
COPY --from=builder --chown=nodejs:nodejs /app/packages/types/dist ./packages/types/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/types/package.json ./packages/types/
COPY --from=builder --chown=nodejs:nodejs /app/services/gateway-service/dist ./services/gateway-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/gateway-service/package.json ./services/gateway-service/

# Install production dependencies only
WORKDIR /app/services/gateway-service
RUN npm ci --only=production && npm cache clean --force

# Switch to non-root user
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
