# Statistics API - מדדים סטטיסטיים

## Overview

המערכת מספקת מדדים סטטיסטיים מקיפים על משימות, חדרים, קטגוריות וזמנים.

## Features

### 1. Completion Rates (אחוזי סיום)
- אחוז משימות שהושלמו
- סה"כ, הושלמו, ממתינות
- לפי חדר, קטגוריה, או כלל

### 2. Averages & Standard Deviation (ממוצע וסטיית תקן)
- ממוצע משימות לחדר/קטגוריה
- חציון משימות לחדר/קטגוריה
- סטיית תקן של התפלגות

### 3. Time-Based Statistics (סטטיסטיקות לפי זמן)
- משימות שנוצרו בתקופה
- משימות שהושלמו בתקופה
- ממוצע יומי של יצירה/סיום
- אחוז סיום בתקופה

### 4. Distributions (התפלגויות)
- התפלגות משימות לפי חדרים
- התפלגות משימות לפי קטגוריות
- אחוזי סיום לכל חדר/קטגוריה

### 5. Task Duration Statistics (משך זמן ביצוע)
- ממוצע זמן מ-created עד completed
- חציון, מינימום, מקסימום
- סטיית תקן

## API Endpoints

### 1. Overall Statistics (סטטיסטיקות כלליות)

```bash
GET /api/statistics/overall
```

**Response:**
```json
{
  "overall": {
    "total": 150,
    "completed": 75,
    "pending": 75,
    "completion_rate": 50.0,
    "completion_percentage": 50.0
  },
  "by_room": {
    "total": 150,
    "completed": 75,
    "pending": 75,
    "completion_rate": 50.0,
    "avg_tasks_per_room": 25.0,
    "std_tasks_per_room": 5.2,
    "median_tasks_per_room": 24.0,
    "rooms_count": 6
  },
  "by_category": {
    "total": 150,
    "completed": 75,
    "pending": 75,
    "completion_rate": 50.0,
    "avg_tasks_per_category": 30.0,
    "std_tasks_per_category": 8.5,
    "median_tasks_per_category": 28.0,
    "categories_count": 5
  },
  "by_time": {
    "period_days": 30,
    "period_start": "2024-01-01T00:00:00",
    "period_end": "2024-01-31T23:59:59",
    "tasks_created": 45,
    "tasks_completed": 30,
    "tasks_due": 20,
    "avg_created_per_day": 1.5,
    "avg_completed_per_day": 1.0,
    "completion_rate_in_period": 66.67
  },
  "distributions": {
    "rooms": [
      {
        "room_id": 1,
        "room_name": "סלון",
        "task_count": 30,
        "completed_count": 15,
        "pending_count": 15,
        "completion_rate": 50.0
      }
    ],
    "categories": [
      {
        "category_id": 1,
        "category_name": "ניקיון",
        "task_count": 40,
        "completed_count": 25,
        "pending_count": 15,
        "completion_rate": 62.5
      }
    ]
  },
  "averages": {
    "avg_room_completion_rate": 50.0,
    "std_room_completion_rate": 12.5,
    "avg_category_completion_rate": 55.0,
    "std_category_completion_rate": 10.2
  }
}
```

### 2. Completion Statistics (אחוזי סיום)

```bash
GET /api/statistics/completion?room_id=1
GET /api/statistics/completion?category_id=2
GET /api/statistics/completion
```

**Response:**
```json
{
  "total": 50,
  "completed": 25,
  "pending": 25,
  "completion_rate": 50.0,
  "completion_percentage": 50.0
}
```

### 3. Room Statistics (סטטיסטיקות לפי חדר)

```bash
GET /api/statistics/by-room
GET /api/statistics/by-room?room_id=1
```

**Response:**
```json
{
  "total": 150,
  "completed": 75,
  "pending": 75,
  "completion_rate": 50.0,
  "completion_percentage": 50.0,
  "avg_tasks_per_room": 25.0,
  "std_tasks_per_room": 5.2,
  "median_tasks_per_room": 24.0,
  "rooms_count": 6
}
```

### 4. Category Statistics (סטטיסטיקות לפי קטגוריה)

```bash
GET /api/statistics/by-category
GET /api/statistics/by-category?category_id=2
```

