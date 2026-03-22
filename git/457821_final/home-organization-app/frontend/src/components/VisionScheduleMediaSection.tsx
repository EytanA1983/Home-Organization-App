import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  VISION_MEDIA_MAX_ITEMS,
  VISION_MEDIA_MAX_IMAGE_BYTES,
  VISION_MEDIA_MAX_VIDEO_BYTES,
  addVisionMedia,
  loadBlob,
  loadManifest,
  removeVisionMedia,
  validateVisionMediaFile,
  type VisionMediaItemRecord,
} from "../utils/visionScheduleMediaStorage";
import { showError } from "../utils/toast";

type Props = {
  userId: number | null;
};

/**
 * Local-only gallery: upload images/videos from desktop, laptop, or phone (file picker / camera).
 * Stored per user in IndexedDB + manifest in localStorage.
 */
export function VisionScheduleMediaSection({ userId }: Props) {
  const { t } = useTranslation("visionSchedule");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<VisionMediaItemRecord[]>([]);
  const [urlById, setUrlById] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [mediaTick, setMediaTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (userId == null) {
        if (!cancelled) {
          setItems([]);
          setUrlById((prev) => {
            Object.values(prev).forEach((u) => URL.revokeObjectURL(u));
            return {};
          });
        }
        return;
      }
      const man = loadManifest(userId);
      if (cancelled) return;
      setItems(man);
      const next: Record<string, string> = {};
      for (const it of man) {
        const blob = await loadBlob(userId, it.id);
        if (cancelled) {
          Object.values(next).forEach((u) => URL.revokeObjectURL(u));
          return;
        }
        if (!blob) continue;
        next[it.id] = URL.createObjectURL(blob);
      }
      if (cancelled) {
        Object.values(next).forEach((u) => URL.revokeObjectURL(u));
        return;
      }
      setUrlById((prev) => {
        Object.values(prev).forEach((u) => URL.revokeObjectURL(u));
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, mediaTick]);

  useEffect(() => {
    return () => {
      setUrlById((prev) => {
        Object.values(prev).forEach((u) => URL.revokeObjectURL(u));
        return {};
      });
    };
  }, []);

  const handleFiles = async (list: FileList | null) => {
    if (!list?.length || userId == null) return;
    setBusy(true);
    try {
      const files = Array.from(list);
      for (const file of files) {
        const cur = loadManifest(userId);
        if (cur.length >= VISION_MEDIA_MAX_ITEMS) {
          showError(t("mediaMaxItems", { max: VISION_MEDIA_MAX_ITEMS }));
          break;
        }
        const check = validateVisionMediaFile(file);
        if (!check.ok) {
          if (check.reason === "type") showError(t("mediaErrorType"));
          else if (check.reason === "size_image") {
            const maxImgMb = Math.round(VISION_MEDIA_MAX_IMAGE_BYTES / (1024 * 1024));
            showError(t("mediaErrorSizeImage", { maxImgMb }));
          } else {
            const maxVidMb = Math.round(VISION_MEDIA_MAX_VIDEO_BYTES / (1024 * 1024));
            showError(t("mediaErrorSizeVideo", { maxVidMb }));
          }
          continue;
        }
        try {
          await addVisionMedia(userId, file);
        } catch (e) {
          const code = e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
          if (code === "max_items") showError(t("mediaMaxItems", { max: VISION_MEDIA_MAX_ITEMS }));
          else showError(t("mediaUploadFailed"));
        }
      }
      setMediaTick((n) => n + 1);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const removeOne = async (id: string) => {
    if (userId == null) return;
    await removeVisionMedia(userId, id);
    setMediaTick((n) => n + 1);
  };

  if (userId == null) {
    return (
      <section
        className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-dark-surface p-4"
        aria-label={t("mediaSectionAria")}
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">{t("mediaNeedLogin")}</p>
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-surface p-4 shadow-sm"
      aria-label={t("mediaSectionAria")}
    >
      <div className="lifestyle-title" style={{ fontSize: 18, marginBottom: 6 }}>
        {t("mediaTitle")}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{t("mediaSubtitle")}</p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void handleFiles(e.target.files)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          className="wow-btn wow-btnPrimary"
          disabled={busy}
          onClick={() => fileInputRef.current?.click()}
        >
          {t("mediaPickFiles")}
        </button>
        <button
          type="button"
          className="wow-btn"
          disabled={busy}
          onClick={() => cameraInputRef.current?.click()}
        >
          {t("mediaUseCamera")}
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {t("mediaLimitsHint", {
          max: VISION_MEDIA_MAX_ITEMS,
          maxImgMb: Math.round(VISION_MEDIA_MAX_IMAGE_BYTES / (1024 * 1024)),
          maxVidMb: Math.round(VISION_MEDIA_MAX_VIDEO_BYTES / (1024 * 1024)),
        })}
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t("mediaEmpty")}</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 list-none p-0 m-0">
          {items.map((it) => {
            const src = urlById[it.id];
            return (
              <li
                key={it.id}
                className="relative rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-50 dark:bg-gray-900/40"
              >
                {it.kind === "image" && src ? (
                  <img src={src} alt={it.name} className="w-full h-36 object-cover block" loading="lazy" />
                ) : it.kind === "video" && src ? (
                  <video src={src} className="w-full h-36 object-cover block" controls playsInline preload="metadata" />
                ) : (
                  <div className="h-36 flex items-center justify-center text-xs text-gray-500 p-2 text-center">{it.name}</div>
                )}
                <div className="p-2 flex items-center justify-between gap-1">
                  <span className="text-xs truncate flex-1 min-w-0" title={it.name}>
                    {it.name}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-red-600 dark:text-red-400 shrink-0 underline"
                    onClick={() => void removeOne(it.id)}
                  >
                    {t("mediaRemove")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
