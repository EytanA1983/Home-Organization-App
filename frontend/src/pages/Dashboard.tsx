import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isRtlLang, pickBilingual } from "../utils/localeDirection";
import {
  addDaysLocal,
  addDaysToDateKey,
  buildLocalSundayWeekDateKeys,
  formatDashboardLongDate,
  formatDashboardLongDateFromYmd,
  formatDashboardWeekdayShort,
  formatDashboardWeekdayShortFromYmd,
  formatLocalDateKey,
  parseDateKeyLocal,
} from "../utils/dashboardWeekFormat";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardCategoryProgress from "../components/DashboardCategoryProgress";
import DashboardWeekBar from "../components/DashboardWeekBar";
import DashboardDailyTaskCard from "../components/DashboardDailyTaskCard";
import { Modal } from "../components/Modal";
import { stripExpiredTaskDeferrals, taskScheduledOnDateKey } from "../utils/dashboardScheduledTasks";
import {
  DASHBOARD_DAILY_BUCKET_CAP,
  DASHBOARD_MONTHLY_BUCKET_CAP,
  reconcileVisibleTaskIds,
  sortEligiblePendingForDayBucketsForDateKey,
} from "../utils/dashboardRolling";
import {
  appendLibraryRefillToEligible,
  isLibraryDashboardTaskId,
  libraryCompletedTaskSnapshot,
  type DashboardLibrarySchedule,
} from "../utils/dashboardTaskLibraryRefill";
import {
  DASHBOARD_UI_STORAGE_VERSION,
  loadDashboardUiState,
  saveDashboardUiState,
} from "../utils/dashboardUiPersistence";
import { getDashboardTaskCategoryLabel } from "../utils/dashboardTaskCategoryLabel";
import "../styles/dashboard-daily.css";
import { Task } from "../app/types";
import api, { fetchMe } from '../api.ts';
import {
  DASHBOARD_QUERY_STALE_MS,
  fetchDashboardProgressWeek,
  fetchDashboardTasksFullList,
} from "../api/dashboardBootstrap";
import { clearTokens, hasTokens } from '../utils/tokenStorage';
import { ROUTES } from '../utils/routes';
import { showSuccess } from "../utils/toast";
import { smokeDebug } from "../utils/smokeDebug";
import type { ProgressSummaryRead } from '../schemas/progress';
import type { GoogleDashboardCalendarAnchor } from "../schemas/googleCalendarAnchor";
import type { TaskRead } from "../schemas/task";
import { mapTaskReadToDashboardTask } from "../utils/mapTaskReadToDashboardTask";

/** Featured YouTube clip on the dashboard (card links to watch on YouTube). */
const DASHBOARD_FEATURED_YOUTUBE_VIDEO_ID = "ukfcLL56QYE";

const dashboardPerfDebug = (label: string, startedAt: number) => {
  if (!import.meta.env.DEV) return;
  const ms = Math.round(performance.now() - startedAt);
  console.debug(`[dashboard:perf] ${label} +${ms}ms`);
};

const DEMO_TASK_TITLES: Record<string, { he: string; en: string }> = {
  "1": { he: "שאיבת אבק בסלון", en: "Vacuum the living room" },
  "2": { he: "ניקוי משטחים", en: "Wipe surfaces" },
  "3": { he: "הכנת ארוחת בוקר", en: "Prepare breakfast" },
  "4": { he: "שטיפת כלים", en: "Wash dishes" },
  "5": { he: "ניקוי מקרר", en: "Clean the refrigerator" },
  "6": { he: "כביסה לבנה", en: "White laundry" },
  "7": { he: "קיפול כביסה", en: "Fold laundry" },
  "8": { he: "ניקוי חדר אמבטיה", en: "Clean the bathroom" },
  "9": { he: "החלפת מגבות", en: "Replace towels" },
  "10": { he: "החלפת מצעים", en: "Change bed sheets" },
  "11": { he: "סידור ארון", en: "Organize wardrobe" },
};

const localizeDemoTaskTitles = (inputTasks: Task[], lang: string | undefined): Task[] => {
  return inputTasks.map((task) => {
    const key = String(task.id);
    const labels = DEMO_TASK_TITLES[key];
    if (!labels) return task;

    // Only replace known demo titles to avoid touching user-created tasks.
    const isKnownDemoTitle = task.title === labels.he || task.title === labels.en;
    if (!isKnownDemoTitle) return task;

    return {
      ...task,
      title: pickBilingual(lang, labels),
    };
  });
};

