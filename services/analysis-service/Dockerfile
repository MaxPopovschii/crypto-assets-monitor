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

WORKDIR /app

# Copy built files
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/services/analysis-service/dist ./services/analysis-service/dist
COPY --from=builder /app/services/analysis-service/package.json ./services/analysis-service/

# Install production dependencies only
WORKDIR /app/services/analysis-service
RUN npm install --production

EXPOSE 3002

CMD ["node", "dist/index.js"]
