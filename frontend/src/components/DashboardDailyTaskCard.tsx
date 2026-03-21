import type { Task } from "../app/types";
import { useTranslation } from "react-i18next";

export type DashboardDailyTaskCardProps = {
  task: Task;
  categoryLabel: string;
  isExiting: boolean;
  onCompleteClick: () => void;
  onExitAnimationEnd: () => void;
};

export default function DashboardDailyTaskCard({
  task,
  categoryLabel,
  isExiting,
  onCompleteClick,
  onExitAnimationEnd,
}: DashboardDailyTaskCardProps) {
  const { t: td } = useTranslation("dashboard");

  const handleAnimationEnd = (e: React.AnimationEvent<HTMLDivElement>) => {
    const name = e.animationName || "";
    if (name.includes("dashboardTaskExit")) {
      onExitAnimationEnd();
    }
  };

  return (
    <div
      className={`dashboard-daily-task-card${isExiting ? " dashboard-daily-task-card--exiting" : ""}`}
      onAnimationEnd={handleAnimationEnd}
    >
      {isExiting ? (
        <span className="dashboard-daily-task-card__sparkles" aria-hidden="true">
          <span className="dashboard-daily-task-card__sparkle" />
          <span className="dashboard-daily-task-card__sparkle" />
          <span className="dashboard-daily-task-card__sparkle" />
        </span>
      ) : null}
      <div className="dashboard-daily-task-card__body">
        <p className="dashboard-daily-task-card__title">{task.title}</p>
        <span className="dashboard-daily-task-card__tag">{categoryLabel}</span>
      </div>
      <button
        type="button"
        className="dashboard-daily-task-card__check"
        aria-label={td("markCompleteAria", { title: task.title })}
        onClick={onCompleteClick}
        disabled={isExiting}
      >
        <span className="dashboard-daily-task-card__circle" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="dashboard-daily-task-card__check-icon" aria-hidden="true">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 12.5l4 4 8-9"
            />
          </svg>
        </span>
      </button>
    </div>
  );
}
