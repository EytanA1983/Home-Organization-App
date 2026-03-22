/**
 * Rolling daily task list: cap how many pending tasks show per calendar day,
 * refill from the eligible pool when one completes or defers.
 */
import type { Task } from "../app/types";
import { filterPendingTasksForDateKey, filterPendingTasksForSelectedDay } from "./dashboardScheduledTasks";

/** @deprecated use bucket caps — kept for tests / imports */
export const DASHBOARD_DAILY_VISIBLE_CAP = 5;

/** Max pending tasks shown per bucket for the selected calendar day. */
export const DASHBOARD_DAILY_BUCKET_CAP = 5;
export const DASHBOARD_MONTHLY_BUCKET_CAP = 4;

function scheduledMinutes(task: Task): number {
  const raw = task.scheduledTime?.trim() ?? "";
  const m = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return 24 * 60;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return 24 * 60;
  return h * 60 + min;
}

function sortPendingByTimeThenId(pending: Task[]): Task[] {
  return [...pending].sort((a, b) => {
    const ma = scheduledMinutes(a);
    const mb = scheduledMinutes(b);
    if (ma !== mb) return ma - mb;
    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
  });
}

/** All pending tasks eligible for this weekday, sorted by time then id (stable pool order). */
export function sortEligiblePendingForDay(
  tasks: Task[],
  dayIndex: number,
  weekStartSunday: Date,
): Task[] {
  const pending = filterPendingTasksForSelectedDay(tasks, dayIndex, weekStartSunday);
  return sortPendingByTimeThenId(pending);
}

/**
 * Split eligible pending tasks into “daily rhythm” (daily + weekly) vs “monthly” for the selected calendar day.
 */
export function sortEligiblePendingForDayBuckets(
  tasks: Task[],
  dayIndex: number,
  weekStartSunday: Date,
): { daily: Task[]; monthly: Task[] } {
  const pending = filterPendingTasksForSelectedDay(tasks, dayIndex, weekStartSunday);
  const dailyPool = pending.filter((t) => t.frequency === "daily" || t.frequency === "weekly");
  const monthlyPool = pending.filter((t) => t.frequency === "monthly");
  return {
    daily: sortPendingByTimeThenId(dailyPool),
    monthly: sortPendingByTimeThenId(monthlyPool),
  };
}

/** Same as `sortEligiblePendingForDayBuckets` but keyed by explicit calendar YYYY-MM-DD (Google week strip). */
export function sortEligiblePendingForDayBucketsForDateKey(
  tasks: Task[],
  cellDateKey: string,
): { daily: Task[]; monthly: Task[] } {
  const pending = filterPendingTasksForDateKey(tasks, cellDateKey);
  const dailyPool = pending.filter((t) => t.frequency === "daily" || t.frequency === "weekly");
  const monthlyPool = pending.filter((t) => t.frequency === "monthly");
  return {
    daily: sortPendingByTimeThenId(dailyPool),
    monthly: sortPendingByTimeThenId(monthlyPool),
  };
}

/**
 * Keep previously visible ids that are still eligible (order preserved), then backfill from
 * `eligibleSorted` until `cap`. Single place for complete + defer symmetry.
 */
export function reconcileVisibleTaskIds(
  eligibleSorted: Task[],
  previousVisibleIds: string[] | undefined,
  cap: number,
): string[] {
  const eligibleIds = eligibleSorted.map((t) => String(t.id));
  const eligibleSet = new Set(eligibleIds);

  const kept: string[] = [];
  const seen = new Set<string>();
  for (const id of previousVisibleIds ?? []) {
    if (!eligibleSet.has(id) || seen.has(id)) continue;
    if (kept.length >= cap) break;
    kept.push(id);
    seen.add(id);
  }
  for (const id of eligibleIds) {
    if (kept.length >= cap) break;
    if (seen.has(id)) continue;
    kept.push(id);
    seen.add(id);
  }
  return kept;
}
