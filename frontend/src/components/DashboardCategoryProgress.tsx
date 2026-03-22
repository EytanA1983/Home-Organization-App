import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { CategoryProgressItem } from "../schemas/progress";
import type { Task } from "../app/types";
import type { TaskRead } from "../schemas/task";
import {
  inferProductCategoryFromDashboardTaskRoomSlug,
  inferProductCategoryFromRoomName,
  isProductCategoryKey,
} from "../domain/productCategories";
import { ROUTES } from "../utils/routes";
import "../styles/dashboard-category-progress.css";

const PIE_SLICE_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#64748b",
];

const CX = 100;
const CY = 100;
const R_OUTER = 88;
const R_INNER = 54;

function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

/** Donut segment from angle a0 → a1 (radians), start at -π/2 like the prior pie. */
function donutSlicePath(cx: number, cy: number, rInner: number, rOuter: number, a0: number, a1: number): string {
  if (a1 <= a0 + 1e-6) return "";
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  const [xOs, yOs] = polar(cx, cy, rOuter, a0);
  const [xOe, yOe] = polar(cx, cy, rOuter, a1);
  const [xIe, yIe] = polar(cx, cy, rInner, a1);
  const [xIs, yIs] = polar(cx, cy, rInner, a0);
  return [
    `M ${xOs} ${yOs}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${xOe} ${yOe}`,
    `L ${xIe} ${yIe}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${xIs} ${yIs}`,
    "Z",
  ].join(" ");
}

