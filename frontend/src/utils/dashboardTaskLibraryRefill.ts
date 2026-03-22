/**
 * Dashboard visible-list refill: when the user has fewer real pending tasks than the bucket cap,
 * append deterministic suggestions from `frontend/src/data/taskLibrary.ts`.
 *
 * Uses canonical product categories + taskLibrary helpers (getDailyTasks, getMonthlyTasks,
 * getTasksByCategory, getCoreTasksByCategory). No ad-hoc title lists here.
 */
import type { Task } from "../app/types";
import type { ProductCategoryKey } from "../domain/productCategories";
import { PRODUCT_CATEGORY_KEYS } from "../domain/productCategories";
import type { TaskLibraryItem } from "../data/taskLibrary";
import { taskScheduledOnDateKey } from "./dashboardScheduledTasks";
import {
  TASK_LIBRARY,
  getCoreTasksByCategory,
  getDailyTasks,
  getMonthlyTasks,
  getTaskLibraryTitle,
  getTasksByCategory,
} from "../data/taskLibrary";

export const LIB_TASK_ID_PREFIX = "lib:";

export type DashboardLibrarySchedule = {
  /** `lib:…` id → show only on this calendar day (YYYY-MM-DD); cleared after completion. */
  deferredUntilByLibId: Record<string, string>;
  /** Per calendar slot: library ids the user already “completed” (persisted per user in dashboard UI storage). */
  consumedLibIdsByDaySlot: Record<string, Record<string, true>>;
};

export function isLibraryDashboardTaskId(taskId: string): boolean {
  return taskId.startsWith(LIB_TASK_ID_PREFIX);
}

/**
 * Snapshot of a library suggestion marked complete (session `consumedLibIdsByDaySlot`) for progress charts.
 * Returns null if the id is not `lib:…` or the library row is missing/inactive.
 */
export function libraryCompletedTaskSnapshot(fullId: string, language: string): Task | null {
  if (!isLibraryDashboardTaskId(fullId)) return null;
  const itemId = fullId.slice(LIB_TASK_ID_PREFIX.length);
  const item = TASK_LIBRARY.find((t) => t.id === itemId && t.active);
  if (!item) return null;
  const bucket: "daily" | "monthly" = item.frequency === "monthly" ? "monthly" : "daily";
  const syn = taskLibraryItemToSyntheticTask(item, bucket, language, 0);
  return { ...syn, completed: true };
}

export function normalizeTaskTitleKey(title: string): string {
  return title.normalize("NFC").trim().toLowerCase();
}

/**
 * Map product category → dashboard `Task.room` slug so `inferProductCategoryFromDashboardTaskRoomSlug`
 * resolves back to the same category for labels.
 */
const CATEGORY_TO_DASHBOARD_ROOM_SLUG: Record<ProductCategoryKey, string> = {
  kitchen: "kitchen",
  clothes: "closet",
  shoes: "shoes",
  accessories: "accessories",
  office: "office",
  kids_toys_games: "kids-room",
  kids_craft: "kids-craft",
  bathroom_beauty: "bathroom",
  bedroom: "bedroom",
  emotional: "emotional",
};

export function taskLibraryItemToSyntheticTask(
  item: TaskLibraryItem,
  bucket: "daily" | "monthly",
  language: string,
  timeIndex: number,
): Task {
  const baseMin = 8 * 60 + (timeIndex % 14) * 17;
  const hh = Math.min(23, Math.floor(baseMin / 60));
  const mm = baseMin % 60;
  const scheduledTime = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  return {
    id: `${LIB_TASK_ID_PREFIX}${item.id}`,
    title: getTaskLibraryTitle(item, language),
    room: CATEGORY_TO_DASHBOARD_ROOM_SLUG[item.categoryKey],
    completed: false,
    frequency: bucket === "daily" ? "daily" : "monthly",
    scheduledTime,
  };
}

/**
 * Stable ordering: per category, core daily tasks first (via `getCoreTasksByCategory`),
 * then non-core from `getTasksByCategory`, then any stragglers from `getDailyTasks()`.
 */
