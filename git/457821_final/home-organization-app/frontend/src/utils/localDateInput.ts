/**
 * Values for `<input type="date" min/max>` — always use **local** calendar YYYY-MM-DD,
 * not `toISOString().slice(0, 10)` (UTC can shift the day).
 */
export function toLocalDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date in local timezone as YYYY-MM-DD. */
export function todayLocalDateInputValue(): string {
  return toLocalDateInputValue(new Date());
}

/** True if `yyyyMmDd` (from date input) is strictly before today (local). */
export function isDateInputBeforeToday(yyyyMmDd: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return false;
  return yyyyMmDd < todayLocalDateInputValue();
}
