/**
 * Which local dashboard tasks are scheduled on a weekday (0=Sun … 6=Sat).
 * Does not filter by completion — use with `!task.completed` for the active list.
 */
import type { Task } from "../app/types";

/** Deterministic day slot for weekly/monthly-style tasks (same hash as WeeklyCalendarStrip). */
export function stableDayIndexForTask(taskId: string): number {
  let hash = 0;
  for (let i = 0; i < taskId.length; i++) hash = (hash * 31 + taskId.charCodeAt(i)) >>> 0;
  return hash % 7;
}

/** Whether this task appears on `dayIndex` in the week view (ignores `completed`). */
export function taskScheduledOnWeekday(task: Task, dayIndex: number): boolean {
  if (task.frequency === "daily") return true;
  if (task.frequency === "weekly") {
    return stableDayIndexForTask(String(task.id)) === dayIndex;
  }
  if (task.frequency === "monthly") {
    return stableDayIndexForTask(`m:${task.id}`) === dayIndex;
  }
  return false;
}

/** Pending tasks for the selected weekday, all rooms aggregated. */
export function filterPendingTasksForSelectedDay(tasks: Task[], dayIndex: number): Task[] {
  return tasks.filter((t) => !t.completed && taskScheduledOnWeekday(t, dayIndex));
}
