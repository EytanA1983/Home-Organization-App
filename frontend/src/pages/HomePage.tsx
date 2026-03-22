import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DailyTasksPopup } from "../components/DailyTasksPopup";
import { WeeklyTasksWidget } from "../components/WeeklyTasksWidget";
import DashboardCategoryProgress from "../components/DashboardCategoryProgress";
import { useRooms } from "../hooks/useRooms";
import { useAuth } from "../hooks/useAuth";
import { useTasks } from "../hooks/useTasks";
import { RoomCard } from "../components/RoomCard";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../utils/routes";
import { useTranslation } from "react-i18next";
import { isRtlLang } from "../utils/localeDirection";
import { getProgressSummary } from "../api";
import type { ProgressSummaryRead } from "../schemas/progress";
import type { TaskRead } from "../schemas/task";
import { readDashboardDemoTasksFromStorage } from "../utils/dashboardLocalTasksStorage";

export const HomePage = () => {
  const { t, i18n } = useTranslation("home");
  const { t: tCommon } = useTranslation("common");
  const location = useLocation();
  const dirAttr = isRtlLang(i18n.language) ? "rtl" : "ltr";
  const { data: rooms = [], isLoading: loading } = useRooms();
  const { user, isLoading: authLoading } = useAuth();

  const userId = useMemo(() => {
    const id = user?.id;
    if (typeof id === "number" && Number.isFinite(id)) return id;
    if (typeof id === "string") {
      const n = Number.parseInt(id, 10);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }, [user?.id]);

  const { data: progressSummary, isLoading: progressLoading, isError: progressError } = useQuery<ProgressSummaryRead>({
    queryKey: ["progress", "summary", "week", userId],
    queryFn: async () => (await getProgressSummary("week")).data,
    enabled: userId != null,
    staleTime: 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const { data: rawTasks } = useTasks(undefined, {
    enabled: userId != null,
    refetchOnMount: "always",
  });
  const taskReadsForChart = useMemo(
    () => (Array.isArray(rawTasks) ? (rawTasks as TaskRead[]) : []),
    [rawTasks],
  );

  /** Same persisted list as Dashboard — pie when API has no category_progress / no /tasks rows. */
  const localDemoTasksForChart = useMemo(
    () => readDashboardDemoTasksFromStorage(userId),
    [userId, location.pathname],
  );

  const completedThisWeek =
    progressLoading ? null : progressError ? 0 : (progressSummary?.completed_tasks_this_week ?? 0);
  const streakDays = progressLoading ? null : progressError ? 0 : (progressSummary?.streak_days ?? 0);
  const areasActive =
    progressLoading ? null : progressError ? 0 : (progressSummary?.rooms_progressed_this_week ?? 0);

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 safe-bottom" dir={dirAttr}>
      <DailyTasksPopup />

      <section className="px-4 py-8 sm:px-6 sm:py-10 max-w-7xl mx-auto">
        <div className="mb-8 sm:mb-10 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
            {t("title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl">
            {t("subtitle")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={ROUTES.ADD_TASK}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {t("newTask")}
            </Link>
            <Link
              to={ROUTES.MY_VISION_BOARD}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t("calendar")}
            </Link>
          </div>
        </div>

        {!authLoading && userId != null ? (
          <div className="mb-8 sm:mb-10 max-w-7xl mx-auto px-4 sm:px-6">
            <DashboardCategoryProgress
              progressLoading={progressLoading}
              progressError={progressError}
              completedThisWeek={completedThisWeek}
              streakDays={streakDays}
              areasActive={areasActive}
              categoryProgressApi={progressSummary?.category_progress}
              localTasks={localDemoTasksForChart}
              taskReads={taskReadsForChart}
            />
            <p className="text-center mt-3 text-sm text-gray-500 dark:text-gray-400">
              <Link to={ROUTES.DASHBOARD} className="text-blue-600 dark:text-sky-400 hover:underline font-medium">
                {t("openFullDashboard")}
              </Link>
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <WeeklyTasksWidget />
          </div>

          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{t("myRooms")}</h2>
              <Link
                to={ROUTES.CATEGORIES}
                className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium touch-target px-3 py-2"
              >
                {t("allRooms")}
              </Link>
            </div>

            {loading ? (
              <p className="text-center py-10 text-sm sm:text-base text-gray-500">{tCommon("loading")}</p>
            ) : rooms?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {rooms.slice(0, 4).map((room) => (
                  <RoomCard key={room.id} roomId={room.id} name={room.name} />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-10 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t("noRooms")}
                </p>
                <Link
                  to={ROUTES.CATEGORIES}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {t("createRoom")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};
