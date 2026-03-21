import { useEffect, useRef, useState } from "react";
import "./AppLayout.css";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { useTasks } from "../hooks/useTasks";
import { hasTokens } from "../utils/tokenStorage";
import { ROUTES, getCategoryRoute } from "../utils/routes";
import { Modal } from "./Modal";
import { VisionBoardModal } from "./VisionBoardModal";
import { LanguageSwitcher } from "./LanguageSwitcher";
import type { TaskRead } from "../schemas/task";
import { isRtlLang } from "../utils/localeDirection";

type ShellTab = {
  id: string;
  labelKey: string;
  path: string;
  /** Extra paths that keep this tab highlighted (e.g. journal under Emotional category). */
  aliasPaths?: readonly string[];
};

const LOCKED_TABS: ShellTab[] = [
  { id: "locked-home", labelKey: "today", path: ROUTES.HOME },
  { id: "locked-categories", labelKey: "categories", path: ROUTES.CATEGORIES },
  { id: "locked-tasks", labelKey: "tasks", path: ROUTES.ALL_TASKS },
  { id: "locked-calendar", labelKey: "calendar", path: ROUTES.CALENDAR },
  { id: "locked-emotional", labelKey: "emotional", path: getCategoryRoute("emotional"), aliasPaths: [ROUTES.EMOTIONAL_JOURNAL] },
  { id: "locked-content", labelKey: "contentHub", path: ROUTES.CONTENT_HUB },
];

const CORE_TABS: ShellTab[] = [
  { id: "core-dashboard", labelKey: "dashboard", path: ROUTES.DASHBOARD },
  { id: "core-categories", labelKey: "categories", path: ROUTES.CATEGORIES },
  { id: "core-calendar", labelKey: "calendar", path: ROUTES.CALENDAR },
  { id: "core-emotional", labelKey: "emotional", path: getCategoryRoute("emotional"), aliasPaths: [ROUTES.EMOTIONAL_JOURNAL] },
  { id: "core-content", labelKey: "contentHub", path: ROUTES.CONTENT_HUB },
];

const FOCUS_PRESETS = [5, 10, 15, 25];

const formatTimer = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

