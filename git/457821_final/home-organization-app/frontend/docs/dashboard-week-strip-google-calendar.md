# Dashboard week strip & future Google Calendar

## Current behavior

- The strip shows **the current calendar week** (Sunday–Saturday, local time), with **real dates** and **pending task counts** derived from in-app `Task` data (`dashboardScheduledTasks`).
- **Selected day** drives `filterPendingTasksForSelectedDay` on the dashboard only.
- This is **not** wired to Google Calendar events.

## Future Google Calendar integration (suggested)

1. **Data layer**  
   - Add a small hook or query module, e.g. `useCalendarWeekSummary({ weekStart, timeZone })`, that returns `Map<dateKey, { eventCount, busyBlocks }>` without replacing task state.

2. **UI layer**  
   - Extend `DashboardWeekBar` props with optional `externalDayMeta?: Record<number, { gcalEvents?: number }>` or keyed by `YYYY-MM-DD` for the seven cells.  
   - Render a second optional badge (e.g. dot or count) so GCal and app-task counts stay visually distinct.

3. **Selection**  
   - Keep **one selected index** (0–6) or migrate to `selectedDate: Date` if multi-week navigation is added later.

4. **Do not** make GCal the primary task source until product/backend agree; keep app tasks as the default list.

## Related files

- `frontend/src/components/DashboardWeekBar.tsx`
- `frontend/src/utils/dashboardScheduledTasks.ts`
- `frontend/src/pages/Dashboard.tsx`
