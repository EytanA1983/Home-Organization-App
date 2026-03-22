import { useEffect, useMemo, useRef, useState } from "react";
import "./AppLayout.css";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { useTasks } from "../hooks/useTasks";
import { hasTokens } from "../utils/tokenStorage";
import { ROUTES } from "../utils/routes";
import { Modal } from "./Modal";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { CategoriesNavTab } from "./CategoriesNavTab";
import type { TaskRead } from "../schemas/task";
import { isRtlLang } from "../utils/localeDirection";
import {
  FOCUS_TASK_PREFIX_MAX_LEN,
  filterTasksByTitlePrefix,
  sanitizeFocusTaskPrefix,
  sortTasksByTitle,
} from "../utils/taskTitlePrefixMatch";

type ShellTab = {
  id: string;
  labelKey: string;
  path: string;
  /** Extra paths that keep this tab highlighted. */
  aliasPaths?: readonly string[];
};

const LOCKED_TABS: ShellTab[] = [
  { id: "locked-home", labelKey: "today", path: ROUTES.HOME },
  { id: "locked-categories", labelKey: "categories", path: ROUTES.CATEGORIES },
  { id: "locked-inventory", labelKey: "inventory", path: ROUTES.INVENTORY },
  { id: "locked-tasks", labelKey: "tasks", path: ROUTES.ALL_TASKS },
  { id: "locked-vision", labelKey: "visionScheduleTab", path: ROUTES.MY_VISION_BOARD },
];

const CORE_TABS: ShellTab[] = [
  { id: "core-dashboard", labelKey: "dashboard", path: ROUTES.DASHBOARD },
  { id: "core-categories", labelKey: "categories", path: ROUTES.CATEGORIES },
  { id: "core-inventory", labelKey: "inventory", path: ROUTES.INVENTORY },
  { id: "core-vision", labelKey: "visionScheduleTab", path: ROUTES.MY_VISION_BOARD },
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
  const { data: pendingTasks = [] } = useTasks({ completed: false }, { enabled: isAuthenticated });
  const location = useLocation();
  const navigate = useNavigate();
  const tabsRef = useRef<HTMLElement | null>(null);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [taskPrefix, setTaskPrefix] = useState("");
  const focusPrefixInputRef = useRef<HTMLInputElement | null>(null);
  const [durationMin, setDurationMin] = useState(5);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [lastTimerDoneAt, setLastTimerDoneAt] = useState<number | null>(null);
  const coreLang = (i18n.language || "he").split("-")[0];
  const isRtl = isRtlLang(i18n.language);
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
    if (!isFocusModalOpen) return;
    setTaskPrefix("");
    const id = window.setTimeout(() => focusPrefixInputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [isFocusModalOpen]);

  useEffect(() => {
    document.documentElement.lang = coreLang;
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
  }, [coreLang, isRtl]);

  const sortedPendingTasks = useMemo(() => sortTasksByTitle(pendingTasks), [pendingTasks]);
  const filteredFocusTasks = useMemo(
    () => filterTasksByTitlePrefix(sortedPendingTasks, taskPrefix),
    [sortedPendingTasks, taskPrefix],
  );

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
    if (path === ROUTES.MY_VISION_BOARD) {
      return p === path || p.startsWith(`${path}/`);
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
              ? CORE_TABS.map((tab) =>
                  tab.path === ROUTES.CATEGORIES ? (
                    <CategoriesNavTab
                      key={tab.id}
                      authenticated
                      tabLabel={getTabLabel(tab.labelKey)}
                      isActive={isShellTabActive(tab)}
                    />
                  ) : (
                    <Link
                      key={tab.id}
                      to={tab.path}
                      className={`roomTab ${isShellTabActive(tab) ? "roomTabActive" : ""}`}
                    >
                      {getTabLabel(tab.labelKey)}
                    </Link>
                  ),
                )
              : LOCKED_TABS.map((tab) => {
                  const isActive = isShellTabActive(tab);
                  if (tab.path === ROUTES.CATEGORIES) {
                    return (
                      <CategoriesNavTab
                        key={tab.id}
                        authenticated={false}
                        tabLabel={getTabLabel(tab.labelKey)}
                        isActive={isActive}
                      />
                    );
                  }
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

      {isFocusModalOpen && (
        <Modal title={t("focusTitle")} onClose={() => setIsFocusModalOpen(false)}>
          <div className="focusTimerWrap" dir={isRtl ? "rtl" : "ltr"}>
            <p className="focusTimerIntro">
              {t("focusIntro")}
            </p>

            <div className="focusTaskPicker">
              <label className="focusTimerLabel" htmlFor="focus-task-prefix">
                {t("focusTask")}
              </label>
              <p className="focusTaskPickerHint" id="focus-task-prefix-hint">
                {t("focusPrefixHint")}
              </p>
              <div className="focusTaskPrefixRow">
                <input
                  ref={focusPrefixInputRef}
                  id="focus-task-prefix"
                  type="text"
                  className="focusTaskPrefixInput"
                  value={taskPrefix}
                  maxLength={FOCUS_TASK_PREFIX_MAX_LEN}
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="text"
                  placeholder={t("focusPrefixPlaceholder")}
                  aria-describedby="focus-task-prefix-hint"
                  disabled={isTimerRunning}
                  onChange={(e) =>
                    setTaskPrefix(sanitizeFocusTaskPrefix(e.target.value, FOCUS_TASK_PREFIX_MAX_LEN))
                  }
                />
                <button
                  type="button"
                  className="focusTaskPrefixClear"
                  onClick={() => setTaskPrefix("")}
                  disabled={isTimerRunning || !taskPrefix}
                >
                  {t("focusClearPrefix")}
                </button>
              </div>
              <div
                className="focusTaskList"
                role="listbox"
                aria-label={t("focusTaskListAria")}
                id="focus-task-listbox"
              >
                <button
                  type="button"
                  role="option"
                  aria-selected={selectedTaskId === ""}
                  className={`focusTaskRow ${selectedTaskId === "" ? "focusTaskRowActive" : ""}`}
                  disabled={isTimerRunning}
                  onClick={() => setSelectedTaskId("")}
                >
                  <span className="focusTaskRowTitle">{t("focusManual")}</span>
                </button>
                {filteredFocusTasks.map((task: TaskRead) => {
                  const roomName = task.room?.name?.trim();
                  const catName = task.category?.name?.trim();
                  const sub = [roomName, catName].filter(Boolean).join(" · ");
                  const idStr = String(task.id);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      role="option"
                      aria-selected={selectedTaskId === idStr}
                      className={`focusTaskRow ${selectedTaskId === idStr ? "focusTaskRowActive" : ""}`}
                      disabled={isTimerRunning}
                      onClick={() => setSelectedTaskId(idStr)}
                    >
                      <span className="focusTaskRowTitle">{task.title}</span>
                      {sub ? <span className="focusTaskRowSub">{sub}</span> : null}
                    </button>
                  );
                })}
              </div>
              {filteredFocusTasks.length === 0 && sortedPendingTasks.length > 0 ? (
                <p className="focusTaskNoMatches" role="status">
                  {t("focusNoMatches")}
                </p>
              ) : null}
              {sortedPendingTasks.length === 0 ? (
                <p className="focusTaskNoMatches" role="status">
                  {t("focusNoOpenTasks")}
                </p>
              ) : null}
            </div>

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
        <Outlet />
      </div>

      <footer className="appFooter" dir={isRtl ? "rtl" : "ltr"} aria-label={t("footerAria")} />
    </div>
  );
}
