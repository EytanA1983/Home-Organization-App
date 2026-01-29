/**
 * React Query Hooks for API
 *
 * Auto-generated wrapper around the API client with React Query integration.
 * Provides typed hooks for all API endpoints with caching, invalidation, and optimistic updates.
 *
 * Usage:
 *   import { useRooms, useCreateRoom, useTasks } from '@/api/hooks';
 *
 *   const { data: rooms, isLoading } = useRooms();
 *   const createRoom = useCreateRoom();
 *   createRoom.mutate({ name: 'New Room' });
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { api, configureApiClient, type Schemas, type ApiError } from './generated';

// ==================== Query Keys ====================

export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  // Rooms
  rooms: {
    all: ['rooms'] as const,
    lists: () => [...queryKeys.rooms.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.rooms.lists(), filters] as const,
    details: () => [...queryKeys.rooms.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.rooms.details(), id] as const,
  },

  // Tasks
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters?: { room_id?: number; completed?: boolean; category_id?: number }) =>
      [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.tasks.details(), id] as const,
  },

  // Categories
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    list: () => [...queryKeys.categories.lists()] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.categories.details(), id] as const,
  },

  // Todos
  todos: {
    all: ['todos'] as const,
    lists: () => [...queryKeys.todos.all, 'list'] as const,
    list: (taskId: number) => [...queryKeys.todos.lists(), taskId] as const,
    details: () => [...queryKeys.todos.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.todos.details(), id] as const,
  },

  // Statistics
  statistics: {
    all: ['statistics'] as const,
  },
};

// ==================== Auth Hooks ====================

export function useCurrentUser(
  options?: Omit<UseQueryOptions<Schemas['UserRead'], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => api.auth.me(),
    ...options,
  });
}

export function useLogin(
  options?: UseMutationOptions<Schemas['Token'], ApiError, Schemas['UserLogin']>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Schemas['UserLogin']) => api.auth.login(data),
    onSuccess: (data) => {
      // Store token
      localStorage.setItem('token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
      // Invalidate user query
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
    },
    ...options,
  });
}

export function useRegister(
  options?: UseMutationOptions<Schemas['UserRead'], ApiError, Schemas['UserCreate']>
) {
  return useMutation({
    mutationFn: (data: Schemas['UserCreate']) => api.auth.register(data),
    ...options,
  });
}

export function useLogout(
  options?: UseMutationOptions<void, ApiError, void>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.auth.logout(),
    onSuccess: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      queryClient.clear();
    },
    ...options,
  });
}

// ==================== Room Hooks ====================

export function useRooms(
  options?: Omit<UseQueryOptions<Schemas['RoomResponse'][], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.rooms.list(),
    queryFn: () => api.rooms.list(),
    ...options,
  });
}

export function useRoom(
  id: number,
  options?: Omit<UseQueryOptions<Schemas['RoomResponse'], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.rooms.detail(id),
    queryFn: () => api.rooms.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateRoom(
  options?: UseMutationOptions<Schemas['RoomResponse'], ApiError, Schemas['RoomCreate']>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Schemas['RoomCreate']) => api.rooms.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.lists() });
    },
    ...options,
  });
}

export function useUpdateRoom(
  options?: UseMutationOptions<Schemas['RoomResponse'], ApiError, { id: number; data: Schemas['RoomUpdate'] }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.rooms.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.detail(id) });
    },
    ...options,
  });
}

export function useDeleteRoom(
  options?: UseMutationOptions<void, ApiError, number>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.rooms.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rooms.lists() });
    },
    ...options,
  });
}

// ==================== Task Hooks ====================

export function useTasks(
  filters?: { room_id?: number; completed?: boolean; category_id?: number },
  options?: Omit<UseQueryOptions<Schemas['TaskRead'][], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => api.tasks.list(filters),
    ...options,
  });
}

export function useTask(
  id: number,
  options?: Omit<UseQueryOptions<Schemas['TaskRead'], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => api.tasks.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateTask(
  options?: UseMutationOptions<Schemas['TaskRead'], ApiError, Schemas['TaskCreate']>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Schemas['TaskCreate']) => api.tasks.create(data),
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });

      // Optimistic update for room tasks
      if (newTask.room_id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.tasks.list({ room_id: newTask.room_id })
        });
      }
    },
    ...options,
  });
}

export function useUpdateTask(
  options?: UseMutationOptions<Schemas['TaskRead'], ApiError, { id: number; data: Schemas['TaskUpdate'] }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.tasks.update(id, data),
    onSuccess: (updatedTask, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
    ...options,
  });
}

export function useCompleteTask(
  options?: UseMutationOptions<Schemas['TaskRead'], ApiError, number>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.tasks.complete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.lists() });

      // Optimistic update
      queryClient.setQueriesData<Schemas['TaskRead'][]>(
        { queryKey: queryKeys.tasks.lists() },
        (old) => old?.map(task =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
    ...options,
  });
}

export function useDeleteTask(
  options?: UseMutationOptions<void, ApiError, number>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.tasks.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.statistics.all });
    },
    ...options,
  });
}

// ==================== Category Hooks ====================

export function useCategories(
  options?: Omit<UseQueryOptions<Schemas['CategoryRead'][], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: () => api.categories.list(),
    ...options,
  });
}

export function useCategory(
  id: number,
  options?: Omit<UseQueryOptions<Schemas['CategoryRead'], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.categories.detail(id),
    queryFn: () => api.categories.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useCreateCategory(
  options?: UseMutationOptions<Schemas['CategoryRead'], ApiError, Schemas['CategoryCreate']>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Schemas['CategoryCreate']) => api.categories.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
    },
    ...options,
  });
}

export function useUpdateCategory(
  options?: UseMutationOptions<Schemas['CategoryRead'], ApiError, { id: number; data: Schemas['CategoryUpdate'] }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.categories.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.detail(id) });
    },
    ...options,
  });
}

export function useDeleteCategory(
  options?: UseMutationOptions<void, ApiError, number>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.lists() });
    },
    ...options,
  });
}

// ==================== Todo Hooks ====================

export function useTodos(
  taskId: number,
  options?: Omit<UseQueryOptions<Schemas['TodoRead'][], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.todos.list(taskId),
    queryFn: () => api.todos.list(taskId),
    enabled: !!taskId,
    ...options,
  });
}

export function useCreateTodo(
  options?: UseMutationOptions<Schemas['TodoRead'], ApiError, { taskId: number; data: Schemas['TodoCreate'] }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }) => api.todos.create(taskId, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.list(taskId) });
    },
    ...options,
  });
}

export function useUpdateTodo(
  options?: UseMutationOptions<Schemas['TodoRead'], ApiError, { id: number; data: Schemas['TodoUpdate']; taskId: number }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => api.todos.update(id, data),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.list(taskId) });
    },
    ...options,
  });
}

export function useCompleteTodo(
  options?: UseMutationOptions<Schemas['TodoRead'], ApiError, { id: number; taskId: number }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => api.todos.complete(id),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.list(taskId) });
    },
    ...options,
  });
}

export function useDeleteTodo(
  options?: UseMutationOptions<void, ApiError, { id: number; taskId: number }>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => api.todos.delete(id),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.list(taskId) });
    },
    ...options,
  });
}

// ==================== Statistics Hooks ====================

export function useStatistics(
  options?: Omit<UseQueryOptions<Schemas['StatisticsResponse'], ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.statistics.all,
    queryFn: () => api.statistics.get(),
    ...options,
  });
}

// ==================== Notifications Hooks ====================

export function useSubscribePush(
  options?: UseMutationOptions<Schemas['PushSubscriptionRead'], ApiError, Schemas['PushSubscriptionCreate']>
) {
  return useMutation({
    mutationFn: (data: Schemas['PushSubscriptionCreate']) => api.notifications.subscribe(data),
    ...options,
  });
}

export function useUnsubscribePush(
  options?: UseMutationOptions<void, ApiError, string>
) {
  return useMutation({
    mutationFn: (endpoint: string) => api.notifications.unsubscribe(endpoint),
    ...options,
  });
}

export function useVapidKey(
  options?: Omit<UseQueryOptions<{ public_key: string }, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['notifications', 'vapid-key'],
    queryFn: () => api.notifications.getVapidKey(),
    staleTime: Infinity, // VAPID key doesn't change
    ...options,
  });
}
