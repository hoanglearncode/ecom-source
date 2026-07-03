#!/bin/bash
# Docker Helper Script for E-commerce Microservices
# Usage: ./docker.sh [command] [service]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_DEV="docker-compose.dev.yml"
COMPOSE_PROD="docker-compose.prod.yml"
ENV_FILE=".env"

# Functions
print_header() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
}

print_error() {
    echo -e "${RED}Error: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}Warning: $1${NC}"
}

check_env_file() {
    if [ ! -f "$ENV_FILE" ]; then
        print_error ".env file not found!"
        echo "Creating .env from .env.example..."
        cp .env.example .env
        print_warning "Please update .env with your values"
        return 1
    fi
    return 0
}

# Commands
dev_up() {
    print_header "Starting Development Environment"
    check_env_file
    docker-compose -f "$COMPOSE_DEV" up -d
    echo -e "${GREEN}✓ Development environment started${NC}"
    docker-compose -f "$COMPOSE_DEV" ps
}

dev_down() {
    print_header "Stopping Development Environment"
    docker-compose -f "$COMPOSE_DEV" down
    echo -e "${GREEN}✓ Development environment stopped${NC}"
}

dev_logs() {
    local service=$1
    if [ -z "$service" ]; then
        docker-compose -f "$COMPOSE_DEV" logs -f
    else
        docker-compose -f "$COMPOSE_DEV" logs -f "$service"
    fi
}

dev_restart() {
    local service=$1
    if [ -z "$service" ]; then
        print_error "Please specify a service"
        exit 1
    fi
    print_header "Restarting $service"
    docker-compose -f "$COMPOSE_DEV" restart "$service"
    echo -e "${GREEN}✓ $service restarted${NC}"
}

dev_rebuild() {
    local service=$1
    print_header "Rebuilding $service"
    check_env_file
    if [ -z "$service" ]; then
        docker-compose -f "$COMPOSE_DEV" up -d --build
    else
        docker-compose -f "$COMPOSE_DEV" up -d --build "$service"
    fi
    echo -e "${GREEN}✓ Build complete${NC}"
}

prod_up() {
    print_header "Starting Production Environment"
    check_env_file
    docker-compose -f "$COMPOSE_PROD" up -d
    echo -e "${GREEN}✓ Production environment started${NC}"
}

prod_down() {
    print_header "Stopping Production Environment"
    docker-compose -f "$COMPOSE_PROD" down
    echo -e "${GREEN}✓ Production environment stopped${NC}"
}

prod_build() {
    print_header "Building Production Images"
    docker-compose -f "$COMPOSE_PROD" build
    echo -e "${GREEN}✓ Production images built${NC}"
}

ps() {
    docker-compose -f "$COMPOSE_DEV" ps
}

exec_shell() {
    local service=$1
    if [ -z "$service" ]; then
        print_error "Please specify a service"
        exit 1
    fi
    docker-compose -f "$COMPOSE_DEV" exec "$service" sh
}

db_connect() {
    print_header "Connecting to PostgreSQL"
    docker-compose -f "$COMPOSE_DEV" exec postgres psql -U postgres
}

redis_connect() {
    print_header "Connecting to Redis"
    docker-compose -f "$COMPOSE_DEV" exec redis redis-cli
}

clean_all() {
    print_header "Cleaning All Containers and Volumes"
    read -p "This will delete all data! Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker-compose -f "$COMPOSE_DEV" down -v
        docker-compose -f "$COMPOSE_PROD" down -v
        docker system prune -f
        echo -e "${GREEN}✓ Cleanup complete${NC}"
    else
        echo "Aborted"
    fi
}

show_stats() {
    print_header "Container Stats"
    docker stats
}

show_urls() {
    print_header "Service URLs"
    echo "API Gateway:       http://localhost:8080"
    echo "Auth Service:      http://localhost:3001"
    echo "Product Service:   http://localhost:3002"
    echo "Order Service:     http://localhost:3003"
    echo "Payment Service:   http://localhost:3004"
    echo "Inventory Service: http://localhost:3005"
    echo "Notification:      http://localhost:3006"
    echo ""
    echo "RabbitMQ Management: http://localhost:15672 (guest/guest)"
}

show_help() {
    cat << EOF
Docker Helper Script for E-commerce Microservices

Usage: ./docker.sh [command] [service]

Development Commands:
  dev:up           Start development environment
  dev:down         Stop development environment
  dev:logs [svc]   Show logs (all or specific service)
  dev:restart svc  Restart specific service
  dev:rebuild svc  Rebuild service with hot reload

Production Commands:
  prod:up          Start production environment
  prod:down        Stop production environment
  prod:build       Build production images

Utility Commands:
  ps               Show running containers
  exec svc         Execute shell in service
  db:connect       Connect to PostgreSQL
  redis:connect    Connect to Redis
  clean            Remove all containers and volumes
  stats            Show container statistics
  urls             Show service URLs
  help             Show this help message

Examples:
  ./docker.sh dev:up
  ./docker.sh dev:logs auth-service
  ./docker.sh exec auth-service
  ./docker.sh db:connect

EOF
}

# Main script logic
case "$1" in
    dev:up)
        dev_up
        ;;
    dev:down)
        dev_down
        ;;
    dev:logs)
        dev_logs "$2"
        ;;
    dev:restart)
        dev_restart "$2"
        ;;
    dev:rebuild)
        dev_rebuild "$2"
        ;;
    prod:up)
        prod_up
        ;;
    prod:down)
        prod_down
        ;;
    prod:build)
        prod_build
        ;;
    ps)
        ps
        ;;
    exec)
        exec_shell "$2"
        ;;
    db:connect)
        db_connect
        ;;
    redis:connect)
        redis_connect
        ;;
    clean)
        clean_all
        ;;
    stats)
        show_stats
        ;;
    urls)
        show_urls
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
