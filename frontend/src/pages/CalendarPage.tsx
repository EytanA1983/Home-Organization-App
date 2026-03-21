/**
 * Calendar Page Component
 * FullCalendar view for tasks with week/month views and drag & drop
 */
import React, { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import heLocale from '@fullcalendar/core/locales/he';
import { EventInput, DateSelectArg, EventChangeArg } from '@fullcalendar/core';
import axios from 'axios';
import api from '../api';
import { useTranslation } from 'react-i18next';
import { apiHeOrEn, isRtlLang } from '../utils/localeDirection';
import { useVoice } from '../hooks/useVoice';
import { showError, showPromise, showInfo } from '../utils/toast';
import { CalendarEvent } from '../schemas/calendar';
import { getAccessToken } from '../utils/tokenStorage';

interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  category_id?: number;
  room_id?: number;
}

function logAxios(err: unknown, label: string) {
  if (axios.isAxiosError(err)) {
    const fullUrl = err.config?.baseURL
      ? `${err.config.baseURL}${err.config.url || ''}`
      : err.config?.url;
    console.error(label, {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      statusText: err.response?.statusText,
      method: err.config?.method?.toUpperCase(),
      fullURL: fullUrl,
      data: err.response?.data,
    });
    return;
  }
  console.error(label, err);
}

