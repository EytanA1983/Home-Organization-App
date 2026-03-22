/**
 * Per-user persisted dashboard UI: selected calendar day + library refill schedule
 * (deferrals + per-slot completions). Scoped by user id — never share across accounts.
 */
import type { DashboardLibrarySchedule } from "./dashboardTaskLibraryRefill";
import { addDaysLocal, formatLocalDateKey } from "./dashboardWeekFormat";

export const DASHBOARD_UI_STORAGE_VERSION = 1 as const;

export type PersistedDashboardUiV1 = {
  v: typeof DASHBOARD_UI_STORAGE_VERSION;
  /** Local calendar date YYYY-MM-DD of the week-strip cell the user last selected */
  selectedDateKey: string;
  libSchedule: DashboardLibrarySchedule;
};

const storageKey = (userId: number) => `dashboard_ui_${userId}`;

/** Sunday 00:00 local for the week that contains `d`. */
export function weekStartSundayContaining(d: Date = new Date()): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  n.setDate(n.getDate() - n.getDay());
  return n;
}

/** Whether `dateKey` is one of the seven visible Sun→Sat cells. */
export function isDateKeyInWeekKeys(dateKey: string, weekDateKeys: readonly string[]): boolean {
  return weekDateKeys.includes(dateKey);
}

/** 0 = Sunday … 6 = Saturday for `dateKey` within that week, or null if outside. */
export function dayIndexInWeekKeys(dateKey: string, weekDateKeys: readonly string[]): number | null {
  const idx = weekDateKeys.indexOf(dateKey);
  return idx >= 0 ? idx : null;
}

function sanitizeLibSchedule(raw: unknown): DashboardLibrarySchedule {
  const empty: DashboardLibrarySchedule = { deferredUntilByLibId: {}, consumedLibIdsByDaySlot: {} };
  if (!raw || typeof raw !== "object") return empty;
  const obj = raw as Record<string, unknown>;
  const deferredIn = obj.deferredUntilByLibId;
  const consumedIn = obj.consumedLibIdsByDaySlot;

  const deferredUntilByLibId: Record<string, string> = {};
  if (deferredIn && typeof deferredIn === "object") {
    for (const [libId, val] of Object.entries(deferredIn as Record<string, unknown>)) {
      if (typeof libId !== "string" || !libId.startsWith("lib:")) continue;
      if (typeof val !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(val)) continue;
      deferredUntilByLibId[libId] = val;
    }
  }

  const consumedLibIdsByDaySlot: Record<string, Record<string, true>> = {};
  if (consumedIn && typeof consumedIn === "object") {
    for (const [slotKey, mapVal] of Object.entries(consumedIn as Record<string, unknown>)) {
      if (typeof slotKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(slotKey)) continue;
      if (!mapVal || typeof mapVal !== "object") continue;
      const inner: Record<string, true> = {};
      for (const libId of Object.keys(mapVal as Record<string, unknown>)) {
        if (typeof libId === "string" && libId.startsWith("lib:")) inner[libId] = true;
      }
      if (Object.keys(inner).length > 0) consumedLibIdsByDaySlot[slotKey] = inner;
    }
  }

  return { deferredUntilByLibId, consumedLibIdsByDaySlot };
}

/**
 * Drop expired deferrals (target date before today) and very old consumed slots to limit storage.
 */
export function pruneDashboardLibSchedule(schedule: DashboardLibrarySchedule): DashboardLibrarySchedule {
  const todayKey = formatLocalDateKey(new Date());
  const deferredUntilByLibId: Record<string, string> = {};
  for (const [libId, defKey] of Object.entries(schedule.deferredUntilByLibId)) {
    if (defKey >= todayKey) deferredUntilByLibId[libId] = defKey;
  }

  const consumedLibIdsByDaySlot: Record<string, Record<string, true>> = {};
  const cutoff = addDaysLocal(new Date(), -56);
  cutoff.setHours(0, 0, 0, 0);
  const cutoffKey = formatLocalDateKey(cutoff);
  for (const [slotKey, map] of Object.entries(schedule.consumedLibIdsByDaySlot)) {
    if (slotKey >= cutoffKey) consumedLibIdsByDaySlot[slotKey] = { ...map };
  }

  return { deferredUntilByLibId, consumedLibIdsByDaySlot };
}

/**
 * Load persisted UI for `userId`. Restores `selectedDateKey` only if it lies in the visible week;
 * otherwise falls back to `fallbackDayIndex` (e.g. Google calendar “today” index or local getDay()).
 */
export function loadDashboardUiState(
  userId: number,
  weekDateKeys: readonly string[],
  fallbackDayIndex: number,
): { selectedDayIndex: number; libSchedule: DashboardLibrarySchedule } {
  const safeFallback = Math.min(6, Math.max(0, Math.floor(fallbackDayIndex)));
  const emptySchedule = pruneDashboardLibSchedule({ deferredUntilByLibId: {}, consumedLibIdsByDaySlot: {} });

  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) {
      return { selectedDayIndex: safeFallback, libSchedule: emptySchedule };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedDashboardUiV1>;

    let selectedDayIndex = safeFallback;
    if (
      typeof parsed.selectedDateKey === "string" &&
      isDateKeyInWeekKeys(parsed.selectedDateKey, weekDateKeys)
    ) {
      const idx = dayIndexInWeekKeys(parsed.selectedDateKey, weekDateKeys);
      if (idx != null) selectedDayIndex = idx;
    }

    const libSchedule = pruneDashboardLibSchedule(sanitizeLibSchedule(parsed.libSchedule));

    return { selectedDayIndex, libSchedule };
  } catch {
    return { selectedDayIndex: safeFallback, libSchedule: emptySchedule };
  }
}

export function saveDashboardUiState(userId: number, payload: PersistedDashboardUiV1): void {
  try {
    const toStore: PersistedDashboardUiV1 = {
      v: DASHBOARD_UI_STORAGE_VERSION,
      selectedDateKey: payload.selectedDateKey,
      libSchedule: pruneDashboardLibSchedule(sanitizeLibSchedule(payload.libSchedule)),
    };
    localStorage.setItem(storageKey(userId), JSON.stringify(toStore));
  } catch {
    /* quota / private mode */
  }
}
