import type { Task } from "../app/types";

/** Same key as Dashboard `demoTasksStorageKey` — demo / local task list per user. */
export function dashboardDemoTasksStorageKey(userId: number): string {
  return `dashboard_demo_tasks_${userId}`;
}

/** Read persisted dashboard demo tasks (or legacy `tasks`) for pie / category mix on Home. */
export function readDashboardDemoTasksFromStorage(userId: number | null): Task[] {
  if (userId == null || !Number.isFinite(userId)) return [];
  try {
    const key = dashboardDemoTasksStorageKey(userId);
    let raw = localStorage.getItem(key);
    if (!raw) {
      const legacy = localStorage.getItem("tasks");
      if (legacy) raw = legacy;
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Task[]) : [];
  } catch {
    return [];
  }
}