export const CalendarPage: React.FC = () => {
  const { t, i18n } = useTranslation('calendar');
  const { t: tToast } = useTranslation('toast');
  const { t: tTasks } = useTranslation('tasks');
  const { t: tCommon } = useTranslation('common');
  const { speak } = useVoice();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarUnavailable, setCalendarUnavailable] = useState(false);
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth');
  const calendarRef = useRef<FullCalendar | null>(null);
  const calendarLocale = apiHeOrEn(i18n.language) === 'he' ? 'he' : 'en';
  const calendarDirection = isRtlLang(i18n.language) ? 'rtl' : 'ltr';

  const handleViewChange = (nextView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek') => {
    setView(nextView);
    const apiRef = calendarRef.current?.getApi();
    if (apiRef) {
      apiRef.changeView(nextView);
    }
  };

  useEffect(() => {
    if (!getAccessToken()) {
      setTasks([]);
      setCalendarEvents([]);
      setLoading(false);
      return;
    }
    loadTasks();
    loadCalendarEvents();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/tasks');
      setTasks(data || []);
    } catch (error: unknown) {
      logAxios(error, '[CalendarPage] Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      // Load Google Calendar events
      const { data } = await api.get<CalendarEvent[]>('/google-calendar/events', {
        params: { limit: 50 }, // Get more events for calendar view
      });
      setCalendarEvents(data || []);
      setCalendarUnavailable(false);
    } catch (error: unknown) {
      logAxios(error, '[CalendarPage] Failed to load google calendar events');
      const status = (error as any)?.response?.status;
      if (status === 404 || status === 401) {
        setCalendarUnavailable(true);
      }
      setCalendarEvents([]);
    }
  };

  // Convert tasks to FullCalendar events (overlay)
  const taskEvents: EventInput[] = tasks
    .filter((task) => task.due_date && !task.completed)
    .map((task) => ({
      id: `task-${task.id}`,
      title: `✓ ${task.title}`,
      start: task.due_date,
      end: task.due_date ? new Date(new Date(task.due_date).getTime() + 60 * 60 * 1000).toISOString() : undefined,
      backgroundColor: task.completed ? '#9CA3AF' : '#8B4513',
      borderColor: task.completed ? '#6B7280' : '#6B4513',
      extendedProps: {
        type: 'task',
        taskId: task.id,
        description: task.description,
        completed: task.completed,
        categoryId: task.category_id,
        roomId: task.room_id,
      },
    }));

  // Convert Google Calendar events to FullCalendar events
  const googleEvents: EventInput[] = calendarEvents.map((event) => ({
    id: `event-${event.id}`,
    title: event.summary || t('untitledEvent'),
    start: event.start,
    end: event.end || event.start,
    backgroundColor: '#3B82F6', // Blue for calendar events
    borderColor: '#2563EB',
    extendedProps: {
      type: 'calendar',
      eventId: event.id,
      description: event.description,
      location: event.location,
      htmlLink: event.htmlLink,
    },
  }));

  // Combine tasks and calendar events
  const events: EventInput[] = [...taskEvents, ...googleEvents];

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    // Create new task on date selection
    const title = window.prompt(tTasks('task_title') || t('promptTaskTitle'));
    if (title) {
      createTaskOnDate(title, selectInfo.start);
    }
    selectInfo.view.calendar.unselect();
  };

  const handleEventDrop = async (eventInfo: EventChangeArg) => {
    const taskId = Number(eventInfo.event.extendedProps.taskId);
    const newDate = eventInfo.event.start;

    if (!newDate || !Number.isFinite(taskId)) {
      return;
    }

    const promise = api.put(`/tasks/${taskId}`, {
      due_date: newDate.toISOString(),
    });

    showPromise(promise, {
      loading: tToast('updating_task_date'),
      success: tToast('task_date_updated'),
      error: tToast('task_date_update_failed'),
    });

    try {
      await promise;

      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, due_date: newDate.toISOString() } : task
        )
      );

      speak(t('speakTaskUpdated'));
    } catch (error: unknown) {
      logAxios(error, '[CalendarPage] Failed to update task date');
      // Revert event position
      eventInfo.revert();
      speak(t('speakTaskUpdateError'));
    }
  };

  const handleEventResize = async (eventInfo: EventChangeArg) => {
    const taskId = Number(eventInfo.event.extendedProps.taskId);
    const newEndDate = eventInfo.event.end;

    if (!newEndDate || !Number.isFinite(taskId)) {
      return;
    }

    const promise = api.put(`/tasks/${taskId}`, {
      due_date: newEndDate.toISOString(),
    });

    showPromise(promise, {
      loading: tToast('updating_task_date'),
      success: tToast('task_date_updated'),
      error: tToast('task_date_update_failed'),
    });

    try {
      await promise;

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, due_date: newEndDate.toISOString() } : task
        )
      );

      speak(t('speakTaskUpdated'));
    } catch (error: unknown) {
      logAxios(error, '[CalendarPage] Failed to resize/update task date');
      eventInfo.revert();
      speak(t('speakTaskUpdateError'));
    }
  };

  const handleEventClick = async (clickInfo: any) => {
    const eventType = clickInfo.event.extendedProps.type;
    
    if (eventType === 'task') {
      // Task clicked - show info and offer to create calendar event
      const taskId = clickInfo.event.extendedProps.taskId;
      const task = tasks.find((tk) => tk.id === taskId);
      const description = clickInfo.event.extendedProps.description || '';
      
      if (task && task.due_date) {
        const shouldCreateEvent = window.confirm(
          `${t('taskPrefix')}: ${clickInfo.event.title}\n${description ? `${t('descriptionPrefix')}: ${description}\n` : ''}\n${t('confirmCreateGoogleFromTask')}`
        );
        
        if (shouldCreateEvent) {
          await createEventFromTask(task);
        }
      } else {
        showInfo(`${clickInfo.event.title}${description ? `: ${description}` : ''}`);
      }
    } else if (eventType === 'calendar') {
      // Calendar event clicked - offer to create task
      const eventData = {
        summary: clickInfo.event.title,
        description: clickInfo.event.extendedProps.description || '',
        start: clickInfo.event.start?.toISOString() || '',
        end: clickInfo.event.end?.toISOString() || '',
      };
      
      const shouldCreate = window.confirm(t('createTaskFromEvent', { summary: eventData.summary }));
      
      if (shouldCreate) {
        await createTaskFromEvent(eventData);
      }
    }
  };

  const createTaskFromEvent = async (event: { summary: string; description?: string; start: string; end?: string }) => {
    const promise = api.post('/tasks', {
      title: event.summary,
      description: event.description || '',
      due_date: event.start,
    });

    showPromise(promise, {
      loading: tToast('creating_task'),
      success: tToast('task_created'),
      error: tToast('task_creation_failed'),
    });

    try {
      await promise;
      await loadTasks();
      speak(t('speakTaskCreatedFromEvent'));
    } catch (error: unknown) {
      logAxios(error, '[CalendarPage] Failed to create task from event');
      speak(tToast('task_creation_failed'));
    }
  };

  // Create Google Calendar event from task (optional feature)
  const createEventFromTask = async (task: Task) => {
    if (!task.due_date) {
      showError(t('noTaskDueDate'));
      return;
    }

    try {
      // Create event for this specific task
      const promise = api.post(`/google-calendar/sync-tasks?task_id=${task.id}`);

      showPromise(promise, {
        loading: t('creatingGoogleEvent'),
        success: t('googleEventCreated'),
        error: t('googleEventCreateFail'),
      });

      await promise;
      await loadCalendarEvents(); // Reload calendar events
      speak(t('googleEventCreated'));
    } catch (error: unknown) {
      logAxios(error, '[CalendarPage] Failed to create event from task');
      const detail = axios.isAxiosError(error)
        ? error.response?.data?.detail
        : undefined;
      showError(detail || t('failedCreateEvent'));
      speak(t('speakEventCreateError'));
    }
  };

  const createTaskOnDate = async (title: string, date: Date) => {
    const promise = api.post('/tasks', {
      title,
      due_date: date.toISOString(),
    });

    showPromise(promise, {
      loading: tToast('creating_task'),
      success: tToast('task_created'),
      error: tToast('task_creation_failed'),
    });

    try {
      await promise;
      await loadTasks();
      speak(t('speakTaskCreated'));
    } catch (error: unknown) {
      logAxios(error, '[CalendarPage] Failed to create task');
      speak(tToast('task_creation_failed'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">{tCommon('loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-cream dark:bg-dark-bg min-h-screen">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
            {t('title')}
          </h1>
          <div className="flex gap-2 flex-wrap">
            {calendarUnavailable && (
              <span className="text-sm text-amber-600 dark:text-amber-300">
                {t('noCalendarConnected')}
              </span>
            )}
            <button
              onClick={() => handleViewChange('dayGridMonth')}
              className={`px-4 py-2 rounded-lg ${
                view === 'dayGridMonth' 
                  ? 'bg-mint text-white' 
                  : 'bg-gray-200 dark:bg-dark-surface text-gray-700 dark:text-dark-text'
              }`}
            >
              {t('month')}
            </button>
            <button
              onClick={() => handleViewChange('timeGridWeek')}
              className={`px-4 py-2 rounded-lg ${
                view === 'timeGridWeek' ? 'bg-mint text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('week')}
            </button>
            <button
              onClick={() => handleViewChange('timeGridDay')}
              className={`px-4 py-2 rounded-lg ${
                view === 'timeGridDay' ? 'bg-mint text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('day')}
            </button>
            <button
              onClick={() => handleViewChange('listWeek')}
              className={`px-4 py-2 rounded-lg ${
                view === 'listWeek' ? 'bg-mint text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('list')}
            </button>
          </div>
        </div>

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          locales={[heLocale]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: '',
          }}
          locale={calendarLocale}
          direction={calendarDirection}
          editable={true}
          selectable={true}
          droppable={true}
          events={events}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClick={handleEventClick}
          height="auto"
          eventDisplay="block"
          dayMaxEvents={true}
          moreLinkClick="popover"
          eventColor="#8B4513"
          eventTextColor="#FFFFFF"
          datesSet={(arg) => {
            const nextView = arg.view.type as 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';
            if (nextView !== view) {
              setView(nextView);
            }
          }}
          businessHours={{
            daysOfWeek: [0, 1, 2, 3, 4, 5], // Sunday to Thursday
            startTime: '08:00',
            endTime: '20:00',
          }}
        />
      </div>
    </div>
  );
};

export default CalendarPage;
