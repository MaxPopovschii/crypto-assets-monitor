# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json turbo.json ./
COPY packages/types/package.json ./packages/types/
COPY services/analysis-service/package.json ./services/analysis-service/

# Install dependencies
RUN npm install

# Copy source code
COPY packages/types ./packages/types
COPY services/analysis-service ./services/analysis-service
COPY tsconfig.base.json ./

# Build
RUN npm run build --filter=@crypto-monitor/analysis-service

# Production stage
FROM node:18-alpine

# Add non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy built files
COPY --from=builder --chown=nodejs:nodejs /app/packages/types/dist ./packages/types/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/types/package.json ./packages/types/
COPY --from=builder --chown=nodejs:nodejs /app/services/analysis-service/dist ./services/analysis-service/dist
COPY --from=builder --chown=nodejs:nodejs /app/services/analysis-service/package.json ./services/analysis-service/

# Install production dependencies only
WORKDIR /app/services/analysis-service
RUN npm ci --only=production && npm cache clean --force

# Switch to non-root user
USER nodejs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
