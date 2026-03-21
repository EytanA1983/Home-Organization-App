import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useRooms } from "../hooks/useRooms";
import { RoomCard } from "../components/RoomCard";
import { RoomCardSkeleton } from "../components/SkeletonLoader";
import { useTranslation } from "react-i18next";
import api from "../api";
import { showError, showSuccess } from "../utils/toast";
import InteractiveHouseMap from "../components/InteractiveHouseMap";
import { isRtlLang } from "../utils/localeDirection";
import {
  PRODUCT_CATEGORY_ORDER,
  type ProductCategoryKey,
  getProductCategoryEmoji,
  findLegacyRoomForProductCategory,
} from "../domain/productCategories";
import { getCategoryRoute } from "../utils/routes";

export const CategoriesPage = () => {
  const { i18n, t: tPc } = useTranslation("productCategories");
  const { t: tRoomsNs } = useTranslation("rooms");
  const { t: tCommon } = useTranslation("common");
  const rtl = isRtlLang(i18n.language);
  const { data: rooms = [], isLoading: loading, refetch } = useRooms();
  const [newAreaName, setNewAreaName] = useState("");
  const [creating, setCreating] = useState(false);

  const roomCount = useMemo(() => rooms.length, [rooms]);

  const handleCreateArea = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newAreaName.trim();
    if (!name) {
      showError(tRoomsNs("hub.roomRequired"));
      return;
    }

    setCreating(true);
    try {
      await api.post("/rooms", { name });
      setNewAreaName("");
      showSuccess(tRoomsNs("hub.createSuccess"));
      await refetch();
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string; response?: { data?: { detail?: string } } };
      const isNetworkError =
        err?.code === "ERR_NETWORK" ||
        err?.code === "ERR_FAILED" ||
        err?.message?.includes("Network Error") ||
        err?.message?.includes("Failed");

      if (isNetworkError) {
        showError(tRoomsNs("hub.networkError"));
      } else {
        showError(err?.response?.data?.detail ?? tRoomsNs("hub.createFail"));
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
            📂 {tPc("hub.pageTitle")} — {tCommon("loading")}
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
          <div className="lifestyle-title">{tPc("hub.pageTitle")}</div>
          <div className="lifestyle-muted">{tPc("hub.pageSubtitle")}</div>
          <div className="wow-muted" style={{ marginTop: 10, fontSize: 13 }}>
            {tPc("hub.legacyHint")}
          </div>
        </div>

        <div className="lifestyle-card">
          <div className="lifestyle-title">{tPc("hub.browseTitle")}</div>
          <div className="lifestyle-muted" style={{ marginBottom: 16 }}>
            {tPc("hub.browseSub")}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {PRODUCT_CATEGORY_ORDER.map((key: ProductCategoryKey) => {
              const linked = findLegacyRoomForProductCategory(rooms, key);
              return (
                <Link
                  key={key}
                  to={getCategoryRoute(key)}
                  className="lifestyle-card wow-fadeIn"
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    border: "1px solid rgba(0,0,0,0.06)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="lifestyle-title" style={{ fontSize: 18 }}>
                    {getProductCategoryEmoji(key)} {tPc(`items.${key}`)}
                  </div>
                  <div className="wow-muted" style={{ fontSize: 13, marginTop: 8 }}>
                    {linked
                      ? tPc("hub.linkedToArea", { name: linked.name })
                      : tPc("hub.notLinked")}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="lifestyle-card">
            <div className="lifestyle-title">{tPc("hub.statsTitle")}</div>
            <div className="wow-muted">{tPc("hub.statsLinkedAreas")}</div>
            <div className="wow-title" style={{ fontSize: 32, marginTop: 8 }}>
              {roomCount}
            </div>
          </div>
          <div className="lifestyle-card">
            <div className="lifestyle-title">{tPc("hub.ideasTitle")}</div>
            <div className="wow-muted" style={{ display: "grid", gap: 6, marginTop: 8 }}>
              <span>• {tPc("hub.idea1")}</span>
              <span>• {tPc("hub.idea2")}</span>
              <span>• {tPc("hub.idea3")}</span>
            </div>
          </div>
        </div>

        <div className="lifestyle-card">
          <div className="lifestyle-title">{tPc("hub.createAreaTitle")}</div>
          <div className="lifestyle-muted" style={{ marginBottom: 12 }}>
            {tPc("hub.createAreaSub")}
          </div>
          <form onSubmit={handleCreateArea} style={{ display: "grid", gap: 10 }}>
            <label className="label">{tPc("hub.areaNameLabel")}</label>
            <input
              className="input"
              value={newAreaName}
              onChange={(e) => setNewAreaName(e.target.value)}
              placeholder={tPc("hub.areaNamePlaceholder")}
              disabled={creating}
            />
            <button type="submit" className="wow-btn wow-btnPrimary" disabled={creating}>
              {creating ? tRoomsNs("hub.creating") : tPc("hub.createAreaBtn")}
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
              <div className="lifestyle-title">{tPc("hub.linkedCardsTitle")}</div>
              <div className="lifestyle-muted" style={{ marginBottom: 10 }}>
                {tPc("hub.linkedCardsSub")}
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
