/** @deprecated Replaced by `CategoriesPage` at `/categories` (not mounted in router). */
import { useMemo, useState } from "react";
import { useRooms } from "../hooks/useRooms";
import { RoomCard } from "../components/RoomCard";
import { RoomCardSkeleton } from "../components/SkeletonLoader";
import { useTranslation } from "react-i18next";
import api from "../api";
import { showError, showSuccess } from "../utils/toast";
import InteractiveHouseMap from "../components/InteractiveHouseMap";
import { isRtlLang } from "../utils/localeDirection";

export const RoomsPage = () => {
  const { i18n, t: tRoomsNs } = useTranslation("rooms");
  const { t: tCommon } = useTranslation("common");
  const rtl = isRtlLang(i18n.language);
  const { data: rooms = [], isLoading: loading, refetch } = useRooms();
  const [newRoomName, setNewRoomName] = useState("");
  const [creating, setCreating] = useState(false);

  const roomCount = useMemo(() => rooms.length, [rooms]);

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newRoomName.trim();
    if (!name) {
      showError(tRoomsNs("hub.roomRequired"));
      return;
    }

    setCreating(true);
    try {
      await api.post("/rooms", { name });
      setNewRoomName("");
      showSuccess(tRoomsNs("hub.createSuccess"));
      await refetch();
    } catch (error: any) {
      const isNetworkError =
        error?.code === "ERR_NETWORK" ||
        error?.code === "ERR_FAILED" ||
        error?.message?.includes("Network Error") ||
        error?.message?.includes("Failed");

      if (isNetworkError) {
        showError(tRoomsNs("hub.networkError"));
      } else {
        showError(error?.response?.data?.detail ?? tRoomsNs("hub.createFail"));
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="pageBg pageBg--room" dir={rtl ? "rtl" : "ltr"}>
        <div className="pageOverlay" />
        <div className="pageContent">
          <h1 className="text-2xl font-bold mb-4">
            📦 {tRoomsNs("hub.allRooms")} — {tCommon("loading")}
          </h1>
          <RoomCardSkeleton count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="pageBg pageBg--room" dir={rtl ? "rtl" : "ltr"}>
      <div className="pageOverlay" />
      <main className="pageContent" style={{ display: "grid", gap: 24 }}>
        <div className="lifestyle-card">
          <div className="lifestyle-title">{tRoomsNs("hub.yourRooms")}</div>
          <div className="lifestyle-muted">{tRoomsNs("hub.tagline")}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="lifestyle-card">
            <div className="lifestyle-title">{tRoomsNs("hub.statsTitle")}</div>
            <div className="wow-muted">{tRoomsNs("hub.statsRooms")}</div>
            <div className="wow-title" style={{ fontSize: 32, marginTop: 8 }}>
              {roomCount}
            </div>
          </div>
          <div className="lifestyle-card">
            <div className="lifestyle-title">{tRoomsNs("hub.ideasTitle")}</div>
            <div className="wow-muted" style={{ display: "grid", gap: 6, marginTop: 8 }}>
              <span>• {tRoomsNs("hub.ideas1")}</span>
              <span>• {tRoomsNs("hub.ideas2")}</span>
              <span>• {tRoomsNs("hub.ideas3")}</span>
            </div>
          </div>
        </div>

        <div className="lifestyle-card">
          <div className="lifestyle-title">{tRoomsNs("hub.createTitle")}</div>
          <div className="lifestyle-muted" style={{ marginBottom: 12 }}>
            {tRoomsNs("hub.createSub")}
          </div>
          <form onSubmit={handleCreateRoom} style={{ display: "grid", gap: 10 }}>
            <label className="label">{tRoomsNs("hub.roomNameLabel")}</label>
            <input
              className="input"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder={tRoomsNs("hub.roomNamePlaceholder")}
              disabled={creating}
            />
            <button type="submit" className="wow-btn wow-btnPrimary" disabled={creating}>
              {creating ? tRoomsNs("hub.creating") : tRoomsNs("hub.createBtn")}
            </button>
          </form>
        </div>

        <div className="lifestyle-card">
          <div className="lifestyle-title">{tRoomsNs("hub.mapTitle")}</div>
          <div className="lifestyle-muted" style={{ marginBottom: 14 }}>
            {tRoomsNs("hub.mapSub")}
          </div>
          <InteractiveHouseMap rooms={rooms} />
        </div>

        {rooms && rooms.length > 0 && (
          <>
            <div className="lifestyle-card">
              <div className="lifestyle-title">{tRoomsNs("hub.cardsTitle")}</div>
              <div className="lifestyle-muted" style={{ marginBottom: 10 }}>
                {tRoomsNs("hub.tagline")}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 20,
              }}
            >
              {rooms.map((room) => (
                <div key={room.id} className="lifestyle-card">
                  <RoomCard roomId={room.id} name={room.name} />
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};
