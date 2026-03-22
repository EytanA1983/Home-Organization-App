#!/bin/bash
# ==================== API Client Generator ====================
# Generates TypeScript client from FastAPI OpenAPI schema
#
# Usage:
#   ./scripts/generate-api-client.sh
#   ./scripts/generate-api-client.sh --url http://localhost:8000
#
# Requirements:
#   - Node.js (for openapi-typescript)
#   - Docker (for openapi-generator, optional)
#   - Running backend API (or saved openapi.json)

set -e

# Configuration
API_URL="${1:-http://localhost:8000}"
OPENAPI_URL="${API_URL}/openapi.json"
OUTPUT_DIR="frontend/src/api/generated"
SCHEMA_FILE="docs/openapi.json"

echo "=========================================="
echo "API Client Generator"
echo "=========================================="
echo "API URL: ${API_URL}"
echo "Output: ${OUTPUT_DIR}"
echo ""

# Create output directory
mkdir -p "${OUTPUT_DIR}"
mkdir -p "$(dirname ${SCHEMA_FILE})"

# ==================== Fetch OpenAPI Schema ====================
echo "📥 Fetching OpenAPI schema..."

if curl -sf "${OPENAPI_URL}" > "${SCHEMA_FILE}"; then
    echo "✓ Schema saved to ${SCHEMA_FILE}"
else
    echo "⚠️  Could not fetch from API, using existing schema file"
    if [ ! -f "${SCHEMA_FILE}" ]; then
        echo "❌ No schema file found. Please start the backend API first."
        exit 1
    fi
fi

# ==================== Generate TypeScript Types ====================
echo ""
echo "🔧 Generating TypeScript types..."

# Method 1: openapi-typescript (recommended - types only)
if command -v npx &> /dev/null; then
    echo "Using openapi-typescript..."
    npx openapi-typescript "${SCHEMA_FILE}" \
        --output "${OUTPUT_DIR}/api-types.ts" \
        --export-type \
        --path-params-as-types
    echo "✓ Types generated: ${OUTPUT_DIR}/api-types.ts"
fi

# ==================== Generate API Client ====================
echo ""
echo "🔧 Generating API client..."

# Method 2: openapi-typescript-fetch (client with fetch)
if command -v npx &> /dev/null; then
    echo "Generating fetch client..."

    # Generate the client wrapper
    cat > "${OUTPUT_DIR}/client.ts" << 'EOF'
/**
 * Auto-generated API Client
 * Generated from OpenAPI schema
 * DO NOT EDIT - changes will be overwritten
 */

import type { paths, components } from './api-types';

// ==================== Types ====================

export type Schemas = components['schemas'];

// Extract request/response types from paths
type PathMethods<P extends keyof paths> = paths[P];
type MethodParams<P extends keyof paths, M extends keyof PathMethods<P>> =
  PathMethods<P>[M] extends { parameters?: infer Params } ? Params : never;
type MethodResponse<P extends keyof paths, M extends keyof PathMethods<P>> =
  PathMethods<P>[M] extends { responses: { 200: { content: { 'application/json': infer R } } } } ? R : unknown;

// ==================== Configuration ====================

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
  onError?: (error: ApiError) => void;
}

export interface ApiError {
  status: number;
  message: string;
  detail?: unknown;
}

// ==================== Client ====================

let config: ApiClientConfig = {
  baseUrl: '/api',
};

export function configureApiClient(newConfig: Partial<ApiClientConfig>) {
  config = { ...config, ...newConfig };
}

