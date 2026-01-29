import { TodoRead } from './todo';
import { CategoryRead } from './category';
import { RoomRead } from './room';

export interface TaskRead {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  recurrence?: string;
  category_id?: number;
  room_id?: number;
  completed: boolean;
  created_at: string;
  updated_at: string;
  category?: CategoryRead;
  room?: RoomRead;
  todos?: TodoRead[];
}