/** Build category buckets from API task rows (room/category names), when `category_progress` is empty. */
function categoryProgressFromTaskReads(tasks: TaskRead[]): CategoryProgressItem[] {
  const map = new Map<string, { total: number; completed: number }>();
  for (const t of tasks) {
    const fromRoom = inferProductCategoryFromRoomName((t.room?.name ?? "").trim());
    const fromCat = inferProductCategoryFromRoomName((t.category?.name ?? "").trim());
    const cat = (fromRoom ?? fromCat ?? "other") as string;
    const cur = map.get(cat) ?? { total: 0, completed: 0 };
    cur.total += 1;
    if (t.completed) cur.completed += 1;
    map.set(cat, cur);
  }
  return Array.from(map.entries())
    .map(([category, v]) => ({
      category,
      completed: v.completed,
      total: v.total,
      percent: v.total ? Math.round((100 * v.completed) / v.total) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

function categoryProgressFromLocalTasks(tasks: Task[]): CategoryProgressItem[] {
  const map = new Map<string, { total: number; completed: number }>();
  for (const t of tasks) {
    const slug = typeof t.room === "string" ? t.room : "";
    const cat = inferProductCategoryFromDashboardTaskRoomSlug(slug) ?? "other";
    const cur = map.get(cat) ?? { total: 0, completed: 0 };
    cur.total += 1;
    if (t.completed) cur.completed += 1;
    map.set(cat, cur);
  }
  return Array.from(map.entries())
    .map(([category, v]) => ({
      category,
      completed: v.completed,
      total: v.total,
      percent: v.total ? Math.round((100 * v.completed) / v.total) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export type DashboardCategoryProgressProps = {
  progressLoading: boolean;
  progressError: boolean;
  completedThisWeek: number | null;
  streakDays: number | null;
  areasActive: number | null;
  categoryProgressApi?: CategoryProgressItem[] | undefined;
  localTasks: Task[];
  /** When API `category_progress` is empty, derive slices from `/tasks` rows (e.g. on Home). */
  taskReads?: TaskRead[] | undefined;
};

type SliceRow = {
  item: CategoryProgressItem;
  a0: number;
  a1: number;
  color: string;
  /** true when angles use workload mix (all category percents were 0). */
  mixFallback: boolean;
};

export default function DashboardCategoryProgress({
  progressLoading,
  progressError,
  completedThisWeek,
  streakDays,
  areasActive,
  categoryProgressApi,
  localTasks,
  taskReads,
}: DashboardCategoryProgressProps) {
  const { t: td } = useTranslation("dashboard");
  const { t: tPc } = useTranslation("productCategories");
  const navigate = useNavigate();

  /**
   * Chart + legend must reflect the live task dataset (including completed rows).
   * Previously API `category_progress` won first and stayed stale until refetch — e.g. Dashboard
   * updates `tasks` optimistically but the donut still read cached server slices.
   *
   * Priority: fresh task rows → local dashboard copy → API fallback (empty tasks / legacy).
   */
  const items = useMemo(() => {
    // Prefer local dashboard tasks first so optimistic checkmarks + library completions
    // stay in sync with the donut. Fall back to `/tasks` rows, then API summary slices.
    if (localTasks.length > 0) {
      return categoryProgressFromLocalTasks(localTasks);
    }
    if (taskReads && taskReads.length > 0) {
      return categoryProgressFromTaskReads(taskReads);
    }
    const api = categoryProgressApi;
    if (api && api.length > 0) return api;
    return [];
  }, [categoryProgressApi, localTasks, taskReads]);

  const totalTasksAll = useMemo(() => items.reduce((s, i) => s + i.total, 0), [items]);
  const completedAll = useMemo(() => items.reduce((s, i) => s + i.completed, 0), [items]);

  const overallPercent = useMemo(() => {
    if (totalTasksAll <= 0) return null;
    return Math.min(100, Math.max(0, Math.round((100 * completedAll) / totalTasksAll)));
  }, [completedAll, totalTasksAll]);

  const { slices, mixFallback } = useMemo((): { slices: SliceRow[]; mixFallback: boolean } => {
    if (items.length === 0 || totalTasksAll <= 0) return { slices: [], mixFallback: false };

    const sumPct = items.reduce((s, i) => s + i.percent, 0);
    const useCompletionWeights = sumPct > 0;
    let angle = -Math.PI / 2;
    const out: SliceRow[] = [];

    if (useCompletionWeights) {
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const span = (item.percent / sumPct) * Math.PI * 2;
        const a0 = angle;
        const a1 = angle + span;
        angle = a1;
        out.push({
          item,
          a0,
          a1,
          color: PIE_SLICE_COLORS[idx % PIE_SLICE_COLORS.length],
          mixFallback: false,
        });
      }
      return { slices: out, mixFallback: false };
    }

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const span = (item.total / totalTasksAll) * Math.PI * 2;
      const a0 = angle;
      const a1 = angle + span;
      angle = a1;
      out.push({
        item,
        a0,
        a1,
        color: PIE_SLICE_COLORS[idx % PIE_SLICE_COLORS.length],
        mixFallback: true,
      });
    }
    return { slices: out, mixFallback: true };
  }, [items, totalTasksAll]);

  const labelForCategory = (key: string) => {
    if (key === "other") return tPc("items.other");
    if (isProductCategoryKey(key)) return tPc(`items.${key}`);
    return key;
  };

  const hasChartData = items.length > 0 && totalTasksAll > 0;
  /** Always show the donut: use a neutral placeholder ring when there is no task data yet. */
  const showPlaceholderDonut = !progressLoading && !hasChartData;
  const showLowCompletion =
    !progressLoading && !progressError && hasChartData && completedAll === 0 && totalTasksAll > 0;
  /** Initial / server wait: no category rows yet — single skeleton inside the same card. */
  const showBootLoading = progressLoading && !hasChartData;

  return (
    <section
      className="dashboard-category-progress dashboard-category-progress--unified lifestyle-card"
      aria-labelledby="dashboard-category-progress-heading"
    >
      <header className="dashboard-category-progress__header">
        <h2 id="dashboard-category-progress-heading" className="dashboard-category-progress__title">
          {td("progressUnifiedTitle")}
        </h2>
      </header>

      <div className="dashboard-category-progress__summary-row" aria-label={td("progressSummaryAria")}>
        {progressLoading ? (
          <span className="dashboard-category-progress__summary-loading">{td("progressSummaryLoadingInline")}</span>
        ) : (
          <>
            <span className="dashboard-category-progress__summary-item">
              <span className="dashboard-category-progress__summary-value">{completedThisWeek ?? "—"}</span>
              <span className="dashboard-category-progress__summary-label">{td("progressSummaryWeekShort")}</span>
            </span>
            <span className="dashboard-category-progress__summary-sep" aria-hidden>
              ·
            </span>
            <span className="dashboard-category-progress__summary-item">
              <span className="dashboard-category-progress__summary-value">
                {streakDays != null ? streakDays : "—"}
              </span>
              <span className="dashboard-category-progress__summary-label">{td("progressSummaryStreakShort")}</span>
            </span>
            <span className="dashboard-category-progress__summary-sep" aria-hidden>
              ·
            </span>
            <span className="dashboard-category-progress__summary-item">
              <span className="dashboard-category-progress__summary-value">{areasActive ?? "—"}</span>
              <span className="dashboard-category-progress__summary-label">
                {td("progressSummaryCategoriesShort")}
              </span>
            </span>
          </>
        )}
      </div>

      <div className="dashboard-category-progress__panel">
        {progressError ? (
          <p className="dashboard-category-progress__panel-message dashboard-category-progress__panel-message--alert" role="alert">
            {hasChartData ? td("progressLoadErrorWithChart") : td("progressLoadError")}
          </p>
        ) : null}

        {showBootLoading ? (
          <div className="dashboard-category-progress__skeleton" aria-busy="true">
            <div className="dashboard-category-progress__skeleton-ring" />
            <p className="dashboard-category-progress__panel-message">{td("loading")}</p>
          </div>
        ) : null}

        {!showBootLoading && showPlaceholderDonut ? (
          <div className="dashboard-category-progress__placeholder-wrap">
            <p className="dashboard-category-progress__placeholder-copy">{td("progressDonutAlwaysHint")}</p>
            <div className="dashboard-category-progress__chart-row dashboard-category-progress__chart-row--placeholder">
              <div className="dashboard-category-progress__chart-wrap">
                <svg
                  viewBox="0 0 200 200"
                  width={220}
                  height={220}
                  className="dashboard-category-progress__svg dashboard-category-progress__svg--donut"
                  role="img"
                  aria-label={td("progressDonutPlaceholderAria")}
                >
                  <path
                    d={donutSlicePath(CX, CY, R_INNER, R_OUTER, -Math.PI / 2, (3 * Math.PI) / 2)}
                    fill="rgba(148, 163, 184, 0.35)"
                    stroke="rgba(255,255,255,0.88)"
                    strokeWidth={1.25}
                    strokeLinejoin="round"
                  />
                  <g className="dashboard-category-progress__donut-center-group" pointerEvents="none">
                    <text
                      x={CX}
                      y={CY - 4}
                      textAnchor="middle"
                      className="dashboard-category-progress__donut-center-pct"
                    >
                      0%
                    </text>
                    <text
                      x={CX}
                      y={CY + 16}
                      textAnchor="middle"
                      className="dashboard-category-progress__donut-center-sub"
                    >
                      {td("progressCenterSub")}
                    </text>
                  </g>
                </svg>
              </div>
              <div className="dashboard-category-progress__placeholder-side">
                <p className="dashboard-category-progress__empty-title">{td("progressEmptyTitle")}</p>
                <p className="dashboard-category-progress__empty-body">{td("progressEmptyBody")}</p>
                <button type="button" className="wow-btn wow-btnPrimary" onClick={() => navigate(ROUTES.ADD_TASK)}>
                  {td("addDailyMonthlyTaskCta")}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {!showBootLoading && hasChartData ? (
          <div className="dashboard-category-progress__body">
            {showLowCompletion ? (
              <p className="dashboard-category-progress__low-hint">{td("progressLowDataHint")}</p>
            ) : null}
            {mixFallback && !showLowCompletion ? (
              <p className="dashboard-category-progress__low-hint">{td("progressMixFallbackHint")}</p>
            ) : null}

            <div className="dashboard-category-progress__chart-row">
              <div className="dashboard-category-progress__chart-wrap">
                <svg
                  viewBox="0 0 200 200"
                  width={220}
                  height={220}
                  className="dashboard-category-progress__svg dashboard-category-progress__svg--donut"
                  role="img"
                  aria-label={td("progressDonutAria")}
                >
                  {slices.map(({ item, a0, a1, color }, i) => (
                    <path
                      key={`${item.category}-${i}`}
                      d={donutSlicePath(CX, CY, R_INNER, R_OUTER, a0, a1)}
                      fill={color}
                      stroke="rgba(255,255,255,0.88)"
                      strokeWidth={1.25}
                      strokeLinejoin="round"
                    />
                  ))}
                  <g className="dashboard-category-progress__donut-center-group" pointerEvents="none">
                    {overallPercent != null ? (
                      <>
                        <text
                          x={CX}
                          y={CY - 4}
                          textAnchor="middle"
                          className="dashboard-category-progress__donut-center-pct"
                        >
                          {overallPercent}%
                        </text>
                        <text
                          x={CX}
                          y={CY + 16}
                          textAnchor="middle"
                          className="dashboard-category-progress__donut-center-sub"
                        >
                          {td("progressCenterSub")}
                        </text>
                      </>
                    ) : (
                      <text
                        x={CX}
                        y={CY}
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="dashboard-category-progress__donut-center-pct"
                      >
                        —
                      </text>
                    )}
                  </g>
                </svg>
              </div>

              <ul className="dashboard-category-progress__legend">
                {items.map((row, idx) => (
                  <li key={row.category} className="dashboard-category-progress__legend-item">
                    <span
                      className="dashboard-category-progress__swatch"
                      style={{ background: PIE_SLICE_COLORS[idx % PIE_SLICE_COLORS.length] }}
                      aria-hidden
                    />
                    <div className="dashboard-category-progress__legend-text">
                      <div className="dashboard-category-progress__legend-top">
                        <span className="dashboard-category-progress__legend-name">{labelForCategory(row.category)}</span>
                        <span className="dashboard-category-progress__legend-percent">{row.percent}%</span>
                      </div>
                      <span className="dashboard-category-progress__legend-meta">
                        {td("progressLegendCounts", {
                          completed: row.completed,
                          total: row.total,
                        })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
