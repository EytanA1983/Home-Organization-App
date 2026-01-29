# Calendar UI Documentation

## Overview

המערכת כוללת Calendar UI מלא עם FullCalendar - תצוגת שבוע/חודש של משימות, ואפשרות גרירת משימה לתאריך אחר.

## Features

- **Month View** - תצוגת חודש
- **Week View** - תצוגת שבוע
- **Day View** - תצוגת יום
- **List View** - תצוגת רשימה
- **Drag & Drop** - גרירת משימות לתאריך אחר
- **Resize** - שינוי משך המשימה
- **Click to Create** - לחיצה על תאריך ליצירת משימה חדשה

## Installation

התלויות כבר מותקנות ב-`package.json`:
- `@fullcalendar/react` - React wrapper
- `@fullcalendar/core` - Core library
- `@fullcalendar/daygrid` - Month view
- `@fullcalendar/timegrid` - Week/Day views
- `@fullcalendar/interaction` - Drag & drop
- `@fullcalendar/list` - List view

## Usage

### Calendar Page

```typescript
import { CalendarPage } from './pages/CalendarPage';

<Route path="/calendar" element={<CalendarPage />} />
```

### Features

1. **View Switching** - החלפה בין תצוגות (חודש, שבוע, יום, רשימה)
2. **Drag & Drop** - גרירת משימה לתאריך אחר
3. **Resize** - שינוי משך המשימה
4. **Click to Create** - לחיצה על תאריך ליצירת משימה
5. **Event Click** - לחיצה על משימה לפרטים

## API Integration

### Load Tasks

```typescript
const { data } = await api.get('/api/tasks');
```

### Update Task Date

```typescript
await api.put(`/api/tasks/${taskId}`, {
  due_date: newDate.toISOString(),
});
```

### Create Task

```typescript
await api.post('/api/tasks', {
  title: 'New Task',
  due_date: date.toISOString(),
});
```

## Configuration

### Calendar Options

```typescript
<FullCalendar
  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
  initialView="dayGridMonth"
  editable={true}
  selectable={true}
  droppable={true}
  locale="he"
  direction="rtl"
  // ... more options
/>
```

### Event Colors

- **Pending Tasks** - Brown (#8B4513)
- **Completed Tasks** - Gray (#9CA3AF)

## Customization

### Change Event Colors

```typescript
events={tasks.map((task) => ({
  backgroundColor: task.completed ? '#9CA3AF' : '#8B4513',
  borderColor: task.completed ? '#6B7280' : '#6B4513',
}))}
```

### Business Hours

```typescript
businessHours={{
  daysOfWeek: [0, 1, 2, 3, 4, 5], // Sunday to Thursday
  startTime: '08:00',
  endTime: '20:00',
}}
```

## RTL Support

הלוח תומך ב-RTL (Right-to-Left) לעברית:

```typescript
locale="he"
direction="rtl"
```

## Best Practices

1. **Optimistic Updates** - עדכן UI מיד, שלח request ברקע
2. **Error Handling** - חזור למצב הקודם במקרה של שגיאה
3. **Loading States** - הצג מצב טעינה
4. **Visual Feedback** - משוב ויזואלי ברור
5. **Accessibility** - תמיכה במקלדת

## Troubleshooting

### Events Not Showing

- בדוק שהמשימות כוללות `due_date`
- ודא שהמשימות לא מסומנות כ-`completed` (אם רוצים להציג רק משימות פעילות)
- בדוק את ה-console לשגיאות

### Drag & Drop Not Working

- ודא ש-`editable={true}` מוגדר
- בדוק שהאירועים כוללים `id`
- ודא שה-API endpoint עובד

### RTL Issues

- ודא ש-`direction="rtl"` מוגדר
- בדוק את ה-locale (`locale="he"`)
