# syntax=docker/dockerfile:1.4
# ==================== Frontend Dockerfile ====================
# Multi-stage build for minimal production image
# Final image: ~25MB (nginx:alpine with static files)
#
# Features:
# - Multi-stage build (deps + builder + runtime)
# - BuildKit cache mounts for faster rebuilds
# - Health check included
#
# Build with BuildKit:
#   DOCKER_BUILDKIT=1 docker build -t frontend .
#   docker buildx build -t frontend .

# ==================== Stage 1: Dependencies ====================
FROM node:20-alpine AS deps

# Add labels
LABEL stage="dependencies"

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with npm cache mount
# This dramatically speeds up rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --only=production=false

# ==================== Stage 2: Builder ====================
FROM node:20-alpine AS builder

# Add labels
LABEL stage="builder"

# Build arguments for environment variables
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_VAPID_PUBLIC_KEY
ARG NODE_ENV=production

# Set environment variables
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_WS_URL=${VITE_WS_URL} \
    VITE_VAPID_PUBLIC_KEY=${VITE_VAPID_PUBLIC_KEY} \
    NODE_ENV=${NODE_ENV}

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application with npm cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm run build:no-critical \
    # Remove test files if accidentally included
    && rm -rf dist/**/*.test.* dist/**/*.spec.*

# ==================== Stage 3: Runtime ====================
FROM nginx:1.25-alpine AS runtime

# Labels
LABEL maintainer="Eli Maor" \
      description="Home Organization Frontend" \
      version="1.0.0"

# Install additional tools for health checks with apk cache
RUN --mount=type=cache,target=/var/cache/apk \
    apk add --no-cache curl

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy custom entrypoint script for runtime env vars (optional)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create cache directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/run \
    && chown -R nginx:nginx /var/cache/nginx /var/run /usr/share/nginx/html \
    && chmod -R 755 /usr/share/nginx/html

# Security: Remove unnecessary files
RUN rm -rf /etc/nginx/conf.d/default.conf.default \
    && rm -rf /docker-entrypoint.d/*

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/ || exit 1

# Expose port
EXPOSE 80

# Use custom entrypoint or default nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
