# AI Features Documentation

## Overview

המערכת כוללת תכונות AI מתקדמות להצעות ארגון, תיוג אוטומטי, וחישוב סדר אופטימלי.

## Features

- **Organization Suggestions** - הצעות ארגון חפצים וחדרים
- **Auto-Tagging** - תיוג אוטומטי של משימות
- **Optimal Ordering** - חישוב סדר אופטימלי לביצוע משימות
- **Room Improvements** - הצעות שיפור לחדרים

## Configuration

### Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...
AI_ENABLED=True
AI_MODEL=gpt-4o-mini
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=1000
```

### Model Options

- `gpt-4o-mini` - מודל מהיר וזול (מומלץ)
- `gpt-4o` - מודל חזק יותר
- `gpt-3.5-turbo` - חלופה זולה יותר

## API Endpoints

### Get Organization Suggestions

```bash
GET /api/ai/suggestions/organization?room_id=1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "suggestions": [
    {
      "type": "organization",
      "title": "ארגון אופטימלי",
      "description": "תיאור מפורט",
      "priority": "high"
    }
  ],
  "optimal_categories": [
    {
      "category": "בגדים",
      "location": "ארון",
      "reason": "סיבה"
    }
  ],
  "tips": ["טיפ 1", "טיפ 2"]
}
```

### Auto-Tag Task

```bash
POST /api/ai/auto-tag
Authorization: Bearer <token>
Content-Type: application/json

{
  "task_title": "ניקיון חדר",
  "task_description": "ניקיון יסודי של החדר"
}
```

**Response:**
```json
{
  "category": "ניקיון",
  "tags": ["ניקיון", "חדר"],
  "priority": "medium",
  "estimated_time_minutes": 30,
  "suggested_room": "סלון"
}
```

### Calculate Optimal Order

```bash
POST /api/ai/optimal-order
Authorization: Bearer <token>
Content-Type: application/json

{
  "task_ids": [1, 2, 3],
  "room_id": 1
}
```

**Response:**
```json
{
  "optimal_order": [
    {
      "task_id": 1,
      "order": 1,
      "reason": "משימה באותו חדר",
      "estimated_start_time": "09:00",
      "estimated_end_time": "09:30"
    }
  ],
  "total_time_minutes": 120,
  "efficiency_score": 0.85,
  "suggestions": ["הצעה 1"]
}
```

### Get Room Improvements

```bash
GET /api/ai/suggestions/room-improvements/1
Authorization: Bearer <token>
```

**Response:**
```json
{
  "improvements": [
    {
      "type": "organization",
      "title": "שיפור ארגון",
      "description": "תיאור",
      "impact": "high"
    }
  ],
  "new_task_suggestions": [
    {
      "title": "משימה חדשה",
      "description": "תיאור",
      "category": "קטגוריה"
    }
  ]
}
```

### AI Health Check

```bash
GET /api/ai/health
```

**Response:**
```json
{
  "enabled": true,
  "available": true,
  "model": "gpt-4o-mini"
}
```

## Usage Examples

### Frontend Integration

```typescript
// Get organization suggestions
const response = await fetch('/api/ai/suggestions/organization?room_id=1', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const suggestions = await response.json();
console.log(suggestions.suggestions);

// Auto-tag a task
const tagResponse = await fetch('/api/ai/auto-tag', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    task_title: 'ניקיון חדר',
    task_description: 'ניקיון יסודי',
  }),
});

const tags = await tagResponse.json();
console.log(tags.category, tags.tags);

// Calculate optimal order
const orderResponse = await fetch('/api/ai/optimal-order', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    room_id: 1,
  }),
});

const order = await orderResponse.json();
console.log(order.optimal_order);
```

## AI Service

### Organization Suggestions

```python
from app.services.ai import ai_service

suggestions = ai_service.suggest_organization(
    room_name="סלון",
    tasks=[...],
    categories=[...],
)
```

### Auto-Tagging

```python
tags = ai_service.auto_tag_task(
    task_title="ניקיון",
    task_description="ניקיון יסודי",
    existing_categories=["ניקיון", "בגדים"],
)
```

### Optimal Ordering

```python
order = ai_service.calculate_optimal_order(
    tasks=[...],
    rooms=[...],
)
```

## Cost Optimization

### Tips

1. **Use gpt-4o-mini** - זול יותר מ-gpt-4o
2. **Limit tokens** - הגדר `AI_MAX_TOKENS` ל-500-1000
3. **Cache results** - שמור תוצאות AI ב-Redis
4. **Batch requests** - שלב מספר בקשות
5. **Rate limiting** - הגבל בקשות AI למשתמש

### Estimated Costs

- **gpt-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **gpt-4o**: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens

## Error Handling

### Service Unavailable

אם AI לא זמין, API מחזיר `503 Service Unavailable`:

```json
{
  "detail": "AI features are disabled"
}
```

### Failed Generation

אם יצירת הצעות נכשלה:

```json
{
  "detail": "Failed to generate AI suggestions"
}
```

## Best Practices

1. **Check Health** - בדוק `GET /api/ai/health` לפני שימוש
2. **Handle Errors** - טיפול בשגיאות AI
3. **Cache Results** - שמור תוצאות ב-cache
4. **User Feedback** - אסוף feedback על הצעות
5. **Monitor Costs** - עקוב אחר עלויות OpenAI

## Future Enhancements

- [ ] Caching עם Redis
- [ ] Batch processing
- [ ] User preferences learning
- [ ] Multi-language support
- [ ] Alternative AI providers (Cohere, Groq)