const buildInitialDemoTasks = (lang: string | undefined): Task[] => {
  const initialTasks: Task[] = [
    {
      id: "1",
      title: DEMO_TASK_TITLES["1"].he,
      room: "living-room",
      completed: false,
      frequency: "daily",
      scheduledTime: "09:00",
    },
    {
      id: "2",
      title: DEMO_TASK_TITLES["2"].he,
      room: "living-room",
      completed: false,
      frequency: "daily",
      scheduledTime: "10:00",
    },
    {
      id: "3",
      title: DEMO_TASK_TITLES["3"].he,
      room: "kitchen",
      completed: false,
      frequency: "daily",
      scheduledTime: "08:00",
    },
    {
      id: "4",
      title: DEMO_TASK_TITLES["4"].he,
      room: "kitchen",
      completed: true,
      frequency: "daily",
      scheduledTime: "20:00",
    },
    {
      id: "5",
      title: DEMO_TASK_TITLES["5"].he,
      room: "kitchen",
      completed: false,
      frequency: "weekly",
      scheduledTime: "14:00",
    },
    {
      id: "6",
      title: DEMO_TASK_TITLES["6"].he,
      room: "bathroom",
      completed: false,
      frequency: "weekly",
      scheduledTime: "11:00",
    },
    {
      id: "7",
      title: DEMO_TASK_TITLES["7"].he,
      room: "bathroom",
      completed: false,
      frequency: "weekly",
      scheduledTime: "15:00",
    },
    {
      id: "8",
      title: DEMO_TASK_TITLES["8"].he,
      room: "bathroom",
      completed: false,
      frequency: "weekly",
      scheduledTime: "16:00",
    },
    {
      id: "9",
      title: DEMO_TASK_TITLES["9"].he,
      room: "bathroom",
      completed: false,
      frequency: "weekly",
      scheduledTime: "17:00",
    },
    {
      id: "10",
      title: DEMO_TASK_TITLES["10"].he,
      room: "bedroom",
      completed: false,
      frequency: "weekly",
      scheduledTime: "10:00",
    },
    {
      id: "11",
      title: DEMO_TASK_TITLES["11"].he,
      room: "bedroom",
      completed: false,
      frequency: "weekly",
      scheduledTime: "11:00",
    },
  ];

  return localizeDemoTaskTitles(initialTasks, lang);
};

/** Per-user local demo task list (legacy global key was `tasks`). */
const demoTasksStorageKey = (userId: number) => `dashboard_demo_tasks_${userId}`;

