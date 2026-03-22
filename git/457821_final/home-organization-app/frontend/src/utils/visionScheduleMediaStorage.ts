/**
 * Per-user vision-board media on "לוח החזון שלי": images/videos stored in IndexedDB
 * (large files) + small manifest in localStorage. Scoped by user id.
 */

export type VisionMediaKind = "image" | "video";

export type VisionMediaItemRecord = {
  id: string;
  kind: VisionMediaKind;
  name: string;
  mime: string;
  size: number;
  createdAt: number;
};

const DB_NAME = "home-org-vision-media";
const DB_VERSION = 1;
const STORE = "blobs";

const MANIFEST_VERSION = 1;

/** Max items per user (gallery strip). */
export const VISION_MEDIA_MAX_ITEMS = 20;
/** Per-file limits — phone videos can be large; IDB typically handles well on desktop. */
export const VISION_MEDIA_MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const VISION_MEDIA_MAX_VIDEO_BYTES = 120 * 1024 * 1024;

function manifestStorageKey(userId: number): string {
  return `vision_schedule_media_${userId}`;
}

function idbKey(userId: number, fileId: string): string {
  return `${userId}::${fileId}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

export function loadManifest(userId: number): VisionMediaItemRecord[] {
  try {
    const raw = localStorage.getItem(manifestStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { v?: number; items?: unknown };
    if (!Array.isArray(parsed.items)) return [];
    const out: VisionMediaItemRecord[] = [];
    for (const row of parsed.items) {
      if (!row || typeof row !== "object") continue;
      const o = row as Record<string, unknown>;
      const id = typeof o.id === "string" ? o.id : "";
      const kind = o.kind === "image" || o.kind === "video" ? o.kind : null;
      const name = typeof o.name === "string" ? o.name : "";
      const mime = typeof o.mime === "string" ? o.mime : "";
      const size = typeof o.size === "number" && o.size >= 0 ? o.size : 0;
      const createdAt = typeof o.createdAt === "number" ? o.createdAt : 0;
      if (!id || !kind || !name) continue;
      out.push({ id, kind, name, mime, size, createdAt });
    }
    return out.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function saveManifest(userId: number, items: VisionMediaItemRecord[]): void {
  try {
    localStorage.setItem(
      manifestStorageKey(userId),
      JSON.stringify({ v: MANIFEST_VERSION, items }),
    );
  } catch {
    /* quota */
  }
}

export async function saveBlob(userId: number, fileId: string, blob: Blob): Promise<void> {
  const db = await openDb();
  const key = idbKey(userId, fileId);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb write"));
    tx.onabort = () => reject(tx.error ?? new Error("idb abort"));
    tx.objectStore(STORE).put(blob, key);
  });
  db.close();
}

export async function loadBlob(userId: number, fileId: string): Promise<Blob | null> {
  const db = await openDb();
  const key = idbKey(userId, fileId);
  const blob = await new Promise<Blob | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
    req.onerror = () => reject(req.error ?? new Error("idb read"));
  });
  db.close();
  return blob;
}

export async function removeBlob(userId: number, fileId: string): Promise<void> {
  const db = await openDb();
  const key = idbKey(userId, fileId);
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb delete"));
    tx.objectStore(STORE).delete(key);
  });
  db.close();
}

function inferKind(file: File): VisionMediaKind | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

export function validateVisionMediaFile(file: File): { ok: true } | { ok: false; reason: "type" | "size_image" | "size_video" } {
  const kind = inferKind(file);
  if (!kind) return { ok: false, reason: "type" };
  if (kind === "image" && file.size > VISION_MEDIA_MAX_IMAGE_BYTES) return { ok: false, reason: "size_image" };
  if (kind === "video" && file.size > VISION_MEDIA_MAX_VIDEO_BYTES) return { ok: false, reason: "size_video" };
  return { ok: true };
}

export async function addVisionMedia(userId: number, file: File): Promise<VisionMediaItemRecord> {
  const v = validateVisionMediaFile(file);
  if (!v.ok) {
    const err = new Error(v.reason);
    (err as Error & { code?: string }).code = v.reason;
    throw err;
  }
  const kind = inferKind(file)!;
  const manifest = loadManifest(userId);
  if (manifest.length >= VISION_MEDIA_MAX_ITEMS) {
    const err = new Error("max_items");
    (err as Error & { code?: string }).code = "max_items";
    throw err;
  }
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const record: VisionMediaItemRecord = {
    id,
    kind,
    name: file.name || (kind === "image" ? "image" : "video"),
    mime: file.type || (kind === "image" ? "image/jpeg" : "video/mp4"),
    size: file.size,
    createdAt: Date.now(),
  };
  await saveBlob(userId, id, file);
  saveManifest(userId, [record, ...manifest]);
  return record;
}

export async function removeVisionMedia(userId: number, fileId: string): Promise<void> {
  const manifest = loadManifest(userId).filter((x) => x.id !== fileId);
  saveManifest(userId, manifest);
  try {
    await removeBlob(userId, fileId);
  } catch {
    /* ignore */
  }
}
