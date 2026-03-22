/**
 * "לוח החזון שלי" — שבוע עם שעות: משימות + Google Calendar, חיבור ליומן אישי, ועריכת לוח חזון.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import heLocale from "@fullcalendar/core/locales/he";
import frLocale from "@fullcalendar/core/locales/fr";
import arLocale from "@fullcalendar/core/locales/ar";
import ruLocale from "@fullcalendar/core/locales/ru";
import type { DateSelectArg, EventChangeArg, EventClickArg, EventInput } from "@fullcalendar/core";
import axios from "axios";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "../api";
import { VisionBoardModal } from "../components/VisionBoardModal";
import { ROUTES } from "../utils/routes";
import { getAccessToken } from "../utils/tokenStorage";
import { baseLanguageCode, isRtlLang } from "../utils/localeDirection";
import { showError, showInfo, showPromise } from "../utils/toast";
import type { CalendarEvent } from "../schemas/calendar";
import type { GoogleDashboardCalendarAnchor } from "../schemas/googleCalendarAnchor";
import type { TaskRead } from "../schemas/task";
import { useVoice } from "../hooks/useVoice";
import { useAuth } from "../hooks/useAuth";
import { VisionScheduleMediaSection } from "../components/VisionScheduleMediaSection";

function visionScheduleUserId(user: unknown): number | null {
  if (!user || typeof user !== "object") return null;
  const id = (user as { id?: unknown }).id;
  if (typeof id === "number" && Number.isFinite(id)) return id;
  if (typeof id === "string") {
    const n = Number.parseInt(id, 10);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function logAxios(err: unknown, label: string) {
  if (axios.isAxiosError(err)) {
    console.error(label, {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
    });
    return;
  }
  console.error(label, err);
}

export default function VisionSchedulePage() {
  const { user } = useAuth();
  const visionUserId = visionScheduleUserId(user);
  const { t, i18n } = useTranslation("visionSchedule");
  const { t: tCal } = useTranslation("calendar");
  const { t: tToast } = useTranslation("toast");
  const { speak } = useVoice();

  const baseLang = baseLanguageCode(i18n.language);
  const calendarLocale =
    baseLang === "he" ? "he" : baseLang === "fr" ? "fr" : baseLang === "ar" ? "ar" : baseLang === "ru" ? "ru" : "en";
  const calendarDirection = isRtlLang(i18n.language) ? "rtl" : "ltr";
  const visionApiLang = baseLang === "he" ? "he" : "en";

  const [tasks, setTasks] = useState<TaskRead[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarDisconnected, setCalendarDisconnected] = useState(false);
  const [visionModalOpen, setVisionModalOpen] = useState(false);

  const { data: calendarAnchor } = useQuery<GoogleDashboardCalendarAnchor>({
    queryKey: ["google-calendar", "dashboard-anchor", visionUserId],
    queryFn: async () => {
      const { data } = await api.get<GoogleDashboardCalendarAnchor>("/google-calendar/dashboard-anchor");
      return data;
    },
    enabled: visionUserId != null && !!getAccessToken(),
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: true,
  });

  const calendarTimeZone =
    calendarAnchor?.connected && calendarAnchor.time_zone ? calendarAnchor.time_zone : undefined;

  const loadTasks = async () => {
    try {
      const { data } = await api.get<TaskRead[]>("/tasks");
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      logAxios(e, "[VisionSchedulePage] tasks");
      setTasks([]);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const { data } = await api.get<CalendarEvent[]>("/google-calendar/events", {
        params: {
          limit: 200,
          past_days: 7,
          future_days: 21,
        },
      });
      setCalendarEvents(data || []);
      setCalendarDisconnected(false);
    } catch (e) {
      logAxios(e, "[VisionSchedulePage] google calendar");
      const status = axios.isAxiosError(e) ? e.response?.status : undefined;
      if (status === 401 || status === 403 || status === 404) {
        setCalendarDisconnected(true);
      }
      setCalendarEvents([]);
    }
  };

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadTasks(), loadCalendarEvents()]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      setTasks([]);
      setCalendarEvents([]);
      setLoading(false);
      return;
    }
    void refreshAll();
  }, [refreshAll]);

  const connectGoogleCalendar = async () => {
    try {
      const { data } = await api.get<{ auth_url?: string }>("/auth/google/login");
      if (data?.auth_url) {
        window.location.href = data.auth_url;
        return;
      }
    } catch {
      /* fall through */
    }
    window.location.href = ROUTES.SETTINGS;
  };

  const taskEvents: EventInput[] = useMemo(
    () =>
      tasks
        .filter((task) => task.due_date && !task.completed)
        .map((task) => ({
          id: `task-${task.id}`,
          title: `✓ ${task.title}`,
          start: task.due_date as string,
          end: task.due_date
            ? new Date(new Date(task.due_date).getTime() + 60 * 60 * 1000).toISOString()
            : undefined,
          backgroundColor: "#92400e",
          borderColor: "#78350f",
          extendedProps: { type: "task", taskId: task.id },
        })),
    [tasks],
  );

  const googleEvents: EventInput[] = useMemo(
    () =>
      calendarEvents.map((event) => ({
        id: `gcal-${event.id}`,
        title: event.summary || tCal("untitledEvent"),
        start: event.start,
        end: event.end || event.start,
        backgroundColor: "#2563eb",
        borderColor: "#1d4ed8",
        extendedProps: {
          type: "calendar",
          eventId: event.id,
          description: event.description,
          location: event.location,
          htmlLink: event.htmlLink,
        },
      })),
    [calendarEvents, tCal],
  );

  const events: EventInput[] = useMemo(() => [...taskEvents, ...googleEvents], [taskEvents, googleEvents]);

  const busyBlocksThisWeek = calendarEvents.length;

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    const title = window.prompt(tCal("promptTaskTitle"));
    if (title) {
      const promise = api.post("/tasks", {
        title,
        due_date: selectInfo.start.toISOString(),
      });
      showPromise(promise, {
        loading: tToast("creating_task"),
        success: tToast("task_created"),
        error: tToast("task_creation_failed"),
      });
      void promise.then(() => loadTasks()).catch(() => {});
    }
    selectInfo.view.calendar.unselect();
  };

  const handleEventDrop = async (eventInfo: EventChangeArg) => {
    const taskId = Number(eventInfo.event.extendedProps.taskId);
    const newDate = eventInfo.event.start;
    if (!newDate || !Number.isFinite(taskId)) return;

    const promise = api.put(`/tasks/${taskId}`, { due_date: newDate.toISOString() });
    showPromise(promise, {
      loading: tToast("updating_task_date"),
      success: tToast("task_date_updated"),
      error: tToast("task_date_update_failed"),
    });
    try {
      await promise;
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, due_date: newDate.toISOString() } : task)),
      );
      speak(tCal("speakTaskUpdated"));
    } catch (e) {
      logAxios(e, "[VisionSchedulePage] drop");
      eventInfo.revert();
    }
  };

  const handleEventResize = async (eventInfo: EventChangeArg) => {
    const taskId = Number(eventInfo.event.extendedProps.taskId);
    const newEnd = eventInfo.event.end;
    if (!newEnd || !Number.isFinite(taskId)) return;

    const promise = api.put(`/tasks/${taskId}`, { due_date: newEnd.toISOString() });
    showPromise(promise, {
      loading: tToast("updating_task_date"),
      success: tToast("task_date_updated"),
      error: tToast("task_date_update_failed"),
    });
    try {
      await promise;
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, due_date: newEnd.toISOString() } : task)),
      );
      speak(tCal("speakTaskUpdated"));
    } catch (e) {
      logAxios(e, "[VisionSchedulePage] resize");
      eventInfo.revert();
    }
  };

  const handleEventClick = async (clickInfo: EventClickArg) => {
    const type = clickInfo.event.extendedProps.type;
    if (type === "task") {
      const taskId = Number(clickInfo.event.extendedProps.taskId);
      const task = tasks.find((tk) => tk.id === taskId);
      if (task?.due_date) {
        const ok = window.confirm(
          `${tCal("taskPrefix")}: ${clickInfo.event.title}\n${tCal("confirmCreateGoogleFromTask")}`,
        );
        if (ok) {
          try {
            const promise = api.post(`/google-calendar/sync-tasks?task_id=${task.id}`);
            showPromise(promise, {
              loading: tCal("creatingGoogleEvent"),
              success: tCal("googleEventCreated"),
              error: tCal("googleEventCreateFail"),
            });
            await promise;
            await loadCalendarEvents();
            speak(tCal("googleEventCreated"));
          } catch (e) {
            logAxios(e, "[VisionSchedulePage] sync task");
            const detail = axios.isAxiosError(e) ? e.response?.data?.detail : undefined;
            showError(detail || tCal("failedCreateEvent"));
          }
        }
      } else {
        showInfo(clickInfo.event.title);
      }
    } else if (type === "calendar") {
      const summary = String(clickInfo.event.title || "");
      const ok = window.confirm(tCal("createTaskFromEvent", { summary }));
      if (ok) {
        const start = clickInfo.event.start;
        const promise = api.post("/tasks", {
          title: summary,
          due_date: start?.toISOString() ?? new Date().toISOString(),
        });
        showPromise(promise, {
          loading: tToast("creating_task"),
          success: tToast("task_created"),
          error: tToast("task_creation_failed"),
        });
        try {
          await promise;
          await loadTasks();
          speak(tCal("speakTaskCreatedFromEvent"));
        } catch (e) {
          logAxios(e, "[VisionSchedulePage] task from event");
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-600 dark:text-gray-300" dir={calendarDirection}>
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-cream dark:bg-dark-bg min-h-screen" dir={calendarDirection}>
      <div className="max-w-7xl mx-auto space-y-4">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text">{t("pageTitle")}</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl text-sm sm:text-base">{t("intro")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="wow-btn wow-btnPrimary" onClick={() => setVisionModalOpen(true)}>
              {t("editVision")}
            </button>
            <Link to={ROUTES.CALENDAR} className="wow-btn inline-flex items-center justify-center no-underline">
              {t("openFullCalendar")}
            </Link>
            <button type="button" className="wow-btn" onClick={() => void refreshAll()}>
              {t("refresh")}
            </button>
          </div>
        </header>

        {calendarDisconnected ? (
          <div
            className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4"
            role="status"
          >
            <p className="font-semibold text-amber-900 dark:text-amber-100">{t("connectTitle")}</p>
            <p className="text-sm text-amber-900/90 dark:text-amber-100/90 mt-1">{t("connectBody")}</p>
            <button type="button" className="wow-btn wow-btnPrimary mt-3" onClick={() => void connectGoogleCalendar()}>
              {t("connectCta")}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/20 dark:border-emerald-900 p-4">
            <p className="text-sm text-emerald-900 dark:text-emerald-100">
              {t("googleHint", { count: busyBlocksThisWeek })}
            </p>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 mt-2">{t("googleHintSub")}</p>
            {busyBlocksThisWeek === 0 ? (
              <p className="text-xs text-emerald-900/90 dark:text-emerald-100/90 mt-2">{t("googleEmptyNote")}</p>
            ) : null}
            <button
              type="button"
              className="text-sm underline text-emerald-900 dark:text-emerald-100 mt-2"
              onClick={() => void connectGoogleCalendar()}
            >
              {t("reconnect")}
            </button>
          </div>
        )}

        <VisionScheduleMediaSection userId={visionUserId} />

        <div className="bg-white dark:bg-dark-surface rounded-xl shadow-lg p-2 sm:p-4 overflow-x-auto">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locales={[heLocale, frLocale, arLocale, ruLocale]}
            initialView="timeGridWeek"
            timeZone={calendarTimeZone || "local"}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "timeGridWeek,dayGridMonth",
            }}
            locale={calendarLocale}
            direction={calendarDirection}
            editable
            selectable
            events={events}
            select={handleDateSelect}
            eventDrop={handleEventDrop}
            eventResize={handleEventResize}
            eventClick={(info) => void handleEventClick(info)}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="22:00:00"
            allDaySlot
            nowIndicator
            eventDisplay="block"
            businessHours={{
              daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
              startTime: "08:00",
              endTime: "20:00",
            }}
          />
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">{t("footerHint")}</p>
      </div>

      <VisionBoardModal isOpen={visionModalOpen} onClose={() => setVisionModalOpen(false)} apiLang={visionApiLang} />
    </div>
  );
}
