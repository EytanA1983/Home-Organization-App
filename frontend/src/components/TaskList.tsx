import { memo, useCallback, useEffect, useMemo } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import api from '../api';
import { TaskItem, TaskItemSkeleton } from './TaskItem';
import { sendWs } from '../utils/ws';
import { useTasks } from '../hooks/useTasks';
import { useVoice } from '../hooks/useVoice';

type Props = {
  filter?: {
    roomId?: number;
    categoryId?: number;
  };
};

/**
 * TaskList component - displays a list of tasks
 * Optimized with React.memo and useCallback to prevent unnecessary re-renders
 */
const TaskListComponent = ({ filter }: Props) => {
  const { speak } = useVoice();
  const queryClient = useQueryClient();

  // Memoize filter to prevent unnecessary refetches
  const stableFilter = useMemo(() => ({
    roomId: filter?.roomId,
    categoryId: filter?.categoryId,
  }), [filter?.roomId, filter?.categoryId]);

  // Use useTasks hook with stable filter
  const { data: tasks = [], isLoading, error } = useTasks(stableFilter);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const onMessage = (msg: any) => {
      if (msg.type === 'task-updated' || msg.type === 'task-completed') {
        // Invalidate tasks query to refetch
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    };

    // Connect to WebSocket
    import('../utils/ws').then(({ connectWs }) => {
      cleanup = connectWs(onMessage);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [queryClient]); // Remove filter from dependencies to prevent reconnection

  // Mutation for toggling task completion (memoized via useMutation)
  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: number; completed: boolean }) => {
      const response = await api.put(`/api/tasks/${taskId}`, { completed: !completed });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Voice feedback only when task is completed
      if (!variables.completed) {
        speak('המשימה הוסמה כהושלמה');
      }

      // Send WebSocket message
      sendWs({
        type: 'task-completed',
        payload: { taskId: variables.taskId, completed: !variables.completed }
      });

      // Invalidate and refetch tasks
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      console.error('Failed to toggle task completion:', error);
      speak('שגיאה בעדכון המשימה');
    },
  });

  // Memoized toggle handler
  const handleToggle = useCallback((taskId: number, completed: boolean) => {
    toggleCompleteMutation.mutate({ taskId, completed });
  }, [toggleCompleteMutation]);

  // Memoized refresh function for TodoItem onChange
  const refreshTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }, [queryClient]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <TaskItemSkeleton />
        <TaskItemSkeleton />
        <TaskItemSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <span className="emoji text-4xl block mb-2">⚠️</span>
        <p className="font-medium">שגיאה בטעינת משימות</p>
        <p className="text-sm mt-1 text-gray-500">
          {(error as Error)?.message || 'נסה לרענן את הדף'}
        </p>
      </div>
    );
  }

  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-300">
        <span className="emoji text-4xl block mb-2">📋</span>
        <p className="font-medium">אין משימות כרגע</p>
        <p className="text-sm mt-1">הוסף משימה חדשה להתחיל</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={handleToggle}
          onTodoChange={refreshTasks}
          isPending={
            toggleCompleteMutation.isPending &&
            toggleCompleteMutation.variables?.taskId === task.id
          }
        />
      ))}
    </div>
  );
};

// Export with React.memo
export const TaskList = memo(TaskListComponent, (prevProps, nextProps) => {
  // Compare filter objects
  return (
    prevProps.filter?.roomId === nextProps.filter?.roomId &&
    prevProps.filter?.categoryId === nextProps.filter?.categoryId
  );
});
TaskList.displayName = 'TaskList';

export default TaskList;
