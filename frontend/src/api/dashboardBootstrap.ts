/**
 * Shared fetchers for dashboard-critical React Query keys.
 * Used by Dashboard hydration + optional Login prefetch to avoid duplicate /tasks + /progress round-trips.
 */
export const DASHBOARD_QUERY_STALE_MS = 120_000;

import api, { getProgressSummary } from "../api";
import type { ProgressSummaryRead } from "../schemas/progress";
import type { TaskRead } from "../schemas/task";

export async function fetchDashboardProgressWeek(): Promise<ProgressSummaryRead> {
  const res = await getProgressSummary("week");
  return res.data;
}

export async function fetchDashboardTasksFullList(): Promise<TaskRead[]> {
  const { data } = await api.get<TaskRead[]>("/tasks");
  return Array.isArray(data) ? data : [];
}