**Response:**
```json
{
  "total": 150,
  "completed": 75,
  "pending": 75,
  "completion_rate": 50.0,
  "completion_percentage": 50.0,
  "avg_tasks_per_category": 30.0,
  "std_tasks_per_category": 8.5,
  "median_tasks_per_category": 28.0,
  "categories_count": 5
}
```

### 5. Time-Based Statistics (סטטיסטיקות לפי זמן)

```bash
GET /api/statistics/by-time?days=30
GET /api/statistics/by-time?days=7
```

**Response:**
```json
{
  "period_days": 30,
  "period_start": "2024-01-01T00:00:00",
  "period_end": "2024-01-31T23:59:59",
  "tasks_created": 45,
  "tasks_completed": 30,
  "tasks_due": 20,
  "avg_created_per_day": 1.5,
  "avg_completed_per_day": 1.0,
  "completion_rate_in_period": 66.67
}
```

### 6. Room Distribution (התפלגות לפי חדרים)

```bash
GET /api/statistics/room-distribution
```

**Response:**
```json
[
  {
    "room_id": 1,
    "room_name": "סלון",
    "task_count": 30,
    "completed_count": 15,
    "pending_count": 15,
    "completion_rate": 50.0
  },
  {
    "room_id": 2,
    "room_name": "מטבח",
    "task_count": 25,
    "completed_count": 20,
    "pending_count": 5,
    "completion_rate": 80.0
  }
]
```

### 7. Category Distribution (התפלגות לפי קטגוריות)

```bash
GET /api/statistics/category-distribution
```

**Response:**
```json
[
  {
    "category_id": 1,
    "category_name": "ניקיון",
    "task_count": 40,
    "completed_count": 25,
    "pending_count": 15,
    "completion_rate": 62.5
  }
]
```

### 8. Task Duration Statistics (משך זמן ביצוע)

```bash
GET /api/statistics/task-duration
```

**Response:**
```json
{
  "total_completed": 75,
  "avg_duration_hours": 48.5,
  "avg_duration_days": 2.02,
  "median_duration_hours": 24.0,
  "median_duration_days": 1.0,
  "std_duration_hours": 25.3,
  "min_duration_hours": 1.0,
  "max_duration_hours": 168.0
}
```

## Usage Examples

### Frontend Integration

```typescript
// Get overall statistics
const stats = await api.get('/api/statistics/overall');

// Get completion rate for a room
const roomStats = await api.get('/api/statistics/completion', {
  params: { room_id: 1 }
});

// Get time-based stats for last week
const timeStats = await api.get('/api/statistics/by-time', {
  params: { days: 7 }
});

// Get room distribution
const distribution = await api.get('/api/statistics/room-distribution');
```

## Implementation Details

### Statistics Service (`app/services/statistics.py`)

- **calculate_completion_rate()** - חישוב אחוזי סיום
- **calculate_task_statistics_by_room()** - סטטיסטיקות לפי חדר
- **calculate_task_statistics_by_category()** - סטטיסטיקות לפי קטגוריה
- **calculate_time_based_statistics()** - סטטיסטיקות לפי זמן
- **calculate_room_distribution()** - התפלגות לפי חדרים
- **calculate_category_distribution()** - התפלגות לפי קטגוריות
- **calculate_overall_statistics()** - סטטיסטיקות כלליות
- **calculate_task_duration_statistics()** - משך זמן ביצוע

### Libraries Used

- **statistics** (stdlib) - mean, stdev, median
- **sqlalchemy** - queries and aggregations
- **datetime** - time calculations

### Performance

- כל החישובים מבוצעים ב-database queries יעילים
- שימוש ב-aggregations (COUNT, SUM) במקום טעינת כל הרשומות
- אין צורך ב-numpy - כל החישובים עם stdlib

## Best Practices

1. **Use filters** - השתמש ב-query parameters לסנן לפי room/category
2. **Cache results** - שקול caching לסטטיסטיקות כלליות (אם יש הרבה משתמשים)
3. **Time periods** - השתמש ב-`days` parameter לסטטיסטיקות לפי זמן
4. **Error handling** - כל ה-endpoints מטפלים ב-empty data gracefully
