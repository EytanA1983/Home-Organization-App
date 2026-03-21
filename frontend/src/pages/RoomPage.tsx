import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../api";
import { useTranslation } from "react-i18next";
import { useRooms } from "../hooks/useRooms";
import { useTasks } from "../hooks/useTasks";
import { ROUTES } from "../utils/routes";
import { isRtlLang } from "../utils/localeDirection";
import { getLocalizedRoomTitle, inferRoomCategory } from "../utils/roomLocalization";
import type { RoomRead } from "../schemas/room";
import type { TaskRead } from "../schemas/task";

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

export default function RoomPage() {
  const { i18n, t: tRoom } = useTranslation("room");
  const { t: tRooms } = useTranslation("rooms");
  const { t: tPc } = useTranslation("productCategories");
  const rtl = isRtlLang(i18n.language);
  const videoLang = (i18n.language || "he").split("-")[0] === "he" ? "he" : "en";
  const { roomId } = useParams<{ roomId: string }>();
  const roomIdNum = useMemo(() => Number(roomId), [roomId]);
  const isInvalidRoomId = Number.isNaN(roomIdNum);
  const { data: rooms = [] } = useRooms();
  const {
    data: tasksData = [],
    isLoading: tasksLoading,
    refetch: refetchTasks,
  } = useTasks({ roomId: roomIdNum || undefined }, { enabled: !isInvalidRoomId });
  const [recommendedVideo, setRecommendedVideo] = useState<RecommendedVideo | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);

  const room = useMemo<RoomRead | null>(() => {
    return (rooms as RoomRead[]).find((r) => Number(r.id) === roomIdNum) || null;
  }, [rooms, roomIdNum]);

  const roomName = room?.name
    ? getLocalizedRoomTitle(room.name, tRooms, { roomId: room.id })
    : `${tRoom("room")} ${roomIdNum}`;

  const roomEmoji = useMemo(() => {
    const value = (room?.name || "").toLowerCase();
    if (value.includes("מטבח") || value.includes("kitchen")) return "🍳";
    if (value.includes("סלון") || value.includes("living")) return "🏠";
    if (value.includes("שינה") || value.includes("bed")) return "🛏️";
    if (value.includes("ארון") || value.includes("closet")) return "👕";
    if (value.includes("ילדים") || value.includes("kids")) return "🧸";
    if (value.includes("מקלחת") || value.includes("bath")) return "🛁";
    return "✨";
  }, [room?.name]);

  const roomTip = useMemo(() => {
    const cat = inferRoomCategory(room?.name || "");
    if (cat === "kitchen") return tRoom("tip_kitchen");
    if (cat === "bedroom") return tRoom("tip_bedroom");
    if (cat === "living") return tRoom("tip_living");
    return tRoom("tip_default");
  }, [room?.name, tRoom]);

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
    if (!roomId || isInvalidRoomId) return;

    let isMounted = true;
    setVideoLoading(true);
    api
      .get<RecommendedVideo>("/content/recommended-video", {
        params: { room_id: roomId, lang: videoLang },
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
  }, [videoLang, isInvalidRoomId, roomId]);

  const toggleTask = async (task: RoomTask) => {
    if (!task?.id || updatingTaskId) return;
    setUpdatingTaskId(task.id);
    try {
      await api.put(`/tasks/${task.id}`, { completed: !task.completed });
      await refetchTasks();
    } catch {
      // Keep UX simple in room page - avoid toast dependency.
      window.alert(tRoom("taskUpdateFailed"));
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <div className="pageBg pageBg--room" dir={rtl ? "rtl" : "ltr"}>
      <div className="pageOverlay" />
      <main className="pageContent" style={{ display: "grid", gap: 24 }}>

      <div className="lifestyle-card">
        <div className="lifestyle-title">{roomEmoji} {roomName}</div>
        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link className="wow-btn" to={ROUTES.CATEGORIES}>
            {tPc("hub.backToList")}
          </Link>
        </div>
        <div className="lifestyle-muted">
          {tRoom("roomDesc")}{" "}
          {tasks.length > 0
            ? `• ${tRoom("completedLabel", { completed: completedCount, total: tasks.length })}`
            : ""}
        </div>
      </div>

      {isInvalidRoomId ? (
        <div className="lifestyle-card">
          <div className="lifestyle-title">
            {tRoom("roomUnavailable")}
          </div>
          <div className="lifestyle-muted">
            {tRoom("invalidRoom")}
          </div>
        </div>
      ) : (
        <div className="lifestyle-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10 }}>
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
                  onClick={() => toggleTask(task)}
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

      </main>
    </div>
  );
}
