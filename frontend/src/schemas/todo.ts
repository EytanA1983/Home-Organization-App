export interface TodoRead {
  id: number;
  title: string;
  completed: boolean;
  task_id: number;
  created_at?: string;
}
