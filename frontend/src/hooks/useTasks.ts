import { useQuery } from '@tanstack/react-query';
import api from '../api';

interface UseTasksParams {
  roomId?: number;
  categoryId?: number;
  completed?: boolean;
}

export const useTasks = (params?: UseTasksParams) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => {
      // Convert roomId to room_id for API
      const apiParams: any = {};
      if (params?.roomId) apiParams.room_id = params.roomId;
      if (params?.categoryId) apiParams.category_id = params.categoryId;
      if (params?.completed !== undefined) apiParams.completed = params.completed;
      
      const { data } = await api.get('/api/tasks', { params: apiParams });
      return data;
    },
  });
};
