# ==================== API Client Generator (PowerShell) ====================
# Generates TypeScript client from FastAPI OpenAPI schema
#
# Usage:
#   .\scripts\generate-api-client.ps1
#   .\scripts\generate-api-client.ps1 -ApiUrl http://localhost:8000

param(
    [string]$ApiUrl = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

# Configuration
$OpenApiUrl = "$ApiUrl/openapi.json"
$OutputDir = "frontend\src\api\generated"
$SchemaFile = "docs\openapi.json"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "API Client Generator" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl"
Write-Host "Output: $OutputDir"
Write-Host ""

# Create output directory
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $SchemaFile) | Out-Null

# ==================== Fetch OpenAPI Schema ====================
Write-Host "📥 Fetching OpenAPI schema..." -ForegroundColor Yellow

try {
    Invoke-WebRequest -Uri $OpenApiUrl -OutFile $SchemaFile -UseBasicParsing
    Write-Host "✓ Schema saved to $SchemaFile" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not fetch from API, using existing schema file" -ForegroundColor Yellow
    if (-not (Test-Path $SchemaFile)) {
        Write-Host "❌ No schema file found. Please start the backend API first." -ForegroundColor Red
        exit 1
    }
}

# ==================== Generate TypeScript Types ====================
Write-Host ""
Write-Host "🔧 Generating TypeScript types..." -ForegroundColor Yellow

# Check if npx is available
if (Get-Command npx -ErrorAction SilentlyContinue) {
    Write-Host "Using openapi-typescript..."
    npx openapi-typescript $SchemaFile --output "$OutputDir\api-types.ts" --export-type --path-params-as-types
    Write-Host "✓ Types generated: $OutputDir\api-types.ts" -ForegroundColor Green
} else {
    Write-Host "❌ npx not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

# ==================== Generate API Client ====================
Write-Host ""
Write-Host "🔧 Generating API client..." -ForegroundColor Yellow

$ClientContent = @'
/**
 * Auto-generated API Client
 * Generated from OpenAPI schema
 * DO NOT EDIT - changes will be overwritten
 */

import type { paths, components } from './api-types';

// ==================== Types ====================

export type Schemas = components['schemas'];

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

  const token = config.getToken?.();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

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
    } catch {}

    config.onError?.(error);
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// ==================== API Methods ====================

export const api = {
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

  statistics: {
    get: () =>
      request<Schemas['StatisticsResponse']>('GET', '/statistics'),
  },

  notifications: {
    subscribe: (data: Schemas['PushSubscriptionCreate']) =>
      request<Schemas['PushSubscriptionRead']>('POST', '/notifications/subscribe', { body: data }),
    unsubscribe: (endpoint: string) =>
      request<void>('DELETE', '/notifications/subscribe', { params: { endpoint } }),
    getVapidKey: () =>
      request<{ public_key: string }>('GET', '/notifications/vapid-key'),
  },

  health: {
    check: () =>
      request<{ status: string }>('GET', '/health'),
    ready: () =>
      request<{ status: string }>('GET', '/ready'),
  },
};

export default api;
'@

Set-Content -Path "$OutputDir\client.ts" -Value $ClientContent -Encoding UTF8
Write-Host "✓ Client generated: $OutputDir\client.ts" -ForegroundColor Green

# ==================== Generate Index ====================
$IndexContent = @'
/**
 * API Client - Auto-generated
 */
export * from './api-types';
export * from './client';
export { api as default } from './client';
'@

Set-Content -Path "$OutputDir\index.ts" -Value $IndexContent -Encoding UTF8
Write-Host "✓ Index generated: $OutputDir\index.ts" -ForegroundColor Green

# ==================== Summary ====================
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Generation Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Generated files:"
Write-Host "  - $OutputDir\api-types.ts  (TypeScript types)"
Write-Host "  - $OutputDir\client.ts     (API client)"
Write-Host "  - $OutputDir\index.ts      (Exports)"
Write-Host ""
Write-Host "Usage in frontend:"
Write-Host "  import { api, configureApiClient } from '@/api/generated';"
