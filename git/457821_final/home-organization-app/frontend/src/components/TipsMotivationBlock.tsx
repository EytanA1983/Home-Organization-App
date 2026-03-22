import { useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiHeOrEn, isRtlLang } from "../utils/localeDirection";
import { useAuth } from "../hooks/useAuth";
import { useTasks } from "../hooks/useTasks";
import { getDailyInspiration, getDailyTip } from "../api";
import type { DailyInspirationRead, DailyTipRead } from "../schemas/dashboard";
import "../styles/dashboard-daily.css";

/**
 * Inspirational slogan, static “tip of the day”, gentle progress copy, plus API-driven
 * daily inspiration + tip. Rendered only on the Tips (content hub) route — not on other pages.
 */
export default function TipsMotivationBlock() {
  const { t, i18n } = useTranslation("layout");
  const { t: td } = useTranslation("dashboard");
  const rtl = isRtlLang(i18n.language);
  const { user, isAuthenticated } = useAuth();

  const scopedUserId = useMemo(() => {
    const id = user?.id;
    if (typeof id === "number" && Number.isFinite(id)) return id;
    if (typeof id === "string") {
      const n = Number.parseInt(id, 10);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  }, [user?.id]);

  const { data: completedTasks = [] } = useTasks(
    { completed: true },
    { enabled: isAuthenticated && scopedUserId != null },
  );

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
    queryKey: ["dashboard", "daily-inspiration", calendarDayKey, langParam, scopedUserId],
    queryFn: async () => {
      const res = await getDailyInspiration(langParam);
      return res.data;
    },
    enabled: scopedUserId != null,
    staleTime: dayMs,
    gcTime: dayMs * 2,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  const {
    data: dailyTipApi,
    isPending: dailyTipPending,
    isError: dailyTipError,
  } = useQuery<DailyTipRead>({
    queryKey: ["dashboard", "daily-tip", calendarDayKey, langParam, scopedUserId],
    queryFn: async () => {
      const res = await getDailyTip(langParam);
      return res.data;
    },
    enabled: scopedUserId != null,
    staleTime: dayMs,
    gcTime: dayMs * 2,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
  });

  const dailyTipStatic = t("dailyTipText");

  return (
    <div className="tips-motivation-block" style={{ display: "grid", gap: 18 }}>
      <section
        className="brandStrip wow-card wow-pad wow-fadeIn"
        dir={rtl ? "rtl" : "ltr"}
        aria-label={t("brandAriaLabel")}
      >
        <div className="brandStripTop">
          <div>
            <div className="wow-title brandSlogan">{t("brandTitle")}</div>
            <p className="wow-muted brandSubline">{t("brandSubline")}</p>
          </div>
        </div>

        <div className="brandMetaRow">
          <div className="brandMetaCard">
            <span className="wow-chip wow-chipAccent">{t("dailyTipLabel")}</span>
            <p className="brandMetaText">{dailyTipStatic}</p>
          </div>
          <div className="brandMetaCard">
            <span className="wow-chip">{t("progressSoft")}</span>
            <p className="brandMetaText">{t("progressText", { count: completedTasks.length })}</p>
          </div>
        </div>
      </section>

      <div
        className="dashboard-daily-insights"
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
        }}
        dir={rtl ? "rtl" : "ltr"}
      >
        <div className="daily-card" aria-live="polite">
          <h2>{td("dailyInspirationTitle")}</h2>
          {inspirationPending && !dailyInspiration ? (
            <p className="task-title">{td("loading")}</p>
          ) : inspirationError ? (
            <p className="wow-muted">{td("inspirationLoadError")}</p>
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
          {dailyTipPending && !dailyTipApi ? (
            <p className="task-title">{td("loading")}</p>
          ) : dailyTipError ? (
            <p className="wow-muted">{td("tipLoadError")}</p>
          ) : (
            <p className="task-title" style={{ fontWeight: 500, lineHeight: 1.5 }}>
              {dailyTipApi?.tip}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