export default function Dashboard() {
  const { t: td, i18n } = useTranslation("dashboard");
  const { t: tRooms } = useTranslation("rooms");
  const { t: tPc } = useTranslation("productCategories");
  const dirAttr = isRtlLang(i18n.language) ? "rtl" : "ltr";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  /** 0 = Sunday … 6 = Saturday — drives which local tasks appear on the dashboard */
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => new Date().getDay());
  /** Task id string currently playing the completion exit animation */
  const [exitingTaskId, setExitingTaskId] = useState<string | null>(null);
  type CelebrationKind = "daily" | "monthly" | "both" | null;
  const [celebrationKind, setCelebrationKind] = useState<CelebrationKind>(null);

  /** Library deferrals + per-day-slot consumed ids (persisted per user; see dashboardUiPersistence). */
  const [libSchedule, setLibSchedule] = useState<DashboardLibrarySchedule>({
    deferredUntilByLibId: {},
    consumedLibIdsByDaySlot: {},
  });

  /** Set after /auth/me — scopes React Query cache + demo tasks localStorage to this user. */
  const sessionUserIdRef = useRef<number | null>(null);
  const [sessionUserId, setSessionUserId] = useState<number | null>(null);
  /** Bumps on same-tab `token-changed` so we reload session + tasks (not only on first mount). */
  const [authVersion, setAuthVersion] = useState(0);
  /** After critical dashboard data is ready, mount lower-priority sections (e.g. YouTube card). */
  const [secondaryDashboardVisible, setSecondaryDashboardVisible] = useState(false);
  /** Avoid re-applying persisted dashboard UI unless user or visible week model changes. */
  const lastDashboardHydrationRef = useRef<{ userId: number; weekSig: string } | null>(null);
  /** Supersede stale async from Strict Mode / rapid re-auth so `loading` always clears. */
  const dashboardHydrationRunIdRef = useRef(0);

  /** Defer non-critical Google Calendar fetch so it does not compete with tasks + progress. */
  const [calendarQueryEnabled, setCalendarQueryEnabled] = useState(false);

  useEffect(() => {
    const onTok = () => setAuthVersion((v) => v + 1);
    window.addEventListener("token-changed", onTok);
    return () => window.removeEventListener("token-changed", onTok);
  }, []);

  const {
    data: progressSummary,
    isLoading: progressLoading,
    isError: progressError,
  } = useQuery<ProgressSummaryRead>({
    queryKey: ["progress", "summary", "week", sessionUserId],
    queryFn: fetchDashboardProgressWeek,
    enabled: sessionUserId != null,
    staleTime: DASHBOARD_QUERY_STALE_MS,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: chartTaskReads } = useQuery<TaskRead[]>({
    queryKey: ["tasks", "chartSlices", sessionUserId],
    queryFn: fetchDashboardTasksFullList,
    enabled: sessionUserId != null,
    staleTime: DASHBOARD_QUERY_STALE_MS,
    refetchOnMount: true,
  });

  const { data: calendarAnchor } = useQuery<GoogleDashboardCalendarAnchor>({
    queryKey: ["google-calendar", "dashboard-anchor", sessionUserId],
    queryFn: async () => {
      const { data } = await api.get<GoogleDashboardCalendarAnchor>("/google-calendar/dashboard-anchor");
      return data;
    },
    enabled: sessionUserId != null && calendarQueryEnabled,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  const calendarDayKey = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  useEffect(() => {
    if (sessionUserId === null) {
      lastDashboardHydrationRef.current = null;
      setCalendarQueryEnabled(false);
      return;
    }
    setCalendarQueryEnabled(false);
    const t = window.setTimeout(() => setCalendarQueryEnabled(true), 200);
    return () => window.clearTimeout(t);
  }, [sessionUserId]);

  useEffect(() => {
    const runId = ++dashboardHydrationRunIdRef.current;
    const perfStart = performance.now();

    const loadUser = async () => {
      setLoading(true);
      sessionUserIdRef.current = null;
      setSessionUserId(null);
      setTasks([]);

      const stillCurrent = () => runId === dashboardHydrationRunIdRef.current;

      try {
        if (!hasTokens()) {
          smokeDebug("dashboard:no_tokens_redirect", {});
          navigate(ROUTES.LOGIN, { replace: true });
          return;
        }

        const meResponse = await fetchMe();
        if (!stillCurrent()) return;
        dashboardPerfDebug("auth/me", perfStart);

        const rawId = meResponse.data?.id;
        const uid =
          typeof rawId === "number"
            ? rawId
            : typeof rawId === "string"
              ? Number.parseInt(rawId, 10)
              : NaN;
        if (!Number.isFinite(uid)) {
          console.error("[Dashboard] /auth/me returned no usable user id");
          clearTokens();
          sessionUserIdRef.current = null;
          setSessionUserId(null);
          navigate(ROUTES.LOGIN, { replace: true });
          return;
        }

        sessionUserIdRef.current = uid;

        const storageKey = demoTasksStorageKey(uid);
        const initialWeekKeys = buildLocalSundayWeekDateKeys();
        const weekStartDateKey = initialWeekKeys[0] ?? formatLocalDateKey(new Date());

        /** Warm React Query cache before enabling user-scoped observers (avoids duplicate in-flight /tasks). */
        try {
          await Promise.all([
            queryClient.fetchQuery({
              queryKey: ["progress", "summary", "week", uid],
              queryFn: fetchDashboardProgressWeek,
              staleTime: DASHBOARD_QUERY_STALE_MS,
            }),
            queryClient.fetchQuery({
              queryKey: ["tasks", "chartSlices", uid],
              queryFn: fetchDashboardTasksFullList,
              staleTime: DASHBOARD_QUERY_STALE_MS,
            }),
          ]);
        } catch (e) {
          console.warn("[Dashboard] Critical dashboard prefetch failed (tasks/progress):", e);
        }
        if (!stillCurrent()) return;
        dashboardPerfDebug("tasks+progress prefetch", perfStart);

        const apiTasks =
          queryClient.getQueryData<TaskRead[]>(["tasks", "chartSlices", uid]) ?? null;

        /** Prefer server tasks whenever GET /tasks succeeds (including empty list). */
        let hydratedFromApi = false;
        if (Array.isArray(apiTasks)) {
          hydratedFromApi = true;
          if (apiTasks.length > 0) {
            const mapped = apiTasks.map(mapTaskReadToDashboardTask);
            const stripped = stripExpiredTaskDeferrals(mapped, weekStartDateKey);
            const localizedTasks = localizeDemoTaskTitles(stripped, i18n.language);
            setTasks(localizedTasks);
            localStorage.setItem(storageKey, JSON.stringify(localizedTasks));
          } else {
            setTasks([]);
            localStorage.setItem(storageKey, JSON.stringify([]));
          }
        }

        if (!stillCurrent()) return;

        if (!hydratedFromApi) {
          let savedTasks = localStorage.getItem(storageKey);
          if (!savedTasks) {
            const legacy = localStorage.getItem("tasks");
            if (legacy) {
              localStorage.setItem(storageKey, legacy);
              localStorage.removeItem("tasks");
              savedTasks = legacy;
            }
          }

          if (savedTasks) {
            try {
              const parsedRaw = JSON.parse(savedTasks) as (Task & { displayWeekdayIndex?: number })[];
              const parsedTasks: Task[] = parsedRaw.map((row) => {
                const { displayWeekdayIndex: _legacy, ...rest } = row;
                return rest;
              });
              const stripped = stripExpiredTaskDeferrals(parsedTasks, weekStartDateKey);
              const localizedTasks = localizeDemoTaskTitles(stripped, i18n.language);
              setTasks(localizedTasks);
              localStorage.setItem(storageKey, JSON.stringify(localizedTasks));
            } catch (e) {
              console.error("[Dashboard] Error parsing saved tasks; restoring default demo list:", e);
              const initialTasks = buildInitialDemoTasks(i18n.language);
              setTasks(initialTasks);
              localStorage.setItem(storageKey, JSON.stringify(initialTasks));
            }
          } else {
            const initialTasks = buildInitialDemoTasks(i18n.language);
            setTasks(initialTasks);
            localStorage.setItem(storageKey, JSON.stringify(initialTasks));
          }
        }

        if (!stillCurrent()) return;
        setSessionUserId(uid);
        dashboardPerfDebug("sessionUserId + local tasks", perfStart);
      } catch (error) {
        console.error("[Dashboard] Error fetching user:", error);
        clearTokens();
        sessionUserIdRef.current = null;
        setSessionUserId(null);
        navigate(ROUTES.LOGIN, { replace: true });
      } finally {
        if (runId === dashboardHydrationRunIdRef.current) {
          setLoading(false);
          dashboardPerfDebug("dashboard bootstrap complete", perfStart);
        }
      }
    };

    void loadUser();
  }, [i18n.language, navigate, authVersion, queryClient]);

  useEffect(() => {
    if (loading) {
      setSecondaryDashboardVisible(false);
      return;
    }
    const id = window.requestAnimationFrame(() => setSecondaryDashboardVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, [loading]);

  const localWeekDateKeys = useMemo(() => buildLocalSundayWeekDateKeys(new Date()), [calendarDayKey]);

  const weekDateKeys = useMemo((): string[] => {
    const w = calendarAnchor?.week_dates;
    if (calendarAnchor?.connected && Array.isArray(w) && w.length === 7) {
      return [...w];
    }
    return localWeekDateKeys;
  }, [calendarAnchor, localWeekDateKeys]);

  const displayTimeZone =
    calendarAnchor?.connected && calendarAnchor.time_zone ? calendarAnchor.time_zone : undefined;

  const calendarTodayKey = useMemo(() => {
    if (calendarAnchor?.connected && calendarAnchor.today) return calendarAnchor.today;
    return formatLocalDateKey(new Date());
  }, [calendarAnchor]);

  /** Sunday cell as local Date (for legacy helpers); strip labels use `weekDateKeys` when Google is linked. */
  const weekStartSunday = useMemo(() => {
    const d = parseDateKeyLocal(weekDateKeys[0] ?? "");
    if (d) return d;
    const n = new Date();
    n.setHours(0, 0, 0, 0);
    n.setDate(n.getDate() - n.getDay());
    return n;
  }, [weekDateKeys]);

  const daySlotKey =
    weekDateKeys[selectedDayIndex] ?? formatLocalDateKey(addDaysLocal(weekStartSunday, selectedDayIndex));

  useEffect(() => {
    if (sessionUserId == null) return;
    if (weekDateKeys.length !== 7) return;
    const weekSig = weekDateKeys.join("|");
    const prev = lastDashboardHydrationRef.current;
    if (prev && prev.userId === sessionUserId && prev.weekSig === weekSig) return;

    const fallbackDayIndex =
      calendarAnchor?.connected && typeof calendarAnchor.today_day_index === "number"
        ? calendarAnchor.today_day_index
        : new Date().getDay();

    const persisted = loadDashboardUiState(sessionUserId, weekDateKeys, fallbackDayIndex);
    setSelectedDayIndex(persisted.selectedDayIndex);
    setLibSchedule(persisted.libSchedule);
    lastDashboardHydrationRef.current = { userId: sessionUserId, weekSig };
  }, [
    sessionUserId,
    weekDateKeys,
    calendarAnchor?.connected,
    calendarAnchor?.today_day_index,
    calendarAnchor?.week_dates,
  ]);

  useEffect(() => {
    if (sessionUserId == null) return;
    if (loading) return;
    saveDashboardUiState(sessionUserId, {
      v: DASHBOARD_UI_STORAGE_VERSION,
      selectedDateKey: daySlotKey,
      libSchedule,
    });
  }, [sessionUserId, loading, daySlotKey, libSchedule]);

  type DayBucketIds = { daily: string[]; monthly: string[] };

  const { daily: eligibleDailySorted, monthly: eligibleMonthlySorted } = useMemo(
    () => sortEligiblePendingForDayBucketsForDateKey(tasks, daySlotKey),
    [tasks, daySlotKey],
  );

  const dailyEligibleWithRefill = useMemo(
    () =>
      appendLibraryRefillToEligible(eligibleDailySorted, {
        bucket: "daily",
        dayIndex: selectedDayIndex,
        weekStartSunday,
        daySlotKey,
        language: i18n.language,
        bucketCap: DASHBOARD_DAILY_BUCKET_CAP,
        schedule: libSchedule,
      }),
    [eligibleDailySorted, selectedDayIndex, weekStartSunday, daySlotKey, i18n.language, libSchedule],
  );

  const monthlyEligibleWithRefill = useMemo(
    () =>
      appendLibraryRefillToEligible(eligibleMonthlySorted, {
        bucket: "monthly",
        dayIndex: selectedDayIndex,
        weekStartSunday,
        daySlotKey,
        language: i18n.language,
        bucketCap: DASHBOARD_MONTHLY_BUCKET_CAP,
        schedule: libSchedule,
      }),
    [eligibleMonthlySorted, selectedDayIndex, weekStartSunday, daySlotKey, i18n.language, libSchedule],
  );

  const [visibleIdsByDay, setVisibleIdsByDay] = useState<Record<string, DayBucketIds>>({});

  useLayoutEffect(() => {
    setVisibleIdsByDay((prev) => {
      const prevSlot = prev[daySlotKey];
      const nextDaily = reconcileVisibleTaskIds(
        dailyEligibleWithRefill,
        prevSlot?.daily,
        DASHBOARD_DAILY_BUCKET_CAP,
      );
      const nextMonthly = reconcileVisibleTaskIds(
        monthlyEligibleWithRefill,
        prevSlot?.monthly,
        DASHBOARD_MONTHLY_BUCKET_CAP,
      );
      if (
        prevSlot &&
        prevSlot.daily.length === nextDaily.length &&
        prevSlot.monthly.length === nextMonthly.length &&
        prevSlot.daily.every((id, i) => id === nextDaily[i]) &&
        prevSlot.monthly.every((id, i) => id === nextMonthly[i])
      ) {
        return prev;
      }
      return { ...prev, [daySlotKey]: { daily: nextDaily, monthly: nextMonthly } };
    });
  }, [dailyEligibleWithRefill, monthlyEligibleWithRefill, daySlotKey]);

  const visibleIdsForSlot = useMemo((): DayBucketIds => {
    const fromState = visibleIdsByDay[daySlotKey];
    if (fromState) return fromState;
    return {
      daily: reconcileVisibleTaskIds(dailyEligibleWithRefill, undefined, DASHBOARD_DAILY_BUCKET_CAP),
      monthly: reconcileVisibleTaskIds(monthlyEligibleWithRefill, undefined, DASHBOARD_MONTHLY_BUCKET_CAP),
    };
  }, [visibleIdsByDay, daySlotKey, dailyEligibleWithRefill, monthlyEligibleWithRefill]);

  const librarySyntheticTasks = useMemo(() => {
    const m = new Map<string, Task>();
    for (const t of dailyEligibleWithRefill) {
      if (isLibraryDashboardTaskId(String(t.id))) m.set(String(t.id), t);
    }
    for (const t of monthlyEligibleWithRefill) {
      if (isLibraryDashboardTaskId(String(t.id))) m.set(String(t.id), t);
    }
    return [...m.values()];
  }, [dailyEligibleWithRefill, monthlyEligibleWithRefill]);

  /** Real + library suggestions — used to know if “daily/monthly for this day” buckets exist. */
  const mergedTasksForSchedule = useMemo(() => {
    const m = new Map<string, Task>();
    for (const t of tasks) m.set(String(t.id), t);
    for (const t of librarySyntheticTasks) m.set(String(t.id), t);
    return [...m.values()];
  }, [tasks, librarySyntheticTasks]);

  const hasScheduledDailyThisSlot = useMemo(
    () =>
      mergedTasksForSchedule.some(
        (t) =>
          taskScheduledOnDateKey(t, daySlotKey) && (t.frequency === "daily" || t.frequency === "weekly"),
      ),
    [mergedTasksForSchedule, daySlotKey],
  );

  const hasScheduledMonthlyThisSlot = useMemo(
    () =>
      mergedTasksForSchedule.some(
        (t) => taskScheduledOnDateKey(t, daySlotKey) && t.frequency === "monthly",
      ),
    [mergedTasksForSchedule, daySlotKey],
  );

  const dailyBucketComplete =
    hasScheduledDailyThisSlot && dailyEligibleWithRefill.length === 0;
  const monthlyBucketComplete =
    hasScheduledMonthlyThisSlot && monthlyEligibleWithRefill.length === 0;

  const prevDailyCompleteRef = useRef(false);
  const prevMonthlyCompleteRef = useRef(false);

  useEffect(() => {
    prevDailyCompleteRef.current = dailyBucketComplete;
    prevMonthlyCompleteRef.current = monthlyBucketComplete;
  }, [daySlotKey]);

  useEffect(() => {
    const wasD = prevDailyCompleteRef.current;
    const wasM = prevMonthlyCompleteRef.current;
    const nowD = dailyBucketComplete;
    const nowM = monthlyBucketComplete;
    const edgeD = nowD && !wasD;
    const edgeM = nowM && !wasM;
    if (edgeD && edgeM) setCelebrationKind("both");
    else if (edgeD) setCelebrationKind("daily");
    else if (edgeM) setCelebrationKind("monthly");
    prevDailyCompleteRef.current = nowD;
    prevMonthlyCompleteRef.current = nowM;
  }, [dailyBucketComplete, monthlyBucketComplete]);

  const taskById = useMemo(() => {
    const m = new Map(tasks.map((t) => [String(t.id), t]));
    for (const t of librarySyntheticTasks) {
      m.set(String(t.id), t);
    }
    return m;
  }, [tasks, librarySyntheticTasks]);

  /** Real tasks + persisted library completions so the donut matches "המשימות שלי להיום". */
  const tasksForCategoryProgress = useMemo(() => {
    const slotKeys = weekDateKeys.length === 7 ? [...weekDateKeys] : Array.from({ length: 7 }, (_, i) =>
      formatLocalDateKey(addDaysLocal(weekStartSunday, i)),
    );
    const extras: Task[] = [];
    for (const key of slotKeys) {
      const consumed = libSchedule.consumedLibIdsByDaySlot[key];
      if (!consumed) continue;
      for (const libId of Object.keys(consumed)) {
        if (!consumed[libId]) continue;
        const snap = libraryCompletedTaskSnapshot(libId, i18n.language);
        if (snap) extras.push(snap);
      }
    }
    return [...tasks, ...extras];
  }, [tasks, libSchedule, weekDateKeys, weekStartSunday, i18n.language]);

  const resolveVisibleBucket = useCallback(
    (ids: string[], allowed: (t: Task) => boolean): Task[] => {
      return ids
        .map((id) => taskById.get(id))
        .filter((t): t is Task => {
          if (!t || t.completed) return false;
          if (!taskScheduledOnDateKey(t, daySlotKey)) return false;
          return allowed(t);
        });
    },
    [taskById, daySlotKey],
  );

  const visibleDailyTasks = useMemo(
    () =>
      resolveVisibleBucket(visibleIdsForSlot.daily, (t) => t.frequency === "daily" || t.frequency === "weekly"),
    [resolveVisibleBucket, visibleIdsForSlot.daily],
  );

  const visibleMonthlyTasks = useMemo(
    () => resolveVisibleBucket(visibleIdsForSlot.monthly, (t) => t.frequency === "monthly"),
    [resolveVisibleBucket, visibleIdsForSlot.monthly],
  );

  /** Real tasks and/or library backfill pool — avoids hiding the section when only suggestions apply. */
  const hasAnyTasksForSelectedDay =
    dailyEligibleWithRefill.length > 0 || monthlyEligibleWithRefill.length > 0;

  const selectedDateLabel = useMemo(() => {
    if (displayTimeZone) {
      return formatDashboardLongDateFromYmd(daySlotKey, i18n.language, displayTimeZone);
    }
    const d = new Date(weekStartSunday);
    d.setDate(d.getDate() + selectedDayIndex);
    return formatDashboardLongDate(d, i18n.language);
  }, [daySlotKey, displayTimeZone, weekStartSunday, selectedDayIndex, i18n.language]);

  const persistTaskComplete = async (taskIdStr: string) => {
    const currentTask = taskById.get(taskIdStr) ?? tasks.find((task) => String(task.id) === taskIdStr);
    if (!currentTask || currentTask.completed) return;

    if (isLibraryDashboardTaskId(taskIdStr)) {
      setLibSchedule((prev) => {
        const consumedSlot = { ...(prev.consumedLibIdsByDaySlot[daySlotKey] ?? {}) };
        consumedSlot[taskIdStr] = true;
        const { [taskIdStr]: _rm, ...restDef } = prev.deferredUntilByLibId;
        return {
          deferredUntilByLibId: restDef,
          consumedLibIdsByDaySlot: {
            ...prev.consumedLibIdsByDaySlot,
            [daySlotKey]: consumedSlot,
          },
        };
      });
      if (sessionUserId != null) {
        queryClient.setQueryData<ProgressSummaryRead>(
          ["progress", "summary", "week", sessionUserId],
          (prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              completed_tasks_this_week: (prev.completed_tasks_this_week ?? 0) + 1,
            };
          },
        );
      }
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      return;
    }

    const tasksStorageKey =
      sessionUserIdRef.current != null ? demoTasksStorageKey(sessionUserIdRef.current) : "tasks";

    const optimisticTasks = tasks.map((task) =>
      String(task.id) === taskIdStr
        ? { ...task, completed: true, deferredUntilDateKey: undefined }
        : task
    );
    setTasks(optimisticTasks);
    localStorage.setItem(tasksStorageKey, JSON.stringify(optimisticTasks));

    const numericId = Number(taskIdStr);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      return;
    }

    try {
      await api.patch(`/tasks/${numericId}`, { completed: true });
      // Immediate summary UX: refetch can lag; donut already tracks full `tasks` via DashboardCategoryProgress.
      if (sessionUserId != null) {
        queryClient.setQueryData<ProgressSummaryRead>(
          ["progress", "summary", "week", sessionUserId],
          (prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              completed_tasks_this_week: (prev.completed_tasks_this_week ?? 0) + 1,
            };
          },
        );
      }
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch {
      setTasks((prev) => {
        const reverted = prev.map((task) =>
          String(task.id) === taskIdStr
            ? { ...task, completed: false, deferredUntilDateKey: currentTask.deferredUntilDateKey }
            : task
        );
        localStorage.setItem(tasksStorageKey, JSON.stringify(reverted));
        return reverted;
      });
    }
  };

  /** Clear one-shot deferrals from previous weeks; persist when changed. */
  useEffect(() => {
    const weekStartKey = weekDateKeys[0] ?? formatLocalDateKey(weekStartSunday);
    setTasks((prev) => {
      const stripped = stripExpiredTaskDeferrals(prev, weekStartKey);
      const changed = stripped.some(
        (t, i) => (t.deferredUntilDateKey ?? "") !== (prev[i]?.deferredUntilDateKey ?? "")
      );
      if (!changed) return prev;
      const tasksStorageKey =
        sessionUserIdRef.current != null ? demoTasksStorageKey(sessionUserIdRef.current) : "tasks";
      localStorage.setItem(tasksStorageKey, JSON.stringify(stripped));
      return stripped;
    });
  }, [weekDateKeys, weekStartSunday]);

  const deferTaskToNextDay = useCallback(
    (taskIdStr: string) => {
      if (exitingTaskId) return;
      const deferredKey = addDaysToDateKey(daySlotKey, 1);
      const nextDate = parseDateKeyLocal(deferredKey);
      const dayLabel = displayTimeZone
        ? formatDashboardWeekdayShortFromYmd(deferredKey, i18n.language, displayTimeZone)
        : formatDashboardWeekdayShort(nextDate ?? new Date(), i18n.language);

      if (isLibraryDashboardTaskId(taskIdStr)) {
        const task = taskById.get(taskIdStr);
        if (!task || task.completed) return;
        setLibSchedule((prev) => ({
          ...prev,
          deferredUntilByLibId: { ...prev.deferredUntilByLibId, [taskIdStr]: deferredKey },
        }));
        showSuccess(td("taskDeferredToDay", { day: dayLabel }));
        return;
      }

      let applied = false;
      setTasks((prev) => {
        const task = prev.find((t) => String(t.id) === taskIdStr);
        if (!task || task.completed) return prev;
        applied = true;
        const nextTasks = prev.map((t) =>
          String(t.id) === taskIdStr ? { ...t, deferredUntilDateKey: deferredKey } : t
        );
        const tasksStorageKey =
          sessionUserIdRef.current != null ? demoTasksStorageKey(sessionUserIdRef.current) : "tasks";
        localStorage.setItem(tasksStorageKey, JSON.stringify(nextTasks));
        return nextTasks;
      });
      if (applied) showSuccess(td("taskDeferredToDay", { day: dayLabel }));
    },
    [exitingTaskId, daySlotKey, displayTimeZone, i18n.language, td, taskById],
  );

  const progressStatsPending = loading || progressLoading;
  const completedTasksCount =
    progressStatsPending ? null : progressError ? 0 : (progressSummary?.completed_tasks_this_week ?? 0);
  const organizedRoomsCount =
    progressStatsPending ? null : progressError ? 0 : (progressSummary?.rooms_progressed_this_week ?? 0);
  const streakDays = progressStatsPending ? null : progressError ? 0 : (progressSummary?.streak_days ?? 0);

  const videoId = DASHBOARD_FEATURED_YOUTUBE_VIDEO_ID;
  const youtubeWatchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const youtubeThumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  const youtubeDisplayTitle = td("youtubeDashboardFeaturedTitle");

  const showTaskAreaSkeleton = loading;
  const progressCardLoading = loading || progressLoading;

  return (
    <div style={{ display: "grid", gap: 24 }} dir={dirAttr}>
      <section className="daily-card dashboard-daily-section" aria-labelledby="dashboard-daily-tasks-heading">
        <h2 id="dashboard-daily-tasks-heading" className="dashboard-daily-section__title">
          {td("tasksForSelectedDayTitle")}
        </h2>
        <p className="dashboard-daily-section__subtitle">
          {showTaskAreaSkeleton ? <span className="dashboard-daily-skeleton-inline" aria-hidden /> : selectedDateLabel}
        </p>
        {showTaskAreaSkeleton ? (
          <div className="dashboard-daily-task-list" aria-busy="true" aria-label={td("loading")}>
            <div className="dashboard-daily-bucket">
              <h3 className="dashboard-daily-bucket__title">{td("suggestedDailySectionTitle")}</h3>
              <div className="dashboard-daily-skeleton-card" />
              <div className="dashboard-daily-skeleton-card" />
              <div className="dashboard-daily-skeleton-card dashboard-daily-skeleton-card--short" />
            </div>
            <div className="dashboard-daily-bucket dashboard-daily-bucket--monthly">
              <h3 className="dashboard-daily-bucket__title">{td("suggestedMonthlySectionTitle")}</h3>
              <div className="dashboard-daily-skeleton-card" />
              <div className="dashboard-daily-skeleton-card dashboard-daily-skeleton-card--short" />
            </div>
          </div>
        ) : !hasAnyTasksForSelectedDay ? (
          <div className="dashboard-daily-empty">
            <p className="dashboard-daily-empty__text">{td("allClearForDay")}</p>
            <button type="button" className="dashboard-daily-empty__cta" onClick={() => navigate(ROUTES.ADD_TASK)}>
              {td("addDailyMonthlyTaskCta")}
            </button>
          </div>
        ) : (
          <div className="dashboard-daily-task-list">
            <div className="dashboard-daily-bucket">
              <h3 className="dashboard-daily-bucket__title">{td("suggestedDailySectionTitle")}</h3>
              {visibleDailyTasks.length === 0 ? (
                <p className="dashboard-daily-bucket__empty">{td("bucketEmptyDaily")}</p>
              ) : (
                visibleDailyTasks.map((task) => (
                  <DashboardDailyTaskCard
                    key={task.id}
                    task={task}
                    categoryLabel={getDashboardTaskCategoryLabel(task.room, tPc, tRooms)}
                    isExiting={exitingTaskId === String(task.id)}
                    onCompleteClick={() => {
                      if (exitingTaskId) return;
                      const reduceMotion =
                        typeof window !== "undefined" &&
                        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                      if (reduceMotion) {
                        void persistTaskComplete(String(task.id));
                        return;
                      }
                      setExitingTaskId(String(task.id));
                    }}
                    onExitAnimationEnd={() => {
                      void persistTaskComplete(String(task.id));
                      setExitingTaskId((cur) => (cur === String(task.id) ? null : cur));
                    }}
                    onDeferToNextDay={() => deferTaskToNextDay(String(task.id))}
                  />
                ))
              )}
            </div>

            <div className="dashboard-daily-bucket dashboard-daily-bucket--monthly">
              <h3 className="dashboard-daily-bucket__title">{td("suggestedMonthlySectionTitle")}</h3>
              {visibleMonthlyTasks.length === 0 ? (
                <p className="dashboard-daily-bucket__empty">{td("bucketEmptyMonthly")}</p>
              ) : (
                visibleMonthlyTasks.map((task) => (
                  <DashboardDailyTaskCard
                    key={task.id}
                    task={task}
                    categoryLabel={getDashboardTaskCategoryLabel(task.room, tPc, tRooms)}
                    isExiting={exitingTaskId === String(task.id)}
                    onCompleteClick={() => {
                      if (exitingTaskId) return;
                      const reduceMotion =
                        typeof window !== "undefined" &&
                        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                      if (reduceMotion) {
                        void persistTaskComplete(String(task.id));
                        return;
                      }
                      setExitingTaskId(String(task.id));
                    }}
                    onExitAnimationEnd={() => {
                      void persistTaskComplete(String(task.id));
                      setExitingTaskId((cur) => (cur === String(task.id) ? null : cur));
                    }}
                    onDeferToNextDay={() => deferTaskToNextDay(String(task.id))}
                  />
                ))
              )}
            </div>

            <p className="dashboard-daily-task-list__defer-hint">{td("taskSwipeDeferHint")}</p>
          </div>
        )}
      </section>

      <DashboardWeekBar
        weekStart={weekStartSunday}
        weekDateKeys={weekDateKeys}
        displayTimeZone={displayTimeZone}
        calendarTodayKey={calendarTodayKey}
        selectedDayIndex={selectedDayIndex}
        onSelectDay={setSelectedDayIndex}
        tasks={tasks}
      />

      <DashboardCategoryProgress
        progressLoading={progressCardLoading}
        progressError={progressError}
        completedThisWeek={completedTasksCount}
        streakDays={streakDays}
        areasActive={organizedRoomsCount}
        categoryProgressApi={progressSummary?.category_progress}
        localTasks={tasksForCategoryProgress}
        taskReads={chartTaskReads}
      />

      {celebrationKind ? (
        <Modal
          title={td("progressCelebrateTitle")}
          description={null}
          onClose={() => setCelebrationKind(null)}
        >
          <p className="dashboard-celebration-body">
            {celebrationKind === "both"
              ? td("progressCelebrateBoth")
              : celebrationKind === "monthly"
                ? td("progressCelebrateMonthly")
                : daySlotKey === calendarTodayKey
                  ? td("progressCelebrateDailyToday")
                  : td("progressCelebrateDailyOtherDay")}
          </p>
          <div className="dashboard-celebration-actions">
            <button type="button" className="wow-btn wow-btnPrimary" onClick={() => setCelebrationKind(null)}>
              {td("progressCelebrateCta")}
            </button>
          </div>
        </Modal>
      ) : null}

      {secondaryDashboardVisible ? (
        <section className="lifestyle-card" aria-labelledby="dashboard-youtube-heading">
          <div className="lifestyle-title" id="dashboard-youtube-heading">
            {td("youtubeRecommendedTitle")}
          </div>
          <a
            className="dashboard-youtube-card"
            href={youtubeWatchUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={td("youtubeLinkAria", { title: youtubeDisplayTitle })}
          >
            <div className="dashboard-youtube-card__thumb-wrap">
              <img src={youtubeThumbnailUrl} alt="" className="dashboard-youtube-card__thumb" />
            </div>
            <div className="dashboard-youtube-card__meta">
              <p className="dashboard-youtube-card__title">{youtubeDisplayTitle}</p>
              <p className="dashboard-youtube-card__cta">{td("youtubeWatchCta")}</p>
            </div>
          </a>
        </section>
      ) : null}

    </div>
  );
}
