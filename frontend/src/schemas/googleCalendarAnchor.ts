/** Matches backend `DashboardCalendarAnchor` (google_calendar.py). */
export type GoogleDashboardCalendarAnchor = {
  connected: boolean;
  time_zone?: string | null;
  today?: string | null;
  week_start?: string | null;
  today_day_index?: number | null;
  week_dates?: string[] | null;
};
