import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { apiHeOrEn, isRtlLang, pickBilingual } from "../utils/localeDirection";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import BeforeAfterTimeline from "../components/BeforeAfterTimeline";
import DashboardWeekBar from "../components/DashboardWeekBar";
import DashboardDailyTaskCard from "../components/DashboardDailyTaskCard";
import { filterPendingTasksForSelectedDay } from "../utils/dashboardScheduledTasks";
import { getDashboardTaskCategoryLabel } from "../utils/dashboardRoomLabel";
import "../styles/dashboard-daily.css";
import { Task } from "../app/types";
import api, { fetchMe, getDailyReset, getDailyInspiration, getDailyTip, getProgressSummary } from '../api.ts';
import { clearTokens, hasTokens } from '../utils/tokenStorage';
import { ROUTES } from '../utils/routes';
import { showError } from '../utils/toast';
import { DailyFocusRead, DailyFocusCompleteIn, DailyFocusRefreshIn } from '../schemas/daily_focus';
import type { ProgressSummaryRead } from '../schemas/progress';
import type { DailyInspirationRead, DailyTipRead } from '../schemas/dashboard';

type RecommendedVideo = {
  videoId: string | null;
  title: string | null;
  url: string | null;
  thumbnail: string | null;
};

type DashboardRoom = {
  id: string;
  /** Key under `rooms.room_types.*` */
  roomTypeKey: "living" | "kitchen" | "bedroom" | "closet";
  emoji: string;
};

const extractYouTubeId = (url?: string | null): string | null => {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{6,})/
  );
  return match?.[1] ?? null;
};

