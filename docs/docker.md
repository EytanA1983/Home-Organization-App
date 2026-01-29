# Docker Configuration

## Overview

This project uses multi-stage Docker builds for optimized image sizes:

| Image | Base | Size | Purpose |
|-------|------|------|---------|
| Backend (prod) | `python:3.12-slim` | ~200MB | Production API |
| Backend (dev) | `python:3.12-slim` | ~500MB | Development with hot reload |
| Frontend (prod) | `nginx:1.25-alpine` | ~25MB | Static file serving |
| Frontend (build) | `node:20-alpine` | - | Build stage only |

## Image Size Comparison

### Before Optimization

```
backend     python:3.12      ~1.2GB
frontend    node:22          ~500MB
```

### After Optimization

```
backend     python:3.12-slim  ~200MB  (-83%)
frontend    nginx:alpine      ~25MB   (-95%)
```

## Production Build

### Build All Images

```bash
docker compose build
```

### Build Specific Service

```bash
docker compose build backend
docker compose build frontend
```

### Run Production

```bash
docker compose up -d
```

### View Logs

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
```

### Stop All Services

```bash
docker compose down
```

## Development Build

### Run Development Environment

```bash
docker compose -f docker-compose.dev.yml up -d
```

### Development Features

- ✅ Hot reload for backend
- ✅ Volume mounts for source code
- ✅ Flower for Celery monitoring
- ✅ MailHog for email testing
- ✅ Debug mode enabled

### Development URLs

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Flower | http://localhost:5555 |
| MailHog | http://localhost:8025 |
| Frontend | Run `npm run dev` locally |

## Multi-Stage Build Details

### Backend Dockerfile

```dockerfile
# Stage 1: Builder
FROM python:3.12-slim AS builder
# Install build dependencies
# Install Python packages with Poetry

# Stage 2: Runtime
FROM python:3.12-slim AS runtime
# Copy only necessary files
# Minimal runtime dependencies
```

**Stages:**
1. **builder** - Installs Poetry, build tools, Python packages
2. **runtime** - Only runtime libraries (libpq5) + application code

### Frontend Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
# Install npm packages

# Stage 2: Builder
FROM node:20-alpine AS builder
# Build application

# Stage 3: Runtime
FROM nginx:1.25-alpine AS runtime
# Copy built files
# Serve with nginx
```

**Stages:**
1. **deps** - Install node_modules
2. **builder** - Build application (`npm run build`)
3. **runtime** - nginx with static files only

## Environment Variables

### Backend

```bash
# Required
DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
SECRET_KEY=your-secret-key

# Optional
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
VAPID_PRIVATE_KEY=...
VAPID_PUBLIC_KEY=...
ENVIRONMENT=production  # or development
```

### Frontend (Build Args)

```bash
# Set during build
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_VAPID_PUBLIC_KEY=...
```

### Frontend (Runtime)

```bash
# Set at container runtime
RUNTIME_API_URL=https://api.example.com
BACKEND_URL=http://backend:8000
```

## Resource Limits

The docker-compose files include resource limits:

| Service | Memory Limit | Memory Reservation |
|---------|-------------|-------------------|
| Backend | 512MB | 256MB |
| Worker | 512MB | - |
| Beat | 128MB | - |
| Frontend | 128MB | - |
| PostgreSQL | 512MB | - |
| Redis | 256MB | - |

Adjust in `docker-compose.yml` under `deploy.resources`.

## Health Checks

All services include comprehensive health checks for Kubernetes readiness:

### Docker Compose Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health/ready"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

### Health Endpoints

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Backend | `GET /health` | Basic health (always 200 if running) |
| Backend | `GET /live` | Liveness probe (app is alive) |
| Backend | `GET /ready` | Readiness probe (checks DB + Redis) |
| Backend | `GET /health/detailed` | Full component status |
| Frontend | `GET /` | nginx is serving |
| Redis | `redis-cli ping` | Redis is responding |
| PostgreSQL | `pg_isready` | Database is ready |
| Worker | `celery inspect ping` | Worker is processing |
| Beat | `pidfile check` | Scheduler is running |

### Service-Specific Health Checks

