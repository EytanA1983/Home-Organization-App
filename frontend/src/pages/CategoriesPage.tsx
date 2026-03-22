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
  PRODUCT_CATEGORY_NAV_ORDER,
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
  const [addAreaOpen, setAddAreaOpen] = useState(false);

  /** Native tooltip (hover) — full former card copy without cluttering the layout. */
  const addAreaHoverTitle = useMemo(
    () =>
      [
        tPc("hub.createAreaTitle"),
        tPc("hub.createAreaSub"),
        `${tPc("hub.areaNameLabel")}: ${tPc("hub.areaNamePlaceholder")}`,
      ].join("\n\n"),
    [tPc],
  );

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
      setAddAreaOpen(false);
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
            {PRODUCT_CATEGORY_NAV_ORDER.map((key: ProductCategoryKey) => {
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

        <div className="lifestyle-card">
          <div className="categories-map-card__head">
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <div className="lifestyle-title">{tRoomsNs("hub.mapTitle")}</div>
              <div className="lifestyle-muted" style={{ marginTop: 6 }}>
                {tRoomsNs("hub.mapSub")}
              </div>
            </div>
            <button
              type="button"
              className="categories-add-area-trigger"
              title={addAreaHoverTitle}
              aria-label={addAreaHoverTitle}
              aria-expanded={addAreaOpen}
              onClick={() => setAddAreaOpen((open) => !open)}
            >
              {tPc("hub.addAreaMinimalCta")}
            </button>
          </div>

          {addAreaOpen ? (
            <form className="categories-add-area-form" onSubmit={handleCreateArea}>
              <input
                className="input"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                placeholder={tPc("hub.areaNamePlaceholder")}
                aria-label={tPc("hub.areaNameLabel")}
                disabled={creating}
                autoComplete="off"
                autoFocus
              />
              <button type="submit" className="wow-btn wow-btnPrimary" disabled={creating}>
                {creating ? tRoomsNs("hub.creating") : tPc("hub.createAreaBtn")}
              </button>
              <button
                type="button"
                className="wow-btn wow-btn--ghost"
                disabled={creating}
                onClick={() => {
                  setAddAreaOpen(false);
                  setNewAreaName("");
                }}
              >
                {tCommon("cancel")}
              </button>
            </form>
          ) : null}

          <InteractiveHouseMap rooms={rooms} />
        </div>

        {rooms && rooms.length > 0 && (
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
        )}
      </main>
    </div>
  );
};
