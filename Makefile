# Makefile for Crypto Assets Monitor

.PHONY: help install build dev start stop clean docker-up docker-down docker-rebuild logs test

# Default target
help:
	@echo "Crypto Assets Monitor - Available Commands:"
	@echo ""
	@echo "  make install        - Install all dependencies"
	@echo "  make build          - Build all services"
	@echo "  make dev            - Run all services in development mode"
	@echo "  make start          - Start all services in production mode"
	@echo "  make stop           - Stop all running services"
	@echo "  make clean          - Clean build artifacts and node_modules"
	@echo ""
	@echo "  make docker-up      - Start Docker services (Redis, TimescaleDB)"
	@echo "  make docker-down    - Stop Docker services"
	@echo "  make docker-rebuild - Rebuild and restart Docker services"
	@echo "  make docker-logs    - View Docker logs"
	@echo ""
	@echo "  make db-connect     - Connect to TimescaleDB"
	@echo "  make redis-cli      - Connect to Redis CLI"
	@echo ""
	@echo "  make test           - Run tests (when implemented)"
	@echo "  make lint           - Run linting"
	@echo ""

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install

# Build all services
build:
	@echo "🔨 Building all services..."
	npm run build

# Run in development mode
dev:
	@echo "🚀 Starting development servers..."
	npm run dev

# Start production services
start: build
	@echo "▶️  Starting production services..."
	npm start

# Stop all services
stop:
	@echo "⏹️  Stopping services..."
	pkill -f "node dist/index.js" || true

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	npm run clean
	rm -rf node_modules
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	find . -name "dist" -type d -prune -exec rm -rf '{}' +

# Docker commands
docker-up:
	@echo "🐳 Starting Docker services..."
	docker-compose up -d redis timescaledb
	@echo "⏳ Waiting for services to be ready..."
	sleep 5
	docker-compose ps

docker-down:
	@echo "🛑 Stopping Docker services..."
	docker-compose down

docker-rebuild:
	@echo "🔄 Rebuilding Docker services..."
	docker-compose down
	docker-compose build
	docker-compose up -d

docker-logs:
	@echo "📋 Showing Docker logs..."
	docker-compose logs -f

# Database commands
db-connect:
	@echo "🗄️  Connecting to TimescaleDB..."
	docker exec -it crypto-monitor-timescaledb psql -U postgres -d crypto_monitor

redis-cli:
	@echo "🔴 Connecting to Redis..."
	docker exec -it crypto-monitor-redis redis-cli

# Testing and linting
test:
	@echo "🧪 Running tests..."
	npm run test

lint:
	@echo "🔍 Running linter..."
	npm run lint

# Quick start (fresh setup)
quickstart: install docker-up build
	@echo "✅ Setup complete!"
	@echo ""
	@echo "Next steps:"
	@echo "1. Edit .env file with your SMTP credentials"
	@echo "2. Run 'make dev' to start all services"
	@echo "3. Open http://localhost:5173 in your browser"
