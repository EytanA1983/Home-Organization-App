/** Matches backend app/schemas/progress.py (GET /api/progress/summary). */

export interface DailyCompletedCount {
  date: string;
  count: number;
}

/** GET /progress/summary — per–product-category task mix (from server tasks). */
export interface CategoryProgressItem {
  category: string;
  completed: number;
  total: number;
  percent: number;
}

export interface ProgressSummaryRead {
  completed_tasks_this_week: number;
  rooms_progressed_this_week: number;
  streak_days: number;
  daily_completed_counts: DailyCompletedCount[];
  /** Present on newer APIs; omitted on older backends. */
  category_progress?: CategoryProgressItem[];
  range?: "week" | "month";
}
