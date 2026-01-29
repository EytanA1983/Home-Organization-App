# syntax=docker/dockerfile:1.4
# ==================== Backend Dockerfile ====================
# Multi-stage build for smaller image size
# Final image: ~200MB (vs ~800MB with full python)
#
# Features:
# - Multi-stage build (builder + runtime)
# - BuildKit cache mounts for faster rebuilds
# - Non-root user for security
# - Health check included
#
# Build with BuildKit:
#   DOCKER_BUILDKIT=1 docker build -t backend .
#   docker buildx build -t backend .

# ==================== Stage 1: Builder ====================
FROM python:3.12-slim AS builder

# Build arguments
ARG POETRY_VERSION=1.7.1

# Set environment variables
# Note: Remove PIP_NO_CACHE_DIR to enable cache mounts
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    POETRY_NO_INTERACTION=1 \
    POETRY_VIRTUALENVS_CREATE=false \
    POETRY_HOME="/opt/poetry" \
    POETRY_CACHE_DIR="/root/.cache/pypoetry"

# Add Poetry to PATH
ENV PATH="$POETRY_HOME/bin:$PATH"

# Install build dependencies with apt cache mount
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libpq-dev \
    curl

# Install Poetry with cache mount
RUN --mount=type=cache,target=/root/.cache/pip \
    curl -sSL https://install.python-poetry.org | python3 - --version ${POETRY_VERSION}

WORKDIR /app

# Copy dependency files first (better layer caching)
COPY pyproject.toml poetry.lock ./

# Install dependencies with pip and poetry cache mounts
# This dramatically speeds up rebuilds when dependencies haven't changed
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=cache,target=/root/.cache/pypoetry \
    poetry install --no-root --only main --no-ansi

# Copy application code
COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./

# ==================== Stage 2: Runtime ====================
FROM python:3.12-slim AS runtime

# Labels
LABEL maintainer="Eli Maor" \
      description="Home Organization Backend API" \
      version="1.0.0"

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    # Non-root user
    APP_USER=appuser \
    APP_UID=1000 \
    APP_GID=1000

# Install only runtime dependencies (minimal) with cache mount
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    # PostgreSQL client library (required by psycopg2)
    libpq5 \
    # CA certificates for HTTPS
    ca-certificates \
    # curl for health checks
    curl

# Create non-root user
RUN groupadd -g ${APP_GID} ${APP_USER} \
    && useradd -u ${APP_UID} -g ${APP_GID} -m -s /bin/bash ${APP_USER}

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY --from=builder /app/app ./app
COPY --from=builder /app/alembic ./alembic
COPY --from=builder /app/alembic.ini ./

# Create necessary directories
RUN mkdir -p /app/logs /app/static \
    && chown -R ${APP_USER}:${APP_USER} /app

# Switch to non-root user
USER ${APP_USER}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Default command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
