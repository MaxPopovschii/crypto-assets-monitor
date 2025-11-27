# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.base.json ./

# Copy packages
COPY packages ./packages

# Copy user-service
COPY services/user-service ./services/user-service

# Install dependencies
RUN npm install

# Build types package first
RUN cd packages/types && npm run build

# Build user-service
RUN cd services/user-service && npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy built artifacts
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/services/user-service/dist ./services/user-service/dist
COPY --from=builder /app/services/user-service/package.json ./services/user-service/

# Install production dependencies only
RUN npm install --production

# Set working directory to service
WORKDIR /app/services/user-service

# Expose port
EXPOSE 3003

# Start service
CMD ["node", "dist/index.js"]
