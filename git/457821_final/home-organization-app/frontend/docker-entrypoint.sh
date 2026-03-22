#!/bin/sh
# Docker entrypoint script for frontend
# Allows runtime environment variable injection

set -e

# ==================== Runtime Environment Variables ====================
# These can be set at container runtime via docker run -e or docker-compose

# Create a runtime config file if API_URL is set at runtime
if [ -n "$RUNTIME_API_URL" ]; then
    echo "Injecting runtime API URL: $RUNTIME_API_URL"

    # Create runtime config that overrides build-time config
    cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = {
    API_URL: "${RUNTIME_API_URL}",
    WS_URL: "${RUNTIME_WS_URL:-}",
    VAPID_PUBLIC_KEY: "${RUNTIME_VAPID_PUBLIC_KEY:-}"
};
EOF
fi

# ==================== Nginx Configuration ====================

# Replace environment variables in nginx config if needed
if [ -n "$NGINX_SERVER_NAME" ]; then
    sed -i "s/server_name .*;/server_name $NGINX_SERVER_NAME;/g" /etc/nginx/conf.d/default.conf
fi

# Set upstream backend URL if provided
if [ -n "$BACKEND_URL" ]; then
    echo "Setting backend URL: $BACKEND_URL"
    sed -i "s|proxy_pass http://backend:8000;|proxy_pass $BACKEND_URL;|g" /etc/nginx/conf.d/default.conf
fi

# ==================== Start Nginx ====================

echo "Starting nginx..."
exec "$@"
