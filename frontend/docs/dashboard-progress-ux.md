# Dashboard — unified category progress (UX & implementation)

This document mirrors the product/technical summary for the single **“Your progress” / ההתקדמות שלך** card.

## 1. UX refactor summary

- **One card** — `DashboardCategoryProgress` with title `progressUnifiedTitle` and a calm subtitle.
- **Compact summary row** — completed this week · streak · categories in motion, one line with separators (not three large stat tiles).
- **Donut** — one slice per category; slice angles follow **completion %** (normalized around the circle) when there is at least some completion; otherwise **workload mix** by task counts + `progressMixFallbackHint`.
- **Donut center** — overall **total %** (completed / all tasks across categories).
- **Legend** — localized category name from `productCategories`, bold **%**, and `progressLegendCounts` (X / Y tasks).
- **Empty / loading** — same panel: soft ring + copy + CTA, or a single skeleton (no scattered empty blocks).
- **Before/after** — **outside** the progress card: separate section after the video row; `beforeAfterSectionSub` clarifies it is not part of the unified progress card.
- **No** main “last 7 days” visualization on the dashboard (legacy i18n keys may still exist in JSON).

## 2. Files involved

| File | Role |
|------|------|
| `src/components/DashboardCategoryProgress.tsx` | Items, donut, legend, summary, empty/loading |
| `src/styles/dashboard-category-progress.css` | Unified card layout, summary row, donut, legend, empty |
| `src/i18n/locales/he.json` | `progressUnified*`, short summary, donut ARIA, center, mix hint, legend |
| `src/i18n/locales/en.json` | Same in English |
| `src/pages/Dashboard.tsx` | Renders `<DashboardCategoryProgress />`; order: day tasks → week bar → **progress** → YouTube → before/after |

No changes required to auth, routing, or daily task / defer / refill flows for this feature.

## 3. Category progress calculation

1. **API** — If `progressSummary.category_progress` exists and is non-empty, use it (`category`, `completed`, `total`, `percent`).
2. **`taskReads`** (when passed in) — Aggregate with `inferProductCategoryFromRoomName` on server `room` / `category` names.
3. **`localTasks` (demo)** — `task.room` is a **slug**; map with `inferProductCategoryFromDashboardTaskRoomSlug` only (canonical domain bridge, not separate “rooms” product logic).

Per category: `percent = round(100 * completed / total)`.

## 4. Removed / relocated legacy progress UI

- Removed: three large KPI tiles + full pie without hole + visually scattered layout.
- No main “7 days” chart strip on the dashboard.
- Before/after: not inside the progress card; remains a **separate** section below the video recommendation.

## 5. Runtime behavior

- Loading / errors appear **inside** the same card.
- No category data: unified empty state + add-task CTA.
- With data: low-data hint when nothing completed yet + donut + legend.
- Top summary uses API fields: `completed_tasks_this_week`, `streak_days`, `rooms_progressed_this_week` (server name unchanged); UI label reflects “categories in motion” via i18n.

## 6. Phase 2 ideas

- API naming: alias or parallel field for `rooms_progressed_this_week` → category-oriented name.
- i18n: add `progressUnified*` to `ru` / `fr` / `ar` bundles if needed.
- Legend row click → navigate to `/categories/:key`.
- Subtle slice transitions when `tasks` / `category_progress` updates.

**Backend:** `GET /progress/summary` already returns `category_progress` in the expected shape.

**Check:** `npx tsc --noEmit` in `frontend` should pass.
