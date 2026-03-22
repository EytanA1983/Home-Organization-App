/**
 * Canonical room keys for i18n (stable, not DB display names).
 * DB may store Hebrew or free text; we resolve → key → `rooms.room_types.*`.
 */
import type { TFunction } from "i18next";

/** Stable keys used for mapping → translation ids (snake_case). */
export type RoomKey =
  | "living_room"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "office"
  | "balcony"
  | "closet"
  | "kids_room"
  | "laundry"
  | "garage"
  | "other";

/** Legacy category used for styling / subtitles (short ids). */
export type RoomCategory =
  | "living"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "office"
  | "balcony"
  | "closet"
  | "kids"
  | "laundry"
  | "garage"
  | "default";

const KEY_TO_CATEGORY: Record<RoomKey, RoomCategory> = {
  living_room: "living",
  kitchen: "kitchen",
  bedroom: "bedroom",
  bathroom: "bathroom",
  office: "office",
  balcony: "balcony",
  closet: "closet",
  kids_room: "kids",
  laundry: "laundry",
  garage: "garage",
  other: "default",
};

/**
 * Exact legacy labels (Hebrew / English / common variants) → canonical key.
 * Normalized with trim + NFC before lookup; also tries lowercase ASCII.
 */
const LEGACY_LABEL_TO_KEY: Record<string, RoomKey> = {
  // Hebrew — common UI / speech
  סלון: "living_room",
  "חדר מגורים": "living_room",
  לובי: "living_room",
  מטבח: "kitchen",
  "חדר אוכל": "kitchen",
  שינה: "bedroom",
  "חדר שינה": "bedroom",
  "חדר הורים": "bedroom",
  "חדר רחצה": "bathroom",
  שירותים: "bathroom",
  אמבטיה: "bathroom",
  מקלחת: "bathroom",
  משרד: "office",
  "חדר עבודה": "office",
  מרפסת: "balcony",
  גינה: "balcony",
  ארון: "closet",
  "חדר ארונות": "closet",
  מחסן: "closet",
  "חדר כביסה": "laundry",
  מכבסה: "laundry",
  כביסה: "laundry",
  מוסך: "garage",
  חניה: "garage",
  "חדר ילדים": "kids_room",
  ילדים: "kids_room",
  // English
  "living room": "living_room",
  lounge: "living_room",
  lobby: "living_room",
  kitchen: "kitchen",
  dining: "kitchen",
  bedroom: "bedroom",
  bathroom: "bathroom",
  toilet: "bathroom",
  wc: "bathroom",
  office: "office",
  study: "office",
  balcony: "balcony",
  patio: "balcony",
  garden: "balcony",
  closet: "closet",
  wardrobe: "closet",
  storage: "closet",
  laundry: "laundry",
  garage: "garage",
  parking: "garage",
  "kids room": "kids_room",
  nursery: "kids_room",
};

function normalizeLabel(raw: string): string {
  return raw.normalize("NFC").trim().replace(/\s+/g, " ");
}

export function resolveRoomKey(roomName: string): RoomKey | null {
  const n = normalizeLabel(roomName);
  if (!n) return null;

  const direct = LEGACY_LABEL_TO_KEY[n];
  if (direct) return direct;

  const lower = n.toLowerCase();
  const lowerHit = LEGACY_LABEL_TO_KEY[lower];
  if (lowerHit) return lowerHit;

  const cat = inferRoomCategoryFromHeuristics(n);
  if (cat === "default") return null;
  return categoryToKey(cat);
}

function categoryToKey(cat: Exclude<RoomCategory, "default">): RoomKey {
  const map: Record<Exclude<RoomCategory, "default">, RoomKey> = {
    living: "living_room",
    kitchen: "kitchen",
    bedroom: "bedroom",
    bathroom: "bathroom",
    office: "office",
    balcony: "balcony",
    closet: "closet",
    kids: "kids_room",
    laundry: "laundry",
    garage: "garage",
  };
  return map[cat];
}

/** Heuristic match when exact legacy map misses (substring patterns). */
export function inferRoomCategory(roomName: string): RoomCategory {
  const key = resolveRoomKey(roomName);
  if (!key) return "default";
  return KEY_TO_CATEGORY[key];
}

function inferRoomCategoryFromHeuristics(name: string): RoomCategory {
  const lower = name.toLowerCase();

  if (lower.includes("סלון") || lower.includes("living") || lower.includes("לובי") || lower.includes("lobby")) {
    return "living";
  }
  if (lower.includes("מטבח") || lower.includes("kitchen") || lower.includes("אוכל") || lower.includes("dining")) {
    return "kitchen";
  }
  if (lower.includes("שינה") || lower.includes("bedroom") || lower.includes("חדר הורים")) {
    return "bedroom";
  }
  if (
    lower.includes("שירותים") ||
    lower.includes("bathroom") ||
    lower.includes("אמבטיה") ||
    lower.includes("מקלחת") ||
    lower.includes("bath") ||
    lower.includes("רחצה")
  ) {
    return "bathroom";
  }
  if (lower.includes("משרד") || lower.includes("office") || lower.includes("עבודה") || lower.includes("study")) {
    return "office";
  }
  if (lower.includes("מרפסת") || lower.includes("balcony") || lower.includes("גינה") || lower.includes("garden") || lower.includes("פטיו")) {
    return "balcony";
  }
  if (lower.includes("ארון") || lower.includes("closet") || lower.includes("מחסן") || lower.includes("storage")) {
    return "closet";
  }
  if (lower.includes("ילדים") || lower.includes("kids") || lower.includes("תינוק") || lower.includes("baby") || lower.includes("משחקים")) {
    return "kids";
  }
  if (lower.includes("מכבסה") || lower.includes("laundry") || lower.includes("כביסה")) {
    return "laundry";
  }
  if (lower.includes("מוסך") || lower.includes("garage") || lower.includes("חניה") || lower.includes("parking")) {
    return "garage";
  }

  return "default";
}

export type LocalizedRoomOptions = {
  /** When the name cannot be resolved, show a neutral label with id instead of leaking Hebrew. */
  roomId?: number | string;
};

/** Localized title: known key → i18n; unknown → generic fallback (never raw Hebrew in non-Hebrew UI). */
export function getLocalizedRoomTitle(
  roomName: string,
  t: TFunction<"rooms">,
  options?: LocalizedRoomOptions,
): string {
  const key = resolveRoomKey(roomName);
  if (key && key !== "other") {
    const cat = KEY_TO_CATEGORY[key];
    return t(`room_types.${cat}`, { defaultValue: roomName });
  }
  if (options?.roomId != null && options.roomId !== "") {
    return t("hub.fallbackRoomId", { id: options.roomId });
  }
  return t("room_types.default");
}

export function getLocalizedRoomSubtitle(roomName: string, t: TFunction<"rooms">): string {
  const cat = inferRoomCategory(roomName);
  return t(`subtitles.${cat}`);
}
