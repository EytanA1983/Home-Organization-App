/**
 * Calendar Page Component
 * FullCalendar view for tasks with week/month views and drag & drop
 */
import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { EventInput, DateSelectArg, EventChangeArg } from '@fullcalendar/core';
import api from '../api';
import { useTranslation } from 'react-i18next';
import { useVoice } from '../hooks/useVoice';
import { showSuccess, showError, showPromise } from '../utils/toast';

interface Task {
  id: number;
  title: string;
  description?: string;
  due_date?: string;
  completed: boolean;
  category_id?: number;
  room_id?: number;
}

export const CalendarPage: React.FC = () => {
  const { t } = useTranslation();
  const { speak } = useVoice();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/tasks');
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Convert tasks to FullCalendar events
  const events: EventInput[] = tasks
    .filter((task) => task.due_date && !task.completed)
    .map((task) => ({
      id: task.id.toString(),
      title: task.title,
      start: task.due_date,
      end: task.due_date ? new Date(new Date(task.due_date).getTime() + 60 * 60 * 1000).toISOString() : undefined,
      backgroundColor: task.completed ? '#9CA3AF' : '#8B4513',
      borderColor: task.completed ? '#6B7280' : '#6B4513',
      extendedProps: {
        taskId: task.id,
        description: task.description,
        completed: task.completed,
        categoryId: task.category_id,
        roomId: task.room_id,
      },
    }));

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    // Create new task on date selection
    const title = window.prompt(t('tasks:task_title') || 'כותרת המשימה');
    if (title) {
      createTaskOnDate(title, selectInfo.start);
    }
    selectInfo.view.calendar.unselect();
  };

  const handleEventDrop = async (eventInfo: EventChangeArg) => {
    const taskId = parseInt(eventInfo.event.id);
    const newDate = eventInfo.event.start;

    if (!newDate) {
      return;
    }

    const promise = api.put(`/api/tasks/${taskId}`, {
      due_date: newDate.toISOString(),
    });

    showPromise(
      promise,
      {
        loading: t('toast:updating_task_date') || 'מעדכן תאריך משימה...',
        success: t('toast:task_date_updated') || 'תאריך המשימה עודכן בהצלחה',
        error: t('toast:task_date_update_failed') || 'שגיאה בעדכון תאריך המשימה',
      },
      t
    );

    try {
      await promise;

      // Update local state
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, due_date: newDate.toISOString() } : task
        )
      );

      speak('תאריך המשימה עודכן');
    } catch (error) {
      console.error('Failed to update task date:', error);
      // Revert event position
      eventInfo.revert();
      speak('שגיאה בעדכון תאריך');
    }
  };

  const handleEventResize = async (eventInfo: EventChangeArg) => {
    const taskId = parseInt(eventInfo.event.id);
    const newEndDate = eventInfo.event.end;

    if (!newEndDate) {
      return;
    }

    const promise = api.put(`/api/tasks/${taskId}`, {
      due_date: newEndDate.toISOString(),
    });

    showPromise(
      promise,
      {
        loading: t('toast:updating_task_date') || 'מעדכן תאריך משימה...',
        success: t('toast:task_date_updated') || 'תאריך המשימה עודכן בהצלחה',
        error: t('toast:task_date_update_failed') || 'שגיאה בעדכון תאריך המשימה',
      },
      t
    );

    try {
      await promise;

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, due_date: newEndDate.toISOString() } : task
        )
      );

      speak('תאריך המשימה עודכן');
    } catch (error) {
      console.error('Failed to update task date:', error);
      eventInfo.revert();
      speak('שגיאה בעדכון תאריך');
    }
  };

  const handleEventClick = (clickInfo: any) => {
    const taskId = clickInfo.event.id;
    const description = clickInfo.event.extendedProps.description || '';
    // Show task info in toast
    showInfo(
      `${clickInfo.event.title}${description ? `: ${description}` : ''}`,
      t
    );
  };

  const createTaskOnDate = async (title: string, date: Date) => {
    const promise = api.post('/api/tasks', {
      title,
      due_date: date.toISOString(),
    });

    showPromise(
      promise,
      {
        loading: t('toast:creating_task') || 'יוצר משימה...',
        success: t('toast:task_created') || 'משימה נוצרה בהצלחה',
        error: t('toast:task_creation_failed') || 'שגיאה ביצירת משימה',
      },
      t
    );

    try {
      await promise;
      await loadTasks();
      speak('משימה נוצרה');
    } catch (error) {
      console.error('Failed to create task:', error);
      speak('שגיאה ביצירת משימה');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">{t('common:loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-cream dark:bg-dark-bg min-h-screen">
      <div className="bg-white dark:bg-dark-surface rounded-lg shadow-lg p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-dark-text">
            📅 {t('calendar:title')}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setView('dayGridMonth')}
              className={`px-4 py-2 rounded-lg ${
                view === 'dayGridMonth' 
                  ? 'bg-mint text-white' 
                  : 'bg-gray-200 dark:bg-dark-surface text-gray-700 dark:text-dark-text'
              }`}
            >
              {t('calendar:month')}
            </button>
            <button
              onClick={() => setView('timeGridWeek')}
              className={`px-4 py-2 rounded-lg ${
                view === 'timeGridWeek' ? 'bg-mint text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('calendar:week')}
            </button>
            <button
              onClick={() => setView('timeGridDay')}
              className={`px-4 py-2 rounded-lg ${
                view === 'timeGridDay' ? 'bg-mint text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('calendar:day')}
            </button>
            <button
              onClick={() => setView('listWeek')}
              className={`px-4 py-2 rounded-lg ${
                view === 'listWeek' ? 'bg-mint text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {t('calendar:list')}
            </button>
          </div>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={view}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          locale="he"
          direction="rtl"
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