export function buildOrderedDailyLibraryItems(): TaskLibraryItem[] {
  const seen = new Set<string>();
  const out: TaskLibraryItem[] = [];

  for (const cat of PRODUCT_CATEGORY_KEYS) {
    for (const t of getCoreTasksByCategory(cat).filter((x) => x.frequency === "daily")) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
    }
  }
  for (const cat of PRODUCT_CATEGORY_KEYS) {
    for (const t of getTasksByCategory(cat).filter((x) => x.frequency === "daily" && !x.isCore)) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
    }
  }
  for (const t of getDailyTasks()) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

/** Same pattern for monthly: core → non-core per category → `getMonthlyTasks()` tail. */
export function buildOrderedMonthlyLibraryItems(): TaskLibraryItem[] {
  const seen = new Set<string>();
  const out: TaskLibraryItem[] = [];

  for (const cat of PRODUCT_CATEGORY_KEYS) {
    for (const t of getCoreTasksByCategory(cat).filter((x) => x.frequency === "monthly")) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
    }
  }
  for (const cat of PRODUCT_CATEGORY_KEYS) {
    for (const t of getTasksByCategory(cat).filter((x) => x.frequency === "monthly" && !x.isCore)) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
    }
  }
  for (const t of getMonthlyTasks()) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    out.push(t);
  }
  return out;
}

function hashDaySlotKey(daySlotKey: string): number {
  let h = 0;
  for (let i = 0; i < daySlotKey.length; i += 1) {
    h = (h * 31 + daySlotKey.charCodeAt(i)) >>> 0;
  }
  return h;
}

function rotateByDaySlotKey<T>(items: readonly T[], daySlotKey: string): T[] {
  if (items.length === 0) return [];
  const k = hashDaySlotKey(daySlotKey) % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}

/**
 * If `realEligibleSorted.length >= bucketCap`, returns it unchanged (no library suggestions).
 * Otherwise appends rotated library-derived synthetic tasks (session filters apply).
 */
export function appendLibraryRefillToEligible(
  realEligibleSorted: Task[],
  opts: {
    bucket: "daily" | "monthly";
    /** Selected cell in week strip (0=Sun … 6=Sat); required so monthly synthetics match that calendar day. */
    dayIndex: number;
    weekStartSunday: Date;
    daySlotKey: string;
    language: string;
    bucketCap: number;
    schedule: DashboardLibrarySchedule;
  },
): Task[] {
  if (realEligibleSorted.length >= opts.bucketCap) {
    return realEligibleSorted;
  }

  const ordered =
    opts.bucket === "daily" ? buildOrderedDailyLibraryItems() : buildOrderedMonthlyLibraryItems();

  const existingTitles = new Set(realEligibleSorted.map((t) => normalizeTaskTitleKey(t.title)));

  const consumed = opts.schedule.consumedLibIdsByDaySlot[opts.daySlotKey] ?? {};

  const filtered = ordered.filter((item) => {
    const title = normalizeTaskTitleKey(getTaskLibraryTitle(item, opts.language));
    if (existingTitles.has(title)) return false;

    const fullId = `${LIB_TASK_ID_PREFIX}${item.id}`;
    if (consumed[fullId]) return false;

    const def = opts.schedule.deferredUntilByLibId[fullId];
    if (def != null && def !== opts.daySlotKey) return false;
    return true;
  });

  const rotated = rotateByDaySlotKey(filtered, opts.daySlotKey);
  const poolSize = Math.max(opts.bucketCap * 8, 32);
  /**
   * Monthly library items must match `taskScheduledOnWeekday` for the selected cell (day-of-month anchor).
   * Without this, reconcile picks ids that `resolveVisibleBucket` then drops → empty monthly column.
   */
  const synthetics: Task[] = [];
  for (let i = 0; i < rotated.length && synthetics.length < poolSize; i += 1) {
    const item = rotated[i];
    const syn = taskLibraryItemToSyntheticTask(item, opts.bucket, opts.language, synthetics.length);
    if (opts.bucket === "monthly" && !taskScheduledOnDateKey(syn, opts.daySlotKey)) {
      continue;
    }
    synthetics.push(syn);
  }

  return [...realEligibleSorted, ...synthetics];
}
