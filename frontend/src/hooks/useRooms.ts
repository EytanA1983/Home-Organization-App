import { useQuery } from '@tanstack/react-query';
import api from '../api';

export const useRooms = () => {
  return useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data } = await api.get('/api/rooms');
      return data;
    },
  });
};
