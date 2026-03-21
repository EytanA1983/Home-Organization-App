import { useTranslation } from "react-i18next";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  room_id?: string;
  scope?: string;
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  /** Layout direction for the row (true = RTL for Hebrew/Arabic UI). */
  rtl?: boolean;
}

const TaskItem = ({ task, onToggle, rtl = true }: TaskItemProps) => {
  const { t } = useTranslation("dates");
  return (
    <div className="taskCard" dir={rtl ? "rtl" : "ltr"}>
      <button
        className={`taskCheck ${task.completed ? "taskCheckDone" : ""}`}
        onClick={() => onToggle(task.id)}
      >
        {task.completed ? "✓" : ""}
      </button>

      <div>
        <div
          className={`taskTitle ${
            task.completed ? "taskTitleDone" : ""
          }`}
        >
          {task.title}
        </div>

        <div className="taskMeta">
          {task.room_id && (
            <span className="chip">🏡 {task.room_id}</span>
          )}
          {task.scope && (
            <span
              className={`chip ${
                task.scope === "today" ? "chipAccent" : ""
              }`}
            >
              {task.scope === "today" ? t("today") : task.scope}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
