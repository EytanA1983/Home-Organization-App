import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { InventoryAreaRead, InventoryItemRead } from "../schemas/inventory";
import { showError, showSuccess } from "../utils/toast";
import { useTranslation } from "react-i18next";
import { ROUTES } from "../utils/routes";
import { isRtlLang } from "../utils/localeDirection";
import { inventoryPhotoSrc } from "../utils/inventoryImageUrl";

export default function InventoryPage() {
  const { t } = useTranslation("inventory");
  const { t: tl } = useTranslation("layout");
  const { t: tCommon } = useTranslation("common");
  const { i18n } = useTranslation();
  const dirAttr = isRtlLang(i18n.language) ? "rtl" : "ltr";

  const [areas, setAreas] = useState<InventoryAreaRead[]>([]);
  const [items, setItems] = useState<InventoryItemRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [areaName, setAreaName] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isDonated, setIsDonated] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedItems = useMemo(() => {
    if (selectedAreaId == null) return [];
    return items.filter((it) => it.area_id === selectedAreaId);
  }, [items, selectedAreaId]);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: a }, { data: i }] = await Promise.all([
        api.get<InventoryAreaRead[]>("/inventory/areas"),
        api.get<InventoryItemRead[]>("/inventory/items"),
      ]);
      setAreas(a || []);
      setItems(i || []);
      if (selectedAreaId == null && (a || []).length > 0) {
        setSelectedAreaId(a![0].id);
      }
    } catch {
      setAreas([]);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) return;
    try {
      const { data } = await api.post<InventoryAreaRead>("/inventory/areas", { name: areaName.trim() });
      setAreas((prev) => [...prev, data]);
      setSelectedAreaId(data.id);
      setAreaName("");
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      showError(detail ?? tCommon("error"));
    }
  };

  const handlePhotoFile = async (file: File | undefined | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError(t("photoUploadTypeError"));
      return;
    }
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post<{ url: string }>("/inventory/upload-photo", fd);
      if (data?.url) {
        setPhotoUrl(data.url);
        showSuccess(t("photoUploadSuccess"));
      }
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      showError(typeof detail === "string" ? detail : t("photoUploadFailed"));
    } finally {
      setPhotoUploading(false);
    }
  };

  const openFilePicker = (mode: "gallery" | "camera") => {
    const el = fileInputRef.current;
    if (!el) return;
    if (mode === "camera") {
      el.setAttribute("capture", "environment");
    } else {
      el.removeAttribute("capture");
    }
    el.click();
  };

  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    e.target.removeAttribute("capture");
    await handlePhotoFile(f);
  };

  const createItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || selectedAreaId == null) return;
    try {
      const { data } = await api.post<InventoryItemRead>("/inventory/items", {
        area_id: selectedAreaId,
        name: itemName.trim(),
        quantity,
        photo_url: photoUrl.trim() || null,
        is_donated: isDonated,
      });
      setItems((prev) => [data, ...prev]);
      setItemName("");
      setQuantity(1);
      setPhotoUrl("");
      setIsDonated(false);
      showSuccess(t("itemAdded"));
    } catch (err: unknown) {
      const detail =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined;
      showError(detail ?? t("itemAddFailed"));
    }
  };

  const previewSrc = inventoryPhotoSrc(photoUrl);

  return (
    <main className="pageContent" dir={dirAttr} style={{ display: "grid", gap: 20 }}>
      <section className="lifestyle-card">
        <div className="lifestyle-title">{t("title")}</div>
        <div className="lifestyle-muted">{t("subtitle")}</div>
        <p className="wow-muted" style={{ marginTop: 10, lineHeight: 1.5 }}>
          {tl("inventoryKicker")}{" "}
          <Link to={ROUTES.CATEGORIES} className="wow-btn" style={{ display: "inline-flex", padding: "2px 10px", fontSize: "0.85rem" }}>
            {tl("inventoryBackCategories")}
          </Link>
        </p>
      </section>

      <section className="lifestyle-card">
        <form onSubmit={createArea} style={{ display: "grid", gap: 8 }}>
          <label className="label">{t("areaName")}</label>
          <input className="input" value={areaName} onChange={(e) => setAreaName(e.target.value)} placeholder={t("areaPlaceholder")} />
          <button className="wow-btn wow-btnPrimary" type="submit">
            {t("addArea")}
          </button>
        </form>
      </section>

      {loading ? (
        <div className="wow-skeleton" style={{ height: 100 }} />
      ) : areas.length === 0 ? (
        <section className="lifestyle-card">
          <p className="wow-muted">{t("noAreas")}</p>
        </section>
      ) : (
        <>
          <section className="lifestyle-card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
            {areas.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelectedAreaId(a.id)}
                className={`wow-btn ${selectedAreaId === a.id ? "wow-btnPrimary" : ""}`}
              >
                📦 {a.name}
              </button>
            ))}
          </section>

          <section className="lifestyle-card">
            <div className="lifestyle-title" style={{ fontSize: 18, marginBottom: 4 }}>
              {t("addHomeItemToInventory")}
            </div>
            <div className="lifestyle-muted" style={{ marginBottom: 12 }}>
              {t("addItemFormHint")}
            </div>
            <form onSubmit={createItem} style={{ display: "grid", gap: 8 }}>
              <label className="label">{t("itemName")}</label>
              <input className="input" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder={t("itemPlaceholder")} />
              <label className="label">{t("quantity")}</label>
              <input className="input" type="number" min={0} value={quantity} onChange={(e) => setQuantity(Number(e.target.value || 0))} />

              <div style={{ marginTop: 4 }}>
                <div className="label" style={{ marginBottom: 6 }}>
                  {t("photoSectionTitle")}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                  style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0,0,0,0)", border: 0 }}
                  aria-hidden
                  tabIndex={-1}
                  onChange={onFileInputChange}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    type="button"
                    className="wow-btn touch-target"
                    disabled={photoUploading}
                    onClick={() => openFilePicker("gallery")}
                  >
                    {photoUploading ? t("photoUploading") : t("photoUploadFromDevice")}
                  </button>
                  <button
                    type="button"
                    className="wow-btn touch-target"
                    disabled={photoUploading}
                    onClick={() => openFilePicker("camera")}
                  >
                    {t("photoUseCamera")}
                  </button>
                  {photoUrl ? (
                    <button type="button" className="wow-btn" onClick={() => setPhotoUrl("")}>
                      {t("photoClear")}
                    </button>
                  ) : null}
                </div>
                <p className="wow-muted" style={{ marginTop: 8, fontSize: "0.9rem" }}>
                  {t("photoUrlHint")}
                </p>
              </div>

              <label className="label">{t("photoUrl")}</label>
              <input
                className="input"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
                dir="ltr"
              />

              {previewSrc ? (
                <div style={{ marginTop: 4 }}>
                  <img
                    src={previewSrc}
                    alt=""
                    style={{ maxWidth: "min(100%, 280px)", maxHeight: 220, borderRadius: 12, objectFit: "cover", border: "1px solid var(--border)" }}
                  />
                </div>
              ) : null}

              <label className="label" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={isDonated} onChange={(e) => setIsDonated(e.target.checked)} />
                {t("markDonated")}
              </label>
              <button className="wow-btn wow-btnPrimary" type="submit">
                {t("addHomeItemToInventory")}
              </button>
            </form>
          </section>

          <section className="lifestyle-card" style={{ display: "grid", gap: 10 }}>
            {selectedItems.length === 0 ? (
              <p className="wow-muted">{t("noItems")}</p>
            ) : (
              selectedItems.map((it) => (
                <article key={it.id} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 10 }}>
                  <div style={{ fontWeight: 600 }}>
                    {it.name} {it.is_donated ? "✅" : ""}
                  </div>
                  <div className="wow-muted">
                    {t("quantity")}: {it.quantity}
                  </div>
                  {it.photo_url ? (
                    <img
                      src={inventoryPhotoSrc(it.photo_url)}
                      alt={it.name}
                      style={{ width: 120, marginTop: 8, borderRadius: 8, objectFit: "cover" }}
                    />
                  ) : null}
                </article>
              ))
            )}
          </section>
        </>
      )}
    </main>
  );
}
