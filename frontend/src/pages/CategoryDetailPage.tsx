import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { useTranslation } from "react-i18next";
import { useRooms } from "../hooks/useRooms";
import { useTasks } from "../hooks/useTasks";
import { ROUTES } from "../utils/routes";
import { isRtlLang } from "../utils/localeDirection";
import { getLocalizedRoomTitle, inferRoomCategory } from "../utils/roomLocalization";
import type { TaskRead } from "../schemas/task";
import {
  findLegacyRoomForProductCategory,
  getProductCategoryEmoji,
  isProductCategoryKey,
  type ProductCategoryKey,
} from "../domain/productCategories";

type RecommendedVideo = {
  videoId: string | null;
  title: string | null;
  url: string | null;
  thumbnail: string | null;
};

type RoomTask = {
  id: number;
  title: string;
  completed: boolean;
};

/**
 * Category detail — UI uses canonical category keys; tasks still load via legacy `room_id` when mappable.
 */
export default function CategoryDetailPage() {
  const { i18n, t: tRoom } = useTranslation("room");
  const { t: tRooms } = useTranslation("rooms");
  const { t: tPc } = useTranslation("productCategories");
  const rtl = isRtlLang(i18n.language);
  const videoLang = (i18n.language || "he").split("-")[0] === "he" ? "he" : "en";
  const { categoryKey: categoryKeyRaw } = useParams<{ categoryKey: string }>();
  const categoryKey = categoryKeyRaw as ProductCategoryKey | undefined;
  const validKey = categoryKey && isProductCategoryKey(categoryKey) ? categoryKey : null;

  const { data: rooms = [] } = useRooms();
  const linkedRoom = useMemo(() => {
    if (!validKey) return null;
    return findLegacyRoomForProductCategory(rooms, validKey);
  }, [rooms, validKey]);

  const roomIdNum = linkedRoom?.id ?? 0;
  const hasLinkedRoom = Boolean(linkedRoom && roomIdNum > 0);

  const {
    data: tasksData = [],
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useTasks({ roomId: roomIdNum || undefined }, { enabled: hasLinkedRoom });

  const [recommendedVideo, setRecommendedVideo] = useState<RecommendedVideo | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const displayTitle = validKey
    ? `${getProductCategoryEmoji(validKey)} ${tPc(`items.${validKey}`)}`
    : tPc("detail.invalidTitle");

  const linkedLabel = linkedRoom
    ? getLocalizedRoomTitle(linkedRoom.name, tRooms, { roomId: linkedRoom.id })
    : null;

  const roomEmoji = useMemo(() => {
    if (!linkedRoom?.name) return getProductCategoryEmoji(validKey || "bedroom");
    const value = linkedRoom.name.toLowerCase();
    if (value.includes("מטבח") || value.includes("kitchen")) return "🍳";
    if (value.includes("סלון") || value.includes("living")) return "🏠";
    if (value.includes("שינה") || value.includes("bed")) return "🛏️";
    if (value.includes("ארון") || value.includes("closet")) return "👕";
    if (value.includes("ילדים") || value.includes("kids")) return "🧸";
    if (value.includes("מקלחת") || value.includes("bath")) return "🛁";
    return getProductCategoryEmoji(validKey || "bedroom");
  }, [linkedRoom?.name, validKey]);

  const roomTip = useMemo(() => {
    const cat = inferRoomCategory(linkedRoom?.name || "");
    if (cat === "kitchen") return tRoom("tip_kitchen");
    if (cat === "bedroom") return tRoom("tip_bedroom");
    if (cat === "living") return tRoom("tip_living");
    return tRoom("tip_default");
  }, [linkedRoom?.name, tRoom]);

  const tasks = useMemo<RoomTask[]>(() => {
    return (tasksData as TaskRead[])
      .map((task) => ({
        id: Number(task.id),
        title: task.title || tRoom("emptyTaskTitle"),
        completed: Boolean(task.completed),
      }))
      .sort((a, b) => Number(a.completed) - Number(b.completed));
  }, [tasksData, tRoom]);

  const completedCount = tasks.filter((task) => task.completed).length;

  const embeddedVideoUrl = useMemo(() => {
    if (recommendedVideo?.videoId) {
      return `https://www.youtube.com/embed/${recommendedVideo.videoId}`;
    }
    if (recommendedVideo?.url) {
      const match = recommendedVideo.url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
      if (match?.[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    return "https://www.youtube.com/embed/BM5vN7ekfA8";
  }, [recommendedVideo]);

  useEffect(() => {
    if (!hasLinkedRoom || !roomIdNum) return;

    let isMounted = true;
    setVideoLoading(true);
    api
      .get<RecommendedVideo>("/content/recommended-video", {
        params: { room_id: roomIdNum, lang: videoLang },
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
  }, [hasLinkedRoom, roomIdNum, videoLang]);

  const toggleTask = async (task: RoomTask) => {
    if (!task?.id || updatingTaskId) return;
    setUpdatingTaskId(task.id);
    try {
      await api.put(`/tasks/${task.id}`, { completed: !task.completed });
      await refetchTasks();
    } catch {
      window.alert(tRoom("taskUpdateFailed"));
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (!validKey) {
    return (
      <div className="pageBg pageBg--room" dir={rtl ? "rtl" : "ltr"}>
        <div className="pageOverlay" />
        <main className="pageContent" style={{ display: "grid", gap: 24 }}>
          <div className="lifestyle-card">
            <div className="lifestyle-title">{tPc("detail.invalidTitle")}</div>
            <div className="lifestyle-muted">{tPc("detail.invalidBody")}</div>
            <div style={{ marginTop: 12 }}>
              <Link className="wow-btn" to={ROUTES.CATEGORIES}>
                {tPc("hub.backToList")}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pageBg pageBg--room" dir={rtl ? "rtl" : "ltr"}>
      <div className="pageOverlay" />
      <main className="pageContent" style={{ display: "grid", gap: 24 }}>
        <div className="lifestyle-card">
          <div className="lifestyle-title">
            {roomEmoji} {displayTitle}
          </div>
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="wow-btn" to={ROUTES.CATEGORIES}>
              {tPc("hub.backToList")}
            </Link>
            {hasLinkedRoom && (
              <Link className="wow-btn wow-btnPrimary" to={`${ROUTES.ADD_TASK}?roomId=${roomIdNum}`}>
                {tRoom("addTask")}
              </Link>
            )}
          </div>
          <div className="lifestyle-muted">
            {linkedLabel ? tPc("detail.linkedLine", { name: linkedLabel }) : tPc("detail.unlinkedLine")}
            {hasLinkedRoom && tasks.length > 0
              ? ` • ${tRoom("completedLabel", { completed: completedCount, total: tasks.length })}`
              : ""}
          </div>
        </div>

        {validKey === "emotional" ? (
          <div className="lifestyle-card">
            <div className="lifestyle-title">{tPc("emotionalCategory.journalCardTitle")}</div>
            <div className="lifestyle-muted">{tPc("emotionalCategory.journalCardBody")}</div>
            <div className="lifestyle-muted" style={{ marginTop: 8 }}>
              {tPc("emotionalCategory.journalPromptHint")}
            </div>
            <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link className="wow-btn wow-btnPrimary" to={ROUTES.EMOTIONAL_JOURNAL}>
                {tPc("emotionalCategory.openJournalCta")}
              </Link>
              <Link className="wow-btn" to={ROUTES.CONTENT_HUB}>
                {tPc("emotionalCategory.openTipsCta")}
              </Link>
            </div>
          </div>
        ) : null}

        {!hasLinkedRoom ? (
          <div className="lifestyle-card">
            <div className="lifestyle-title">
              {validKey === "emotional" ? tPc("emotionalCategory.unlinkedTitle") : tPc("detail.noLinkTitle")}
            </div>
            <div className="lifestyle-muted">
              {validKey === "emotional" ? tPc("emotionalCategory.unlinkedBody") : tPc("detail.noLinkBody")}
            </div>
            <div style={{ marginTop: 12 }}>
              <Link className="wow-btn wow-btnPrimary" to={ROUTES.CATEGORIES}>
                {validKey === "emotional" ? tPc("emotionalCategory.unlinkedCta") : tPc("detail.noLinkCta")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="lifestyle-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div className="lifestyle-title">{tRoom("tasksTitle")}</div>
              <Link className="wow-btn wow-btnPrimary" to={`${ROUTES.ADD_TASK}?roomId=${roomIdNum}`}>
                {tRoom("addTask")}
              </Link>
            </div>

            {tasksLoading ? (
              <div className="lifestyle-muted">{tRoom("tasksLoading")}</div>
            ) : tasks.length === 0 ? (
              <div className="lifestyle-muted">
                {tRoom("noTasks")}
                <br />
                {tRoom("noTasksHint")}
              </div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {tasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className="wow-btn"
                    onClick={() => void toggleTask(task)}
                    disabled={updatingTaskId === task.id}
                    style={{
                      width: "100%",
                      justifyContent: "flex-start",
                      opacity: updatingTaskId === task.id ? 0.75 : 1,
                      textDecoration: task.completed ? "line-through" : "none",
                    }}
                  >
                    {task.completed ? "✔ " : "○ "} {task.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="lifestyle-card">
          <div className="lifestyle-title">{tRoom("tipTitle")}</div>
          <div className="lifestyle-muted">{roomTip}</div>
        </div>

        {hasLinkedRoom && (
          <div className="lifestyle-card" dir={rtl ? "rtl" : "ltr"}>
            <div className="lifestyle-title">{tRoom("videoTitle")}</div>
            <div className="lifestyle-muted" style={{ marginBottom: 12 }}>
              {tRoom("watchVideoSub")}
            </div>
            {videoLoading ? (
              <div className="wow-skeleton" style={{ height: 180, borderRadius: 16 }} />
            ) : (
              <iframe
                title={recommendedVideo?.title || tRoom("recommendedAlt")}
                src={embeddedVideoUrl}
                className="inspiration-embed"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            )}

            <a
              href={recommendedVideo?.url || "https://www.youtube.com/@EliMaor555"}
              target="_blank"
              rel="noreferrer"
              className="wow-btn"
              style={{ display: "inline-flex", marginTop: 10 }}
            >
              {tRoom("goToChannel")}
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
