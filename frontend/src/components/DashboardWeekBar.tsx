import { useTranslation } from "react-i18next";
import { isRtlLang } from "../utils/localeDirection";

export type DashboardWeekBarProps = {
  selectedDayIndex: number;
  onSelectDay: (dayIndex: number) => void;
  /** 0 = Sunday … 6 = Saturday (Date.getDay) */
  todayDayIndex?: number;
};

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export default function DashboardWeekBar({
  selectedDayIndex,
  onSelectDay,
  todayDayIndex = new Date().getDay(),
}: DashboardWeekBarProps) {
  const { t: td, i18n } = useTranslation("dashboard");
  const { t: tDates } = useTranslation("dates");
  const rtl = isRtlLang(i18n.language);

  return (
    <section
      className="dashboard-week-bar"
      aria-label={td("weekBarAria")}
    >
      <p className="dashboard-week-bar__hint">{td("weekBarHint")}</p>
      <div
        className="dashboard-week-bar__track"
        role="tablist"
        dir={rtl ? "rtl" : "ltr"}
      >
        {DAY_KEYS.map((key, index) => {
          const isSelected = index === selectedDayIndex;
          const isToday = index === todayDayIndex;
          const label = tDates(key);
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`dashboard-week-bar__pill${isSelected ? " dashboard-week-bar__pill--selected" : ""}${isToday ? " dashboard-week-bar__pill--today" : ""}`}
              onClick={() => onSelectDay(index)}
            >
              <span className="dashboard-week-bar__pill-label">{label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