export default function AppLayout() {
  const { i18n } = useTranslation();
  const { t } = useTranslation("layout");
  const { user, logout } = useAuth();
  const isAuthenticated = hasTokens();
  const { data: completedTasks = [] } = useTasks({ completed: true }, { enabled: isAuthenticated });
  const { data: pendingTasks = [] } = useTasks({ completed: false }, { enabled: isAuthenticated });
  const location = useLocation();
  const navigate = useNavigate();
  const tabsRef = useRef<HTMLElement | null>(null);
  const [isVisionBoardOpen, setIsVisionBoardOpen] = useState(false);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [durationMin, setDurationMin] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [lastTimerDoneAt, setLastTimerDoneAt] = useState<number | null>(null);
  const coreLang = (i18n.language || "he").split("-")[0];
  const isRtl = isRtlLang(i18n.language);
  const visionApiLang = coreLang === "he" ? "he" : "en";
  const dailyTip = t("dailyTipText");

  const getTabLabel = (labelKey: string): string => t(labelKey);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;

    const active = el.querySelector(".roomTabActive") as HTMLElement | null;
    if (!active) return;

    active.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [location.pathname]);

  useEffect(() => {
    if (!isTimerRunning) return;
    const timerId = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timerId);
          setIsTimerRunning(false);
          setLastTimerDoneAt(Date.now());
          try {
            const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            gain.gain.setValueAtTime(0.001, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.36);
          } catch {
            // Ignore audio failures (browser policy / unsupported context).
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [isTimerRunning]);

  useEffect(() => {
    document.documentElement.lang = coreLang;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [coreLang, isRtl]);

  const selectedTask = pendingTasks.find((task: TaskRead) => String(task.id) === selectedTaskId);
  const progressPct =
    totalSeconds > 0 ? Math.min(100, Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100)) : 0;
  const displayedSeconds = totalSeconds > 0 ? secondsLeft : durationMin * 60;

  const startFocusTimer = () => {
    const total = durationMin * 60;
    setTotalSeconds(total);
    setSecondsLeft(total);
    setLastTimerDoneAt(null);
    setIsTimerRunning(true);
  };

  const stopFocusTimer = () => {
    setIsTimerRunning(false);
  };

  const resetFocusTimer = () => {
    setIsTimerRunning(false);
    setSecondsLeft(0);
    setTotalSeconds(0);
    setLastTimerDoneAt(null);
  };

  const isShellTabActive = (tab: ShellTab) => {
    const p = location.pathname;
    if (tab.aliasPaths?.some((a) => p === a || p.startsWith(`${a}/`))) {
      return true;
    }
    const path = tab.path;
    if (path === ROUTES.DASHBOARD) {
      return p === ROUTES.HOME || p === ROUTES.DASHBOARD;
    }
    if (path === ROUTES.CATEGORIES) {
      return (
        p === ROUTES.CATEGORIES ||
        p.startsWith(`${ROUTES.CATEGORIES}/`) ||
        p === ROUTES.ROOMS ||
        p.startsWith(`${ROUTES.ROOMS}/`)
      );
    }
    return p === path || p.startsWith(`${path}/`);
  };

  return (
    <div className="appPageBg" dir={isRtl ? "rtl" : "ltr"}>
      <div className="app-topbar">
        <div className="app-topbar-inner">
          {/* Language toggle - left side */}
          <div className="app-language-toggle">
            <LanguageSwitcher mode="compact" className="pill-btn" />
          </div>

          {/* Logo - center */}
          <div className="app-logo">
            <img className="brandLogo" src="/branding/logo.png" alt={t("logoAlt")} />
          </div>

          {/* Actions - right side */}
          <div className="app-actions">
            {user && (
              <>
                <button
                  type="button"
                  className="pill-btn pill-btn-accent"
                  onClick={() => setIsVisionBoardOpen(true)}
                >
                  {t("visionBoardBtn")}
                </button>
                <button type="button" className="pill-btn" onClick={() => setIsFocusModalOpen(true)}>
                  {t("focusTimerBtn")}
                </button>
                <button type="button" onClick={logout} className="pill-btn">
                  {t("logout")}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="roomsNavWrap">
        <div className="app-container" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <nav ref={tabsRef} className="roomsTabs" aria-label={t("mainNavigation")}>
            {isAuthenticated
              ? CORE_TABS.map((tab) => (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`roomTab ${isShellTabActive(tab) ? "roomTabActive" : ""}`}
                  >
                    {getTabLabel(tab.labelKey)}
                  </Link>
                ))
              : LOCKED_TABS.map((tab) => {
                  const isActive = isShellTabActive(tab);
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`roomTab roomTabLocked ${isActive ? "roomTabActive" : ""}`}
                      onClick={() => navigate(ROUTES.LOGIN, { state: { from: tab.path } })}
                      title={t("loginRequired")}
                    >
                      🔒 {getTabLabel(tab.labelKey)}
                    </button>
                  );
                })}
          </nav>
        </div>
      </div>

      <VisionBoardModal
        isOpen={isVisionBoardOpen}
        onClose={() => setIsVisionBoardOpen(false)}
        apiLang={visionApiLang}
      />

      {isFocusModalOpen && (
        <Modal title={t("focusTitle")} onClose={() => setIsFocusModalOpen(false)}>
          <div className="focusTimerWrap" dir={isRtl ? "rtl" : "ltr"}>
            <p className="focusTimerIntro">
              {t("focusIntro")}
            </p>

            <label className="focusTimerLabel" htmlFor="focus-task-select">{t("focusTask")}</label>
            <select
              id="focus-task-select"
              className="focusTimerSelect"
              value={selectedTaskId}
              onChange={(event) => setSelectedTaskId(event.target.value)}
              disabled={isTimerRunning}
            >
              <option value="">{t("focusManual")}</option>
              {pendingTasks.slice(0, 20).map((task: TaskRead) => (
                <option key={task.id} value={String(task.id)}>
                  {task.title}
                </option>
              ))}
            </select>

            <div className="focusTimerPresets" aria-label={t("focusDuration")}>
              {FOCUS_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`focusPresetBtn ${durationMin === mins ? "focusPresetBtnActive" : ""}`}
                  onClick={() => setDurationMin(mins)}
                  disabled={isTimerRunning}
                >
                  {t("timerMinutes", { mins })}
                </button>
              ))}
            </div>

            <div className="focusTimerClock">{formatTimer(displayedSeconds)}</div>
            <div className="focusTimerProgress">
              <div className="focusTimerProgressBar" style={{ width: `${progressPct}%` }} />
            </div>

            <p className="focusTimerMeta">
              {selectedTask
                ? t("focusSelected", { name: selectedTask.title })
                : t("focusHint")}
            </p>

            {lastTimerDoneAt && (
              <p className="focusTimerSuccess">{t("focusSuccess")}</p>
            )}

            <div className="focusTimerActions">
              {!isTimerRunning ? (
                <button type="button" className="wow-btn wow-btnPrimary" onClick={startFocusTimer}>
                  {t("startTimer")}
                </button>
              ) : (
                <button type="button" className="wow-btn wow-btnPrimary" onClick={stopFocusTimer}>
                  {t("stopTimer")}
                </button>
              )}
              <button type="button" className="wow-btn" onClick={resetFocusTimer}>
                {t("reset")}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <div className="app-container">
        <section className="brandStrip wow-card wow-pad wow-fadeIn" dir={isRtl ? "rtl" : "ltr"} aria-label={t("brandAriaLabel")}>
          <div className="brandStripTop">
            <div>
              <div className="wow-title brandSlogan">{t("brandTitle")}</div>
              <p className="wow-muted brandSubline">
                {t("brandSubline")}
              </p>
            </div>
          </div>

          <div className="brandMetaRow">
            <div className="brandMetaCard">
              <span className="wow-chip wow-chipAccent">{t("dailyTipLabel")}</span>
              <p className="brandMetaText">{dailyTip}</p>
            </div>
            <div className="brandMetaCard">
              <span className="wow-chip">{t("progressSoft")}</span>
              <p className="brandMetaText">
                {t("progressText", { count: completedTasks.length })}
              </p>
            </div>
          </div>
        </section>

        <Outlet />
      </div>

      <footer className="appFooter" dir={isRtl ? "rtl" : "ltr"} aria-label={t("footerAria")} />
    </div>
  );
}
