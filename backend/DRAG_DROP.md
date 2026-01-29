# Drag & Drop System Documentation

## Overview

המערכת כוללת תמיכה מלאה ב-Drag & Drop לסידור משימות, קטגוריות ותתי-משימות.

## Features

- **Task Reordering** - סידור משימות באמצעות drag & drop
- **Category Reordering** - סידור קטגוריות
- **Todo Reordering** - סידור תתי-משימות
- **Visual Feedback** - משוב ויזואלי בזמן גרירה
- **Optimistic Updates** - עדכון מיידי ב-UI

## Backend Changes

### Database Models

נוסף שדה `position` למודלים:
- `Task.position` - סדר תצוגה של משימות
- `Category.position` - סדר תצוגה של קטגוריות
- `Todo.position` - סדר תצוגה של תתי-משימות

### API Endpoints

#### Reorder Tasks

```bash
PUT /api/drag-drop/tasks/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "task_ids": [3, 1, 2],
  "room_id": 1,  // Optional
  "category_id": 2  // Optional
}
```

#### Reorder Categories

```bash
PUT /api/drag-drop/categories/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "category_ids": [2, 1, 3]
}
```

#### Reorder Todos

```bash
PUT /api/drag-drop/todos/reorder
Authorization: Bearer <token>
Content-Type: application/json

{
  "todo_ids": [2, 1, 3],
  "task_id": 1
}
```

## Frontend Components

### DragDropTaskList

קומפוננטה לסידור משימות:

```typescript
import { DragDropTaskList } from './components/DragDropTaskList';

<DragDropTaskList
  tasks={tasks}
  onTasksUpdate={(updatedTasks) => setTasks(updatedTasks)}
  roomId={roomId}
  categoryId={categoryId}
/>
```

### DragDropCategoryList

קומפוננטה לסידור קטגוריות:

```typescript
import { DragDropCategoryList } from './components/DragDropCategoryList';

<DragDropCategoryList
  categories={categories}
  onCategoriesUpdate={(updatedCategories) => setCategories(updatedCategories)}
  onCategoryClick={(categoryId) => handleCategoryClick(categoryId)}
/>
```

### DragDropTodoList

קומפוננטה לסידור תתי-משימות:

```typescript
import { DragDropTodoList } from './components/DragDropTodoList';

<DragDropTodoList
  todos={todos}
  taskId={taskId}
  onTodosUpdate={(updatedTodos) => setTodos(updatedTodos)}
/>
```

## Usage Examples

### Replace TaskList with DragDropTaskList

```typescript
// Before
import { TaskList } from './components/TaskList';
<TaskList tasks={tasks} />

// After
import { DragDropTaskList } from './components/DragDropTaskList';
<DragDropTaskList
  tasks={tasks}
  onTasksUpdate={setTasks}
  roomId={currentRoomId}
/>
```

### Using in RoomPage

```typescript
import { DragDropTaskList } from '../components/DragDropTaskList';

const [tasks, setTasks] = useState<Task[]>([]);

<DragDropTaskList
  tasks={tasks}
  onTasksUpdate={setTasks}
  roomId={roomId}
/>
```

## Features

### Visual Feedback

- **Dragging State** - אייטם נגרר מופיע עם opacity מופחת
- **Hover Effect** - אפקט hover על אייטמים
- **Grab Cursor** - סמן grab בזמן גרירה
- **Reordering Indicator** - הודעת "מסדר מחדש..." בזמן עדכון

### Error Handling

- **Optimistic Updates** - עדכון מיידי ב-UI
- **Error Revert** - חזרה למצב הקודם במקרה של שגיאה
- **Loading State** - מצב טעינה בזמן עדכון

### Accessibility

- **Keyboard Support** - תמיכה במקלדת (arrow keys)
- **Screen Reader** - תמיכה בקוראי מסך
- **Focus Management** - ניהול פוקוס

## Migration

### Database Migration

צריך ליצור migration להוספת שדה `position`:

```python
# alembic/versions/XXX_add_position_fields.py
def upgrade():
    op.add_column('tasks', sa.Column('position', sa.Integer(), default=0))
    op.add_column('categories', sa.Column('position', sa.Integer(), default=0))
    op.add_column('todos', sa.Column('position', sa.Integer(), default=0))
```

### Update Existing Data

לאחר הוספת השדה, עדכן את הנתונים הקיימים:

```python
# Set position based on current order
tasks = db.query(Task).order_by(Task.created_at).all()
for i, task in enumerate(tasks, start=1):
    task.position = i
db.commit()
```

## Best Practices

1. **Optimistic Updates** - עדכן UI מיד, שלח request ברקע
2. **Error Handling** - חזור למצב הקודם במקרה של שגיאה
3. **Loading States** - הצג מצב טעינה
4. **Visual Feedback** - משוב ויזואלי ברור
5. **Accessibility** - תמיכה במקלדת וקוראי מסך

## Troubleshooting

### Items Not Reordering

- בדוק שהשדה `position` קיים במודל
- ודא שה-API endpoint מחזיר 200
- בדוק את ה-console לשגיאות

### Visual Issues

- ודא ש-CSS classes מוגדרים נכון
- בדוק את ה-transform styles
- ודא ש-transition מוגדר

### Performance

- השתמש ב-React.memo לקומפוננטות
- הגבל את מספר האייטמים (pagination)
- השתמש ב-virtualization לרשימות ארוכות
