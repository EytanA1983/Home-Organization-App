# Real-time Updates Architecture

## סקירה כללית

המערכת משתמשת ב-WebSocket + Redis Pub/Sub לעדכונים בזמן אמת של UI.

## זרימת נתונים

### 1. Task Update Flow

```
User Action (Frontend)
    ↓
REST API (PUT /api/tasks/{id})
    ↓
Backend Updates Database
    ↓
Backend Publishes to Redis Pub/Sub (channel: user:{id}:tasks)
    ↓
WebSocket Connection Listens to Redis
    ↓
WebSocket Sends Update to Frontend
    ↓
Frontend Updates UI Immediately
```

### 2. Celery Task Flow

```
Celery Task (Background)
    ↓
Task Completes (e.g., Google Calendar sync)
    ↓
Publishes to Redis Pub/Sub
    ↓
WebSocket Broadcasts to User
    ↓
Frontend Receives Update
```

## Redis Pub/Sub Channels

### User-specific Channels

- `user:{user_id}:tasks` - עדכוני משימות
- `user:{user_id}:notifications` - נוטיפיקציות

### Message Format

```json
{
  "type": "task_update",
  "data": {
    "id": 1,
    "title": "Task Title",
    "is_completed": true,
    ...
  }
}
```

## WebSocket Endpoints

### `/ws/tasks`
- **Authentication**: JWT token in query parameter
- **Purpose**: Real-time task updates
- **Channels**: `user:{id}:tasks`

### `/ws/notifications`
- **Authentication**: JWT token in query parameter
- **Purpose**: Real-time notifications
- **Channels**: `user:{id}:notifications`

## Frontend Integration

```javascript
import websocketService from './services/websocket'

// Connect
const token = localStorage.getItem('auth_token')
await websocketService.connect(token, '/ws/tasks')

// Listen for updates
websocketService.on('task_update', (taskData) => {
  // Update UI immediately
  updateTaskInState(taskData)
})

websocketService.on('task_created', (taskData) => {
  // Add new task
  addTaskToState(taskData)
})

websocketService.on('task_deleted', (data) => {
  // Remove task
  removeTaskFromState(data.task_id)
})
```

## HTTPS Support

המערכת תומכת ב-HTTPS דרך Nginx:

1. **Development**: HTTP (localhost)
2. **Production**: HTTPS עם SSL certificates

### Setup HTTPS

```bash
# Generate self-signed certificates (development)
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# Start with HTTPS
docker-compose -f docker-compose.yml -f docker-compose.https.yml up -d
```

## CORS Configuration

CORS מוגדר לתמוך ב-HTTPS:

- `http://localhost:3000`
- `https://localhost:3000`
- `http://localhost:5173`
- `https://localhost:5173`

## Performance

- **WebSocket**: Connection pooling per user
- **Redis Pub/Sub**: Efficient message broadcasting
- **Celery**: Async task processing
- **Connection Management**: Auto-reconnect on disconnect