const triggerProgressRefresh = () => {
  // Stage 2 hook: consumers can listen to this event and refresh progress widgets.
  window.dispatchEvent(new CustomEvent("daily-focus:completed"));
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

export default function Dashboard() {
  const { t: td, i18n } = useTranslation("dashboard");
  const { t: tc } = useTranslation("challenge");
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
  const [recommendedVideo, setRecommendedVideo] = useState<RecommendedVideo | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isResetDone, setIsResetDone] = useState(false);
  /** Paused = interval stopped; timer seconds frozen in state. */
  const [isResetPaused, setIsResetPaused] = useState(false);
  const [completeSaveFailed, setCompleteSaveFailed] = useState(false);

  /** Bound when challenge opens — survives daily refetch; used for POST /daily-reset/complete. */
  const resetSessionTaskIdRef = useRef<number | null>(null);
  const resetSessionTitleRef = useRef("");
  const resetSessionRoomRef = useRef("");

  // Daily Reset API
  const { data: dailyFocus, isLoading: dailyFocusLoading } = useQuery<DailyFocusRead>({
    queryKey: ["daily-reset", "today"],
    queryFn: async () => {
      const response = await getDailyReset();
      return response.data;
    },
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const completeMutation = useMutation({
    mutationFn: async (payload: DailyFocusCompleteIn) => {
      const response = await api.post<DailyFocusRead>("/daily-reset/complete", payload);
      return response.data;
    },
    onSuccess: (data) => {
      // Apply server truth immediately (avoids stale card until refetch; respects 5m staleTime).
      queryClient.setQueryData<DailyFocusRead>(["daily-reset", "today"], data);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "daily-tip"] });
      triggerProgressRefresh();
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async (payload: DailyFocusRefreshIn) => {
      const response = await api.post<DailyFocusRead>("/daily-reset/refresh", payload);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData<DailyFocusRead>(["daily-reset", "today"], data);
      queryClient.invalidateQueries({ queryKey: ["dashboard", "daily-tip"] });
    },
  });

  const {
    data: progressSummary,
    isLoading: progressLoading,
    isError: progressError,
  } = useQuery<ProgressSummaryRead>({
    queryKey: ["progress", "summary", "week"],
    queryFn: async () => {
      const res = await getProgressSummary("week");
      return res.data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const langParam = apiHeOrEn(i18n.language);
  const calendarDayKey = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();
  const dayMs = 86_400_000;

  const {
    data: dailyInspiration,
    isPending: inspirationPending,
    isError: inspirationError,
  } = useQuery<DailyInspirationRead>({
    queryKey: ["dashboard", "daily-inspiration", calendarDayKey, langParam],
    queryFn: async () => {
      const res = await getDailyInspiration(langParam);
      return res.data;
    },
    staleTime: dayMs,
    gcTime: dayMs * 2,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  const {
    data: dailyTip,
    isPending: dailyTipPending,
    isError: dailyTipError,
  } = useQuery<DailyTipRead>({
    queryKey: ["dashboard", "daily-tip", calendarDayKey, langParam],
    queryFn: async () => {
      const res = await getDailyTip(langParam);
      return res.data;
    },
    staleTime: dayMs,
    gcTime: dayMs * 2,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const onProgressHook = () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    };
    window.addEventListener("daily-focus:completed", onProgressHook);
    return () => window.removeEventListener("daily-focus:completed", onProgressHook);
  }, [queryClient]);

  const rooms: DashboardRoom[] = [
    { id: "living-room", roomTypeKey: "living", emoji: "🏠" },
    { id: "kitchen", roomTypeKey: "kitchen", emoji: "🍳" },
    { id: "bedroom", roomTypeKey: "bedroom", emoji: "🛏" },
    { id: "closet", roomTypeKey: "closet", emoji: "👕" },
  ];

  useEffect(() => {
    const loadUser = async () => {
      // Check if user has tokens
      if (!hasTokens()) {
        console.log('[Dashboard] No tokens found, redirecting to login');
        navigate(ROUTES.LOGIN, { replace: true });
        return;
      }

      try {
        // Fetch user info from API
        await fetchMe();
      } catch (error) {
        console.error('[Dashboard] Error fetching user:', error);
        // If token is invalid, clear and redirect
        clearTokens();
        navigate(ROUTES.LOGIN, { replace: true });
        return;
      }

      // Load tasks from localStorage or create demo tasks
      const savedTasks = localStorage.getItem("tasks");
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks) as Task[];
          const localizedTasks = localizeDemoTaskTitles(parsedTasks, i18n.language);
          setTasks(localizedTasks);
          localStorage.setItem("tasks", JSON.stringify(localizedTasks));
        } catch (e) {
          console.error('[Dashboard] Error parsing saved tasks:', e);
        }
      } else {
        const initialTasks = buildInitialDemoTasks(i18n.language);
        setTasks(initialTasks);
        localStorage.setItem("tasks", JSON.stringify(initialTasks));
      }

      setLoading(false);
    };

    loadUser();
  }, [i18n.language, navigate]);

  const visibleDashboardTasks = useMemo(
    () => filterPendingTasksForSelectedDay(tasks, selectedDayIndex),
    [tasks, selectedDayIndex]
  );

  const roomForVideo = useMemo(() => {
    const first = visibleDashboardTasks[0];
    return first?.room ?? "living-room";
  }, [visibleDashboardTasks]);

  const persistTaskComplete = async (taskIdStr: string) => {
    const currentTask = tasks.find((task) => String(task.id) === taskIdStr);
    if (!currentTask || currentTask.completed) return;

    const optimisticTasks = tasks.map((task) =>
      String(task.id) === taskIdStr ? { ...task, completed: true } : task
    );
    setTasks(optimisticTasks);
    localStorage.setItem("tasks", JSON.stringify(optimisticTasks));

    const numericId = Number(taskIdStr);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      return;
    }

    try {
      await api.patch(`/tasks/${numericId}`, { completed: true });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch {
      setTasks((prev) => {
        const reverted = prev.map((task) =>
          String(task.id) === taskIdStr ? { ...task, completed: false } : task
        );
        localStorage.setItem("tasks", JSON.stringify(reverted));
        return reverted;
      });
    }
  };
  useEffect(() => {
    if (!roomForVideo) return;
    let isMounted = true;
    setVideoLoading(true);

    api.get<RecommendedVideo>("/content/recommended-video", {
      params: { room_id: roomForVideo, lang: apiHeOrEn(i18n.language) },
    })
      .then(({ data }) => {
        if (!isMounted) return;
        setRecommendedVideo(data);
      })
      .catch(() => {
        if (!isMounted) return;
        setRecommendedVideo(null);
      })
      .finally(() => {
        if (!isMounted) return;
        setVideoLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [roomForVideo, i18n.language]);

  // Get daily task from API
  const dailyTask = dailyFocus?.task || null;
  const completedTasksCount =
    progressLoading ? null : progressError ? 0 : (progressSummary?.completed_tasks_this_week ?? 0);
  const organizedRoomsCount =
    progressLoading ? null : progressError ? 0 : (progressSummary?.rooms_progressed_this_week ?? 0);
  const streakDays = progressLoading ? null : progressError ? 0 : (progressSummary?.streak_days ?? 0);
  const trendMax = useMemo(() => {
    const arr = progressSummary?.daily_completed_counts ?? [];
    if (!arr.length) return 1;
    return Math.max(1, ...arr.map((d) => d.count));
  }, [progressSummary]);
  const dailyTaskTime = dailyTask?.due_date
    ? new Date(dailyTask.due_date).toLocaleTimeString(apiHeOrEn(i18n.language) === "he" ? "he-IL" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : td("allDay");
  const secondsForClock = isResetDone ? 0 : timer ?? 0;
  const timerLabel = `${String(Math.floor(secondsForClock / 60)).padStart(2, "0")}:${String(
    secondsForClock % 60
  ).padStart(2, "0")}`;
  const videoId = recommendedVideo?.videoId || extractYouTubeId(recommendedVideo?.url) || "dQw4w9WgXcQ";
  const youtubeWatchUrl =
    recommendedVideo?.url || `https://www.youtube.com/watch?v=${videoId}`;
  const youtubeThumbnailUrl =
    recommendedVideo?.thumbnail ||
    `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  const youtubeDisplayTitle = recommendedVideo?.title?.trim() || td("youtubeFallbackTitle");

  // Get room info from daily task
  const dailyRoomId = dailyTask?.room_id;
  const dailyRoom = dailyRoomId ? rooms.find((r) => r.id === String(dailyRoomId)) : null;
  const dailyRoomLabel = dailyRoom ? tRooms(`room_types.${dailyRoom.roomTypeKey}`) : "";
  const dailyRoomEmoji = dailyRoom?.emoji || "🏡";

  const startTimer = () => {
    if (!dailyTask || !dailyFocus) return;
    const tid =
      dailyFocus.task_id ??
      (typeof dailyTask.id === "number" ? dailyTask.id : Number(dailyTask.id));
    resetSessionTaskIdRef.current = Number.isFinite(tid) ? tid : dailyFocus.task_id ?? null;
    resetSessionTitleRef.current = dailyTask.title;
    resetSessionRoomRef.current = dailyRoomLabel ? `${dailyRoomEmoji} ${dailyRoomLabel}` : "";
    setCompleteSaveFailed(false);
    setIsResetPaused(false);
    setIsResetOpen(true);
    setIsResetDone(false);
    setTimer(300);
  };

  useEffect(() => {
    if (!isResetOpen || isResetPaused || isResetDone) return;
    const id = window.setInterval(() => {
      setTimer((prev) => {
        if (prev === null || prev < 1) return prev;
        if (prev <= 1) {
          setIsResetDone(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isResetOpen, isResetPaused, isResetDone]);

  const cancelResetSession = () => {
    resetSessionTaskIdRef.current = null;
    setIsResetOpen(false);
    setIsResetDone(false);
    setIsResetPaused(false);
    setTimer(null);
    setCompleteSaveFailed(false);
  };

  const markChallengeFinishedEarly = () => {
    setIsResetPaused(true);
    setTimer(null);
    setIsResetDone(true);
  };

  /** POST /daily-reset/complete — does not close modal (completion UX stays until user chooses next step). */
  const saveChallengeCompletionOnly = async (): Promise<boolean> => {
    const taskId = resetSessionTaskIdRef.current ?? dailyFocus?.task_id ?? undefined;
    if (taskId == null && dailyFocus?.task_id == null) return false;
    setCompleteSaveFailed(false);
    try {
      await completeMutation.mutateAsync({
        task_id: taskId ?? dailyFocus?.task_id ?? undefined,
      });
      setCompleteSaveFailed(false);
      return true;
    } catch {
      setCompleteSaveFailed(true);
      showError(tc("completeSaveError"));
      return false;
    }
  };

  const closeChallengeModalClean = () => {
    resetSessionTaskIdRef.current = null;
    setIsResetOpen(false);
    setIsResetDone(false);
    setIsResetPaused(false);
    setTimer(null);
    setCompleteSaveFailed(false);
  };

  /** Save, refresh daily reset for a new task, close (habit momentum). */
  const finishChallengeNextTask = async () => {
    if (completeMutation.isPending || refreshMutation.isPending) return;
    const ok = await saveChallengeCompletionOnly();
    if (!ok) return;
    try {
      await refreshMutation.mutateAsync({});
    } catch {
      showError(tc("refreshAfterSaveError"));
    } finally {
      closeChallengeModalClean();
    }
  };

  /** Save and return to dashboard (no refresh of focus). */
  const finishChallengeBackToDashboard = async () => {
    if (completeMutation.isPending || refreshMutation.isPending) return;
    const ok = await saveChallengeCompletionOnly();
    if (!ok) return;
    closeChallengeModalClean();
  };

  /** Card "Done" without opening challenge — uses current API focus only. */
  const completeDailyTaskFromCard = async () => {
    if (!dailyFocus) return;
    try {
      await completeMutation.mutateAsync({
        task_id: dailyFocus.task_id || undefined,
      });
    } catch {
      showError(tc("completeSaveError"));
    }
  };

  const refreshDailyTask = async () => {
    const payload: DailyFocusRefreshIn = {};
    await refreshMutation.mutateAsync(payload);
  };

  const startSmallTask = () => {
    if (dailyTask && !dailyFocus?.completed_at) {
      startTimer();
      return;
    }
    navigate(ROUTES.ADD_TASK);
  };

  const challengeStatLine = useMemo(() => {
    if (streakDays != null && streakDays > 0) {
      return tc("statStreak", { n: streakDays });
    }
    if (progressSummary != null && !progressLoading && !progressError) {
      return tc("statWeek", { n: progressSummary.completed_tasks_this_week ?? 0 });
    }
    return null;
  }, [streakDays, progressSummary, progressLoading, progressError, tc]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" dir={dirAttr}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{td("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }} dir={dirAttr}>
      <div className="dashboard-hero-compact">
        <p className="dashboard-hero-compact__text">{td("heroCompactSub")}</p>
        <button type="button" className="dashboard-hero-compact__btn" onClick={startSmallTask}>
          {td("heroCompactCta")}
        </button>
      </div>

      <section className="daily-card dashboard-daily-section" aria-labelledby="dashboard-daily-tasks-heading">
        <h2 id="dashboard-daily-tasks-heading" className="dashboard-daily-section__title">
          {td("dailyTasksTitle")}
        </h2>
        {visibleDashboardTasks.length === 0 ? (
          <div className="dashboard-daily-empty">
            <p className="dashboard-daily-empty__text">{td("allClearForDay")}</p>
            <button type="button" className="dashboard-daily-empty__cta" onClick={() => navigate(ROUTES.ADD_TASK)}>
              {td("addDailyMonthlyTaskCta")}
            </button>
          </div>
        ) : (
          <div className="dashboard-daily-task-list">
            {visibleDashboardTasks.map((task) => (
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
              />
            ))}
          </div>
        )}
      </section>

      <DashboardWeekBar selectedDayIndex={selectedDayIndex} onSelectDay={setSelectedDayIndex} />

      <section className="lifestyle-card" aria-labelledby="dashboard-youtube-heading">
        <div className="lifestyle-title" id="dashboard-youtube-heading">
          {td("youtubeRecommendedTitle")}
        </div>
        {videoLoading ? (
          <div className="dashboard-youtube-skeleton" />
        ) : (
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
        )}
      </section>

      <div
        className="dashboard-daily-insights"
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        }}
      >
        <div className="daily-card" aria-live="polite">
          <h2>{td("dailyInspirationTitle")}</h2>
          {inspirationPending && !dailyInspiration ? (
            <p className="task-title">{td("loading")}</p>
          ) : inspirationError ? (
            <p className="wow-muted">
              {td("inspirationLoadError")}
            </p>
          ) : (
            <p className="task-title" style={{ fontWeight: 500, lineHeight: 1.5 }}>
              {dailyInspiration?.quote}
            </p>
          )}
        </div>
        <div className="daily-card" aria-live="polite">
          <h2>{td("dailyTipTitle")}</h2>
          <div className="wow-muted" style={{ fontSize: "0.85rem", marginBottom: 8 }}>
            {td("dailyTipBadge")}
          </div>
          {dailyTipPending && !dailyTip ? (
            <p className="task-title">{td("loading")}</p>
          ) : dailyTipError ? (
            <p className="wow-muted">
              {td("tipLoadError")}
            </p>
          ) : (
            <p className="task-title" style={{ fontWeight: 500, lineHeight: 1.5 }}>
              {dailyTip?.tip}
            </p>
          )}
        </div>
      </div>

      <div className="daily-card">
        <h2>{td("dailyTaskTitle")}</h2>
        {dailyFocusLoading ? (
          <p className="task-title">{td("loading")}</p>
        ) : dailyTask ? (
          <>
            {dailyRoomLabel && (
              <div className="daily-line">{dailyRoomEmoji} {dailyRoomLabel}</div>
            )}
            <p className="task-title">{dailyTask.title}</p>
            {dailyTask.due_date && (
              <div className="wow-muted">{dailyTaskTime}</div>
            )}
            {dailyFocus?.completed_at && (
              <div className="wow-muted" style={{ color: "#10b981" }}>
                ✓ {td("completedBadge")}
              </div>
            )}
          </>
        ) : (
          <p className="task-title">{td("noOpenTasks")}</p>
        )}

        <div className="actions">
          <button
            type="button"
            className="primary"
            onClick={startTimer}
            disabled={!dailyTask || isResetOpen || !!dailyFocus?.completed_at}
          >
            {td("start5")}
          </button>

          <button 
            type="button" 
            className="secondary" 
            onClick={completeDailyTaskFromCard}
            disabled={!dailyTask || completeMutation.isPending || !!dailyFocus?.completed_at}
          >
            {completeMutation.isPending ? td("loading") : td("done")}
          </button>

          <button
            type="button"
            className="secondary"
            onClick={refreshDailyTask}
            disabled={!dailyTask || refreshMutation.isPending || !!dailyFocus?.completed_at}
            title={td("refreshTaskTitle")}
          >
            {refreshMutation.isPending ? td("refreshing") : td("refresh")}
          </button>
        </div>

        {!dailyTask && !dailyFocusLoading && (
          <div style={{ marginTop: 10 }}>
            <button type="button" className="wow-btn wow-btnPrimary" onClick={() => navigate(ROUTES.ADD_TASK)}>
              {td("createFirstTask")}
            </button>
          </div>
        )}
      </div>

      <div className="progress-card">
        <h3>{td("weeklyProgress")}</h3>

        <div className="stats">
          <div className="stat">
            {progressLoading ? "—" : completedTasksCount}
            <span>{td("tasksLabel")}</span>
          </div>

          <div className="stat">
            {progressLoading ? "—" : organizedRoomsCount}
            <span>{td("roomsLabel")}</span>
          </div>

          <div className="stat">
            {progressLoading ? "—" : <>🔥 {streakDays}</>}
            <span>{td("streakLabel")}</span>
          </div>
        </div>

        {!progressLoading && progressSummary && (
          <>
            <div className="lifestyle-muted" style={{ fontSize: 12, marginTop: 4 }}>
              {td("trendCaption")}
            </div>
            <div
              className="progress-trend"
              role="img"
              aria-label={td("progressTrendAria")}
            >
              {progressSummary.daily_completed_counts.map((d) => {
                const dayNum = Number(d.date.slice(8, 10)) || 0;
                const h = Math.max(4, Math.round((d.count / trendMax) * 44));
                return (
                  <div key={d.date} className="progress-trend-bar-wrap" title={`${d.date}: ${d.count}`}>
                    <div className="progress-trend-bar" style={{ height: h }} />
                    <span className="progress-trend-dow">{dayNum}</span>
                  </div>
                );
              })}
            </div>
            {!progressError &&
              (progressSummary.completed_tasks_this_week ?? 0) === 0 &&
              (progressSummary.streak_days ?? 0) === 0 && (
                <p className="lifestyle-muted" style={{ fontSize: 13, margin: 0 }}>
                  {td("progressEmptyHint")}
                </p>
              )}
          </>
        )}
      </div>

      <BeforeAfterTimeline />

      {isResetOpen && (
        <div className="reset-overlay reset-overlay--challenge" role="dialog" aria-modal="true" aria-labelledby="reset-challenge-title">
          <div
            className={`reset-modal reset-modal--challenge${isResetDone ? " reset-modal--completion" : ""}`}
          >
            {!isResetDone ? (
              <>
                <div id="reset-challenge-title" className="reset-title">
                  {tc("title")}
                </div>
                <p className="reset-focus-line">{tc("focusLine")}</p>
                {resetSessionRoomRef.current ? (
                  <div className="reset-room-line">{resetSessionRoomRef.current}</div>
                ) : null}
                <div className="reset-task-title">{resetSessionTitleRef.current}</div>
                <div className="reset-clock" aria-live="polite" aria-atomic="true">
                  {timerLabel}
                </div>
                <p className="reset-mvp-note">{tc("timerMvpNote")}</p>
                <div className="reset-challenge-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setIsResetPaused((p) => !p)}
                  >
                    {isResetPaused ? tc("resume") : tc("pause")}
                  </button>
                  <button type="button" className="secondary" onClick={markChallengeFinishedEarly}>
                    {tc("completeEarly")}
                  </button>
                  <button type="button" className="secondary reset-btn-danger" onClick={cancelResetSession}>
                    {tc("cancelSession")}
                  </button>
                </div>
              </>
            ) : (
              <div className="reset-completion">
                <div className="reset-success-visual" aria-hidden="true">
                  <span className="reset-success-check">✓</span>
                </div>
                <h2 className="reset-completion-title">{tc("greatJob")}</h2>
                <p className="reset-completion-motivation">{tc("successMotivation")}</p>
                {resetSessionRoomRef.current ? (
                  <div className="reset-room-line reset-completion-room">{resetSessionRoomRef.current}</div>
                ) : null}
                <div className="reset-task-title reset-completion-task">
                  {resetSessionTitleRef.current || tc("dailyTaskFallback")}
                </div>
                {challengeStatLine ? <div className="reset-stat-pill">{challengeStatLine}</div> : null}
                {completeSaveFailed ? (
                  <>
                    <p className="reset-save-error" role="alert">
                      {tc("completeSaveError")}
                    </p>
                    <div className="reset-completion-actions">
                      <button
                        type="button"
                        className="primary"
                        onClick={() => void saveChallengeCompletionOnly()}
                        disabled={completeMutation.isPending}
                      >
                        {completeMutation.isPending ? td("loading") : tc("retrySave")}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="reset-completion-actions">
                    <button
                      type="button"
                      className="primary"
                      onClick={() => void finishChallengeNextTask()}
                      disabled={completeMutation.isPending || refreshMutation.isPending}
                    >
                      {completeMutation.isPending || refreshMutation.isPending ? td("loading") : tc("nextTaskCta")}
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => void finishChallengeBackToDashboard()}
                      disabled={completeMutation.isPending || refreshMutation.isPending}
                    >
                      {tc("backDashboardCta")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
