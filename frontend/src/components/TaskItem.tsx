import { memo, useCallback, useMemo } from 'react';
import { TodoItem } from './TodoItem';
import { formatDateHe } from '../utils/date';

// Task type definition
interface Task {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  todos?: Array<{
    id: number;
    title: string;
    completed: boolean;
  }>;
}

type Props = {
  task: Task;
  onToggle: (taskId: number, completed: boolean) => void;
  onTodoChange: () => void;
  isPending?: boolean;
};

/**
 * TaskItem component - displays a single task with its todos
 * Memoized for performance optimization
 */
const TaskItemComponent = ({ task, onToggle, onTodoChange, isPending = false }: Props) => {
  // Memoize the checkbox change handler
  const handleCheckboxChange = useCallback(() => {
    onToggle(task.id, task.completed);
  }, [onToggle, task.id, task.completed]);

  // Memoize formatted date
  const formattedDate = useMemo(() => {
    if (!task.due_date) return null;
    try {
      return formatDateHe(task.due_date);
    } catch {
      return new Date(task.due_date).toLocaleDateString('he-IL');
    }
  }, [task.due_date]);

  // Memoize todo progress
  const todoProgress = useMemo(() => {
    if (!task.todos || task.todos.length === 0) return null;
    const completed = task.todos.filter(t => t.completed).length;
    return { completed, total: task.todos.length };
  }, [task.todos]);

  return (
    <div
      className={`
        p-4 bg-white dark:bg-dark-surface rounded-lg shadow-sm
        hover:shadow-md transition-shadow flex flex-col
        border border-gray-100 dark:border-dark-border
        ${task.completed ? 'opacity-75' : ''}
      `}
    >
      {/* Task header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="emoji text-xl flex-shrink-0">
            {task.completed ? '✅' : '📝'}
          </span>
          <h4 className={`font-medium truncate ${
            task.completed
              ? 'line-through text-gray-500 dark:text-gray-300'
              : 'text-gray-900 dark:text-dark-text'
          }`}>
            {task.title}
          </h4>
        </div>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={handleCheckboxChange}
          disabled={isPending}
          className="form-checkbox h-5 w-5 text-sky cursor-pointer disabled:opacity-50 flex-shrink-0 ml-2"
          aria-label={`סמן משימה "${task.title}" כ${task.completed ? 'לא ' : ''}הושלמה`}
        />
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 mr-7">
          {task.description}
        </p>
      )}

      {/* Due date */}
      {formattedDate && (
        <div className="flex items-center gap-1 mt-2 mr-7 text-xs text-gray-500 dark:text-gray-300">
          <span className="emoji">⏰</span>
          <span>{formattedDate}</span>
        </div>
      )}

      {/* Todo progress indicator */}
      {todoProgress && (
        <div className="flex items-center gap-2 mt-2 mr-7 text-xs text-gray-500 dark:text-gray-300">
          <span className="emoji">📋</span>
          <span>
            {todoProgress.completed}/{todoProgress.total} תתי-משימות
          </span>
          {todoProgress.completed === todoProgress.total && (
            <span className="emoji">🎉</span>
          )}
        </div>
      )}

      {/* Todos list */}
      {task.todos && task.todos.length > 0 && (
        <div className="mt-3 mr-7 space-y-1 border-t border-gray-100 dark:border-dark-border pt-2">
          {task.todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              taskId={task.id}
              onChange={onTodoChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Export with React.memo and deep comparison
export const TaskItem = memo(TaskItemComponent, (prevProps, nextProps) => {
  // Compare task data
  if (prevProps.task.id !== nextProps.task.id) return false;
  if (prevProps.task.completed !== nextProps.task.completed) return false;
  if (prevProps.task.title !== nextProps.task.title) return false;
  if (prevProps.task.description !== nextProps.task.description) return false;
  if (prevProps.task.due_date !== nextProps.task.due_date) return false;
  if (prevProps.isPending !== nextProps.isPending) return false;

  // Compare todos array
  const prevTodos = prevProps.task.todos;
  const nextTodos = nextProps.task.todos;

  if (!prevTodos && !nextTodos) return true;
  if (!prevTodos || !nextTodos) return false;
  if (prevTodos.length !== nextTodos.length) return false;

  // Deep compare todos
  for (let i = 0; i < prevTodos.length; i++) {
    if (
      prevTodos[i].id !== nextTodos[i].id ||
      prevTodos[i].completed !== nextTodos[i].completed ||
      prevTodos[i].title !== nextTodos[i].title
    ) {
      return false;
    }
  }

  return true;
});
TaskItem.displayName = 'TaskItem';

/**
 * TaskItemSkeleton - Loading placeholder
 */
export const TaskItemSkeleton = memo(() => (
  <div className="p-4 bg-white dark:bg-dark-surface rounded-lg shadow-sm border border-gray-100 dark:border-dark-border animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-6 h-6 bg-gray-200 dark:bg-dark-border rounded" />
        <div className="h-5 w-48 bg-gray-200 dark:bg-dark-border rounded" />
      </div>
      <div className="w-5 h-5 bg-gray-200 dark:bg-dark-border rounded" />
    </div>
    <div className="mt-2 mr-7 h-4 w-32 bg-gray-200 dark:bg-dark-border rounded" />
  </div>
));
TaskItemSkeleton.displayName = 'TaskItemSkeleton';

export default TaskItem;
