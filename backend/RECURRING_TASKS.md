# Advanced Recurring Tasks with RRULE

## Overview

המערכת תומכת במשימות חוזרות מתקדמות עם **RRULE** (RFC 5545) - תזמון חזרתי קפדני.

## RRULE Examples

### דוגמאות נפוצות:

1. **כל יום**
   ```
   FREQ=DAILY
   ```

2. **כל 3 ימים**
   ```
   FREQ=DAILY;INTERVAL=3
   ```

3. **כל יום שני**
   ```
   FREQ=WEEKLY;BYDAY=MO
   ```

4. **כל שבוע**
   ```
   FREQ=WEEKLY
   ```

5. **ראשון ראשון בחודש**
   ```
   FREQ=MONTHLY;BYMONTHDAY=1
   ```

6. **ראשון ראשון בחודש (יום שני)**
   ```
   FREQ=MONTHLY;BYDAY=1MO
   ```

7. **כל חודש**
   ```
   FREQ=MONTHLY
   ```

8. **כל שנה**
   ```
   FREQ=YEARLY
   ```

## Usage

### יצירת משימה חוזרת

```json
POST /api/tasks
{
  "title": "ניקיון שבועי",
  "description": "ניקיון יסודי של הבית",
  "rrule_string": "FREQ=WEEKLY;BYDAY=MO",
  "rrule_start_date": "2024-01-15T10:00:00",
  "rrule_end_date": "2024-12-31T23:59:59",
  "room_id": 1
}
```

### בדיקת RRULE

```bash
POST /api/recurring-tasks/validate?rrule_string=FREQ=DAILY;INTERVAL=3&start_date=2024-01-15T10:00:00
```

### קבלת דוגמאות

```bash
GET /api/recurring-tasks/examples
```

### צפייה בתבניות חוזרות

```bash
GET /api/recurring-tasks/templates
```

### צפייה ב-instances

```bash
GET /api/recurring-tasks/templates/123/instances
```

### צפייה בתאריכים הבאים

```bash
GET /api/recurring-tasks/templates/123/next-occurrences?count=10
```

## Architecture

### Task Model Fields

- `rrule_string` - RRULE string (RFC 5545)
- `rrule_start_date` - תאריך התחלה
- `rrule_end_date` - תאריך סיום (אופציונלי)
- `parent_task_id` - משימה אב (אם זו instance)
- `is_recurring_template` - האם זו תבנית

### Automatic Instance Generation

Celery Beat מריץ יומית:
- `generate_recurring_instances` - יוצר instances לעתיד (30 יום קדימה)
- `cleanup_old_instances` - מנקה instances ישנים (מעל 30 יום)

### Service Methods

- `parse_rrule()` - Parsing של RRULE string
- `generate_occurrences()` - יצירת רשימת תאריכים
- `create_recurring_instances()` - יצירת instances במסד הנתונים
- `validate_rrule()` - בדיקת תקינות RRULE
- `get_rrule_examples()` - דוגמאות נפוצות

## Best Practices

1. **תמיד הגדר `rrule_start_date`** - תאריך התחלה ל-RRULE
2. **השתמש ב-`rrule_end_date`** - כדי להגביל את התקופה
3. **בדוק RRULE לפני יצירה** - השתמש ב-`/validate` endpoint
4. **השתמש בדוגמאות** - `/examples` endpoint

## Migration

צריך ליצור migration לשדות החדשים:

```bash
cd backend
poetry run alembic revision --autogenerate -m "add rrule support to tasks"
poetry run alembic upgrade head
```