async function request<T>(
  method: string,
  path: string,
  options: {
    params?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const { params, body, headers = {} } = options;

  // Build URL with query params
  let url = `${config.baseUrl}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Add auth header
  const token = config.getToken?.();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Make request
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle errors
  if (!response.ok) {
    if (response.status === 401) {
      config.onUnauthorized?.();
    }

    const error: ApiError = {
      status: response.status,
      message: response.statusText,
    };

    try {
      error.detail = await response.json();
    } catch {
      // Ignore JSON parse errors
    }

    config.onError?.(error);
    throw error;
  }

  // Return empty for 204
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ==================== API Methods ====================

export const api = {
  // Auth
  auth: {
    login: (data: Schemas['UserLogin']) =>
      request<Schemas['Token']>('POST', '/auth/login', { body: data }),

    register: (data: Schemas['UserCreate']) =>
      request<Schemas['UserRead']>('POST', '/auth/register', { body: data }),

    me: () =>
      request<Schemas['UserRead']>('GET', '/auth/me'),

    refresh: (data: { refresh_token: string }) =>
      request<Schemas['Token']>('POST', '/auth/refresh', { body: data }),

    logout: () =>
      request<void>('POST', '/auth/logout'),
  },

  // Rooms
  rooms: {
    list: () =>
      request<Schemas['RoomResponse'][]>('GET', '/rooms'),

    get: (id: number) =>
      request<Schemas['RoomResponse']>('GET', `/rooms/${id}`),

    create: (data: Schemas['RoomCreate']) =>
      request<Schemas['RoomResponse']>('POST', '/rooms', { body: data }),

    update: (id: number, data: Schemas['RoomUpdate']) =>
      request<Schemas['RoomResponse']>('PUT', `/rooms/${id}`, { body: data }),

    delete: (id: number) =>
      request<void>('DELETE', `/rooms/${id}`),
  },

  // Tasks
  tasks: {
    list: (params?: { room_id?: number; completed?: boolean; category_id?: number }) =>
      request<Schemas['TaskRead'][]>('GET', '/tasks', { params }),

    get: (id: number) =>
      request<Schemas['TaskRead']>('GET', `/tasks/${id}`),

    create: (data: Schemas['TaskCreate']) =>
      request<Schemas['TaskRead']>('POST', '/tasks', { body: data }),

    update: (id: number, data: Schemas['TaskUpdate']) =>
      request<Schemas['TaskRead']>('PUT', `/tasks/${id}`, { body: data }),

    complete: (id: number) =>
      request<Schemas['TaskRead']>('PUT', `/tasks/${id}/complete`),

    delete: (id: number) =>
      request<void>('DELETE', `/tasks/${id}`),
  },

  // Categories
  categories: {
    list: () =>
      request<Schemas['CategoryRead'][]>('GET', '/categories'),

    get: (id: number) =>
      request<Schemas['CategoryRead']>('GET', `/categories/${id}`),

    create: (data: Schemas['CategoryCreate']) =>
      request<Schemas['CategoryRead']>('POST', '/categories', { body: data }),

    update: (id: number, data: Schemas['CategoryUpdate']) =>
      request<Schemas['CategoryRead']>('PUT', `/categories/${id}`, { body: data }),

    delete: (id: number) =>
      request<void>('DELETE', `/categories/${id}`),
  },

  // Todos
  todos: {
    list: (taskId: number) =>
      request<Schemas['TodoRead'][]>('GET', `/tasks/${taskId}/todos`),

    create: (taskId: number, data: Schemas['TodoCreate']) =>
      request<Schemas['TodoRead']>('POST', `/tasks/${taskId}/todos`, { body: data }),

    update: (id: number, data: Schemas['TodoUpdate']) =>
      request<Schemas['TodoRead']>('PUT', `/todos/${id}`, { body: data }),

    complete: (id: number) =>
      request<Schemas['TodoRead']>('PUT', `/todos/${id}/complete`),

    delete: (id: number) =>
      request<void>('DELETE', `/todos/${id}`),
  },

  // Statistics
  statistics: {
    get: () =>
      request<Schemas['StatisticsResponse']>('GET', '/statistics'),
  },

  // Notifications
  notifications: {
    subscribe: (data: Schemas['PushSubscriptionCreate']) =>
      request<Schemas['PushSubscriptionRead']>('POST', '/notifications/subscribe', { body: data }),

    unsubscribe: (endpoint: string) =>
      request<void>('DELETE', '/notifications/subscribe', { params: { endpoint } }),

    getVapidKey: () =>
      request<{ public_key: string }>('GET', '/notifications/vapid-key'),
  },

  // Health
  health: {
    check: () =>
      request<{ status: string }>('GET', '/health'),

    ready: () =>
      request<{ status: string }>('GET', '/ready'),
  },
};

export default api;
EOF

    echo "✓ Client generated: ${OUTPUT_DIR}/client.ts"
fi

# ==================== Generate Index ====================
cat > "${OUTPUT_DIR}/index.ts" << 'EOF'
/**
 * API Client - Auto-generated
 *
 * Usage:
 *   import { api, configureApiClient } from '@/api/generated';
 *
 *   // Configure
 *   configureApiClient({
 *     baseUrl: 'http://localhost:8000/api',
 *     getToken: () => localStorage.getItem('token'),
 *   });
 *
 *   // Use
 *   const rooms = await api.rooms.list();
 *   const task = await api.tasks.create({ title: 'New Task' });
 */

export * from './api-types';
export * from './client';
export { api as default } from './client';
EOF

echo "✓ Index generated: ${OUTPUT_DIR}/index.ts"

# ==================== Summary ====================
echo ""
echo "=========================================="
echo "✅ Generation Complete!"
echo "=========================================="
echo ""
echo "Generated files:"
echo "  - ${OUTPUT_DIR}/api-types.ts  (TypeScript types)"
echo "  - ${OUTPUT_DIR}/client.ts     (API client)"
echo "  - ${OUTPUT_DIR}/index.ts      (Exports)"
echo ""
echo "Usage in frontend:"
echo "  import { api, configureApiClient } from '@/api/generated';"
echo ""