**Backend API:**
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health/ready"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

**Celery Worker:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "celery -A app.workers.celery_app.celery inspect ping -d celery@$$HOSTNAME"]
  interval: 60s
  timeout: 30s
  retries: 3
  start_period: 60s
```

**Celery Beat:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "test -f /tmp/celerybeat.pid && kill -0 $$(cat /tmp/celerybeat.pid)"]
  interval: 60s
  timeout: 10s
  retries: 3
  start_period: 30s
```

### Restart Policies

```yaml
restart: unless-stopped  # Simple restart
# Or with more control:
deploy:
  restart_policy:
    condition: on-failure
    delay: 5s
    max_attempts: 3
    window: 120s
```

### Kubernetes Integration

The health checks are designed to work with Kubernetes probes:

| Docker | Kubernetes | Endpoint |
|--------|-----------|----------|
| healthcheck | livenessProbe | `/live` |
| healthcheck | readinessProbe | `/ready` |
| start_period | startupProbe | `/health` |

See `k8s/*.yaml` for Kubernetes deployment examples

## .dockerignore

Both backend and frontend have `.dockerignore` files to:
- ✅ Reduce build context size
- ✅ Speed up builds
- ✅ Exclude sensitive files
- ✅ Exclude development files

## Building for CI/CD

### GitHub Actions

```yaml
- name: Build and push backend
  uses: docker/build-push-action@v5
  with:
    context: ./backend
    file: ./backend/Dockerfile
    push: true
    tags: ghcr.io/your-org/backend:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Build Args in CI

```yaml
build-args: |
  VITE_API_URL=${{ vars.VITE_API_URL }}
  VITE_VAPID_PUBLIC_KEY=${{ secrets.VAPID_PUBLIC_KEY }}
```

## Optimizations

### 1. BuildKit Cache Mounts

Both Dockerfiles use BuildKit cache mounts for faster rebuilds:

```dockerfile
# Backend - pip and poetry cache
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=cache,target=/root/.cache/pypoetry \
    poetry install --no-root --only main

# Frontend - npm cache
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

**Cache targets:**
| Service | Cache Target | Purpose |
|---------|-------------|---------|
| Backend | `/root/.cache/pip` | pip packages |
| Backend | `/root/.cache/pypoetry` | Poetry cache |
| Backend | `/var/cache/apt` | apt packages |
| Frontend | `/root/.npm` | npm packages |

**Build with BuildKit:**
```bash
# Enable BuildKit
export DOCKER_BUILDKIT=1

# Or use docker buildx
docker buildx build -t backend ./backend
docker buildx build -t frontend ./frontend
```

### 2. Layer Caching

Copy dependency files first:

```dockerfile
# Good - better caching
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Bad - invalidates cache on any change
COPY . .
RUN npm ci
```

### 2. Minimal Base Images

```dockerfile
# Production
FROM python:3.12-slim    # Not python:3.12
FROM nginx:1.25-alpine   # Not nginx:latest
FROM node:20-alpine      # Not node:20
```

### 3. Clean Up

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    package1 \
    package2 \
    && rm -rf /var/lib/apt/lists/*
```

### 4. Non-Root User

```dockerfile
RUN useradd -m appuser
USER appuser
```

## Troubleshooting

### Image Too Large

```bash
# Check image size
docker images

# Analyze image layers
docker history <image>

# Use dive for detailed analysis
dive <image>
```

### Build Fails

```bash
# Build with verbose output
docker compose build --no-cache --progress=plain backend
```

### Container Won't Start

```bash
# Check logs
docker compose logs backend

# Run interactively
docker compose run --rm backend bash
```

### Health Check Failing

```bash
# Test health endpoint manually
docker compose exec backend curl http://localhost:8000/health
```

## Commands Reference

```bash
# Build
docker compose build
docker compose build --no-cache
docker compose build backend

# Run
docker compose up -d
docker compose up -d --build

# Logs
docker compose logs -f
docker compose logs -f backend

# Shell access
docker compose exec backend bash
docker compose exec frontend sh

# Stop
docker compose down
docker compose down -v  # Remove volumes

# Cleanup
docker system prune -a
docker volume prune
```
