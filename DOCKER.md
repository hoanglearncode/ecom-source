# Docker Setup for E-commerce Microservices

## Table of Contents
- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Production Environment](#production-environment)
- [Service Architecture](#service-architecture)
- [Environment Variables](#environment-variables)
- [Common Commands](#common-commands)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Docker Desktop 4.0+ or Docker Engine 20.10+
- Docker Compose V2
- 8GB RAM minimum (16GB recommended)
- 20GB disk space

### Initial Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd ecommerce-microservices

# 2. Create environment file
cp .env.example .env

# 3. Update .env with your values
nano .env  # or use your preferred editor

# 4. Start development environment
docker-compose -f docker-compose.dev.yml up
```

---

## Development Environment

### docker-compose.dev.yml Features
- **Hot Reload**: Code changes are reflected immediately
- **Volume Mounting**: Source code is mounted into containers
- **Debug Ports**: Spring Boot debug port (5005) exposed
- **Verbose Logging**: Debug level logging enabled

### Starting Development Environment

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Start specific service
docker-compose -f docker-compose.dev.yml up auth-service

# Start in detached mode (background)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f auth-service
```

### Development Workflow

1. **Make code changes** in your local editor
2. **Changes auto-reload** in containers (Node.js: nodemon/tsx, Spring Boot: spring-boot:run)
3. **Check logs**: `docker-compose -f docker-compose.dev.yml logs -f <service>`

### Service URLs (Development)

| Service | URL | Description |
|---------|-----|-------------|
| API Gateway | http://localhost:8080 | Main entry point |
| Auth Service | http://localhost:3001 | Authentication |
| Product Service | http://localhost:3002 | Product catalog |
| Order Service | http://localhost:3003 | Order management |
| Payment Service | http://localhost:3004 | Payment processing |
| Inventory Service | http://localhost:3005 | Inventory management |
| Notification Service | http://localhost:3006 | Notifications |
| RabbitMQ Management | http://localhost:15672 | Message broker UI (guest/guest) |

### Connecting to Services

**Inside Docker Network** (service-to-service):
```
http://auth-service:3000
http://product-service:3000
http://postgres:5432
http://redis:6379
http://rabbitmq:5672
```

**From Host Machine**:
```
http://localhost:3001  # Auth Service
http://localhost:5432  # PostgreSQL
```

---

## Production Environment

### docker-compose.prod.yml Features
- **Optimized Images**: Minimal, production-ready containers
- **No Volume Mounts**: Code is baked into images
- **Auto-restart**: Containers restart on failure
- **Log Rotation**: Prevents disk space issues
- **Health Checks**: Ensures service availability

### Building for Production

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Build specific service
docker-compose -f docker-compose.prod.yml build auth-service

# Build with no cache
docker-compose -f docker-compose.prod.yml build --no-cache
```

### Starting Production Environment

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service health
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Production Deployment Checklist

- [ ] Update all secrets in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Enable Redis password
- [ ] Configure SSL/TLS certificates
- [ ] Set up external PostgreSQL/Redis (recommended)
- [ ] Configure log aggregation (ELK/Loki)
- [ ] Enable monitoring (Prometheus/Grafana)
- [ ] Set up database backups

---

## Service Architecture

```
                    ┌─────────────────┐
                    │   API Gateway   │
                    │   (Port 8080)   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼───────┐
│ Auth Service   │  │ Product Service  │  │ Order Service│
│ (Port 3001)    │  │  (Port 3002)     │  │  (Port 3003) │
└───────┬────────┘  └────────┬────────┘  └──────┬───────┘
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼───────┐
│  MongoDB       │  │   PostgreSQL     │  │  PostgreSQL  │
│  (Auth DB)     │  │ (Product DB)    │  │  (Order DB)  │
└────────────────┘  └─────────────────┘  └───────────────┘

                    ┌─────────────────┐
                    │    RabbitMQ     │
                    │  (Message Broker)│
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌──────▼───────┐
│ Inventory      │  │  Payment         │  │ Notification │
│ Service        │  │  Service         │  │  Service     │
└────────────────┘  └──────────────────┘  └───────────────┘
```

### Database per Service

| Service | Database | Technology |
|---------|----------|------------|
| Auth Service | auth_db | MongoDB |
| Product Service | product_db | PostgreSQL |
| Order Service | order_db | PostgreSQL |
| Inventory Service | inventory_db | PostgreSQL |
| Payment Service | payment_db | PostgreSQL |
| Gateway | gateway_db | Neo4j (optional) |

---

## Environment Variables

### Required Variables

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_minimum_32_characters

# RabbitMQ
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
```

### Optional Variables

See `.env.example` for all available variables.

---

## Common Commands

### Container Management

```bash
# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes (⚠️ deletes data!)
docker-compose -f docker-compose.dev.yml down -v

# Restart specific service
docker-compose -f docker-compose.dev.yml restart auth-service

# Rebuild service after Dockerfile changes
docker-compose -f docker-compose.dev.yml up -d --build auth-service

# Execute command in container
docker-compose -f docker-compose.dev.yml exec auth-service sh
docker-compose -f docker-compose.dev.yml exec auth-service pnpm install
```

### Database Management

```bash
# Connect to PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres

# Connect to Redis
docker-compose -f docker-compose.dev.yml exec redis redis-cli

# Backup PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres auth_db > backup.sql

# Restore PostgreSQL
docker-compose -f docker-compose.dev.yml exec -T postgres psql -U postgres auth_db < backup.sql
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f auth-service

# Last 100 lines
docker-compose -f docker-compose.dev.yml logs --tail=100 auth-service

# Since specific time
docker-compose -f docker-compose.dev.yml logs --since="2024-01-01T10:00:00" auth-service
```

### Resource Monitoring

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune -a
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :5432  # Windows
lsof -i :5432  # Linux/Mac

# Change port in .env
POSTGRES_PORT=5433
```

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs <service>

# Check container status
docker-compose -f docker-compose.dev.yml ps

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up
```

### Hot Reload Not Working

```bash
# Ensure volume mounts are correct
docker-compose -f docker-compose.dev.yml config

# Check if node_modules volume exists
docker volume inspect ecommerce-microservices_auth_node_modules

# Remove and restart
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up
```

### Database Connection Issues

```bash
# Verify database is healthy
docker-compose -f docker-compose.dev.yml ps postgres

# Check database logs
docker-compose -f docker-compose.dev.yml logs postgres

# Test connection
docker-compose -f docker-compose.dev.yml exec auth-service sh
# Inside container: ping postgres
```

### Out of Memory

```bash
# Increase Docker memory limit in Docker Desktop settings
# Or add resource limits to docker-compose.yml:

services:
  auth-service:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

### Clean Everything and Start Fresh

```bash
# Stop and remove all containers, networks, and volumes
docker-compose -f docker-compose.dev.yml down -v

# Remove all Docker images
docker rmi $(docker images -aq)

# Start fresh
docker-compose -f docker-compose.dev.yml up --build
```

---

## Advanced Topics

### Multi-Stage Builds

Each service uses multi-stage builds:
1. **Build stage**: Compiles code
2. **Runtime stage**: Minimal image with compiled artifacts

### Dockerfile.dev vs Dockerfile

| Feature | Dockerfile.dev | Dockerfile |
|---------|----------------|------------|
| Purpose | Development | Production |
| Hot Reload | Yes | No |
| Volume Mounts | Yes | No |
| Image Size | Larger (includes dev tools) | Smaller |
| Build Speed | Faster (no optimization) | Optimized |

### Network Communication

Services communicate using Docker's internal DNS:
- Service name = hostname
- No need for IP addresses
- Automatic load balancing with replicas

### Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Logging

All services use JSON file driver with rotation:
- Max size: 10MB per file
- Max files: 5 (50MB total per service)

---

## Kubernetes Migration

When ready to move to Kubernetes:

1. **Create Kubernetes manifests** from docker-compose.yml
2. **Use Helm charts** for complex deployments
3. **Configure Ingress** instead of exposing ports
4. **Use ConfigMaps/Secrets** for environment variables
5. **Set up PersistentVolumeClaims** for databases

---

## Security Best Practices

1. **Never commit** `.env` files
2. **Use secrets management** (HashiCorp Vault, AWS Secrets Manager)
3. **Scan images** for vulnerabilities (Trivy, Snyk)
4. **Run as non-root** user in containers
5. **Enable TLS** for service-to-service communication
6. **Implement network policies** (Kubernetes)

---

## Useful Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Spring Boot Docker](https://spring.io/guides/topicals/spring-boot-docker/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [RabbitMQ Docker](https://www.rabbitmq.com/download.html)
