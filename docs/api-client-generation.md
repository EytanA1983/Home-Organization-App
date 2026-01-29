# API Client Generation

## Overview

This project supports automatic generation of TypeScript client types from the FastAPI OpenAPI schema. This ensures type safety between frontend and backend.

## Methods

| Method | Tool | Output | Best For |
|--------|------|--------|----------|
| **openapi-typescript** | npm | Types only | Lightweight, custom client |
| **openapi-generator** | CLI | Full client | Complete SDK |

## Quick Start

### 1. Start Backend

```bash
cd backend
uvicorn app.main:app --reload
```

### 2. Generate Types

```bash
# Windows (PowerShell)
.\scripts\generate-api-client.ps1

# Linux/macOS
./scripts/generate-api-client.sh

# Or via npm
cd frontend
npm run fetch:schema
npm run generate:api
```

### 3. Use in Frontend

```typescript
import { api, configureApiClient, type Schemas } from '@/api/generated';

// Configure once at app startup
configureApiClient({
  baseUrl: 'http://localhost:8000/api',
  getToken: () => localStorage.getItem('token'),
  onUnauthorized: () => {
    // Redirect to login
    window.location.href = '/login';
  },
});

// Use typed API methods
const rooms: Schemas['RoomResponse'][] = await api.rooms.list();
const task = await api.tasks.create({
  title: 'New Task',
  room_id: 1,
});
```

## Generated Files

```
frontend/src/api/generated/
├── api-types.ts   # TypeScript types from OpenAPI
├── client.ts      # API client with typed methods
└── index.ts       # Exports
```

## Type Examples

### Using Schema Types

```typescript
import type { Schemas } from '@/api/generated';

// Request types
type CreateTaskRequest = Schemas['TaskCreate'];
type UpdateRoomRequest = Schemas['RoomUpdate'];

// Response types
type TaskResponse = Schemas['TaskRead'];
type RoomResponse = Schemas['RoomResponse'];
type UserResponse = Schemas['UserRead'];

// Use in components
interface TaskCardProps {
  task: Schemas['TaskRead'];
  onComplete: (id: number) => void;
}
```

### Using API Client

```typescript
import { api } from '@/api/generated';

// Auth
const token = await api.auth.login({ email, password });
const user = await api.auth.me();

// CRUD operations
const rooms = await api.rooms.list();
const room = await api.rooms.create({ name: 'Living Room' });
await api.rooms.update(room.id, { name: 'Updated Name' });
await api.rooms.delete(room.id);

// With filters
const incompleteTasks = await api.tasks.list({ completed: false });
const roomTasks = await api.tasks.list({ room_id: 1 });
```

## Advanced: Full SDK Generation

For a complete SDK with models, use openapi-generator:

```bash
# Install globally
npm install -g @openapitools/openapi-generator-cli

# Generate TypeScript Fetch client
npx @openapitools/openapi-generator-cli generate \
  -i docs/openapi.json \
  -g typescript-fetch \
  -o frontend/src/api/openapi-generated \
  --additional-properties=supportsES6=true,typescriptThreePlus=true

# Or generate Axios client
npx @openapitools/openapi-generator-cli generate \
  -i docs/openapi.json \
  -g typescript-axios \
  -o frontend/src/api/axios-generated
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Generate API Client

on:
  push:
    paths:
      - 'backend/app/**'
      - 'docs/openapi.json'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install backend dependencies
        run: |
          cd backend
          pip install poetry
          poetry install

      - name: Export OpenAPI schema
        run: |
          cd backend
          python -c "
          from app.main import app
          import json
          with open('../docs/openapi.json', 'w') as f:
              json.dump(app.openapi(), f, indent=2)
          "

      - name: Generate TypeScript types
        run: |
          cd frontend
          npm install
          npm run generate:api

      - name: Commit changes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: regenerate API types"
          file_pattern: "frontend/src/api/generated/* docs/openapi.json"
```

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check if backend files changed
if git diff --cached --name-only | grep -q "backend/app/"; then
  echo "Backend changed, regenerating API types..."
  ./scripts/generate-api-client.sh
  git add frontend/src/api/generated/
fi
```

## Keeping Types in Sync

### Automatic Export

The backend automatically exports the OpenAPI schema:

```python
# backend/app/main.py
@app.on_event("startup")
async def export_openapi():
    """Export OpenAPI schema on startup (development only)"""
    if settings.ENVIRONMENT == "development":
        import json
        with open("../docs/openapi.json", "w") as f:
            json.dump(app.openapi(), f, indent=2)
```

### Watch Mode (Development)

```bash
# Watch for backend changes and regenerate
npx nodemon --watch ../backend/app \
  --ext py \
  --exec "npm run fetch:schema && npm run generate:api"
```

## Troubleshooting

### Schema Not Found

```bash
# Verify backend is running
curl http://localhost:8000/openapi.json

# Check schema file exists
cat docs/openapi.json | head -20
```

### Type Errors After Generation

```bash
# Clear and regenerate
rm -rf frontend/src/api/generated/*
npm run generate:api

# Check for TypeScript errors
npm run typecheck
```

### Missing Types

Ensure your Pydantic models have proper type hints:

```python
# Good
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None

# Bad (missing types)
class TaskCreate(BaseModel):
    title = ""
    description = None
```

## Best Practices

1. **Regenerate on API changes** - Add to CI/CD
2. **Version the schema** - Commit `docs/openapi.json`
3. **Use strict types** - Enable TypeScript strict mode
4. **Handle errors** - Use the `onError` callback
5. **Type your components** - Import and use `Schemas['...']`

## Resources

- [openapi-typescript](https://github.com/drwpow/openapi-typescript)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [FastAPI OpenAPI](https://fastapi.tiangolo.com/tutorial/schema-extra-example/)
