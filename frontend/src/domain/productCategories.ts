/**
 * Canonical product "Categories" domain (replaces conceptual "Rooms" in the UI).
 *
 * Backend may still persist `rooms` — map legacy rows → category keys here only.
 */
import type { RoomKey } from "../utils/roomLocalization";
import { resolveRoomKey } from "../utils/roomLocalization";

/** Stable URL + i18n keys (snake_case). */
export const PRODUCT_CATEGORY_KEYS = [
  "kitchen",
  "clothes",
  "shoes",
  "accessories",
  "office",
  "kids_toys_games",
  "kids_craft",
  "bathroom_beauty",
  "bedroom",
  "emotional",
] as const;

export type ProductCategoryKey = (typeof PRODUCT_CATEGORY_KEYS)[number];

export const PRODUCT_CATEGORY_ORDER: readonly ProductCategoryKey[] = PRODUCT_CATEGORY_KEYS;

/** Shown in shell category menu + `/categories` grid; retired keys redirect (e.g. `emotional`). */
export const PRODUCT_CATEGORY_NAV_ORDER: readonly ProductCategoryKey[] = PRODUCT_CATEGORY_ORDER.filter(
  (k) => k !== "emotional",
);

const PRODUCT_CATEGORY_META: Record<
  ProductCategoryKey,
  { emoji: string }
> = {
  kitchen: { emoji: "🍳" },
  clothes: { emoji: "👕" },
  shoes: { emoji: "👟" },
  accessories: { emoji: "👜" },
  office: { emoji: "💼" },
  kids_toys_games: { emoji: "🧸" },
  kids_craft: { emoji: "🎨" },
  bathroom_beauty: { emoji: "🛁" },
  bedroom: { emoji: "🛏️" },
  emotional: { emoji: "💭" },
};

export function isProductCategoryKey(value: string): value is ProductCategoryKey {
  return (PRODUCT_CATEGORY_KEYS as readonly string[]).includes(value);
}

export function getProductCategoryEmoji(key: ProductCategoryKey): string {
  return PRODUCT_CATEGORY_META[key].emoji;
}

/**
 * Map legacy `RoomKey` (from free-text room names) → product category.
 * Only keys that participate in the new taxonomy are listed.
 */
const LEGACY_ROOM_KEY_TO_PRODUCT: Partial<Record<RoomKey, ProductCategoryKey>> = {
  kitchen: "kitchen",
  bedroom: "bedroom",
  bathroom: "bathroom_beauty",
  office: "office",
  closet: "clothes",
  kids_room: "kids_toys_games",
  laundry: "clothes",
  living_room: "bedroom",
  balcony: "accessories",
  garage: "office",
};

/**
 * Local dashboard demo tasks use kebab-case `Task.room` slugs; map once → RoomKey → product category.
 * Keeps dashboard tags aligned with `PRODUCT_CATEGORY_KEYS` without duplicating taxonomy elsewhere.
 */
const DASHBOARD_TASK_ROOM_SLUG_TO_ROOM_KEY: Partial<Record<string, RoomKey>> = {
  "living-room": "living_room",
  kitchen: "kitchen",
  bedroom: "bedroom",
  bathroom: "bathroom",
  closet: "closet",
  office: "office",
  balcony: "balcony",
  kids: "kids_room",
  "kids-room": "kids_room",
  laundry: "laundry",
  garage: "garage",
};

type NameProbe = { test: (normalized: string) => boolean; key: ProductCategoryKey };

/** Higher-signal phrases before generic `resolveRoomKey` fallback. */
const DIRECT_NAME_PROBES: NameProbe[] = [
  { test: (n) => /נעל|סנדל|shoe|footwear|boot/i.test(n), key: "shoes" },
  { test: (n) => /יצירה|craft|קרפט|arts?\s*&\s*crafts/i.test(n), key: "kids_craft" },
  { test: (n) => /רגש|emotional|יומן\s*רגש|declutter\s*emotion/i.test(n), key: "emotional" },
  { test: (n) => /תכשיט|אביזר|accessor|jewelry|belt|scarf/i.test(n), key: "accessories" },
  { test: (n) => /צעצוע|משחק|toy|games?/i.test(n), key: "kids_toys_games" },
  { test: (n) => /מקלחת|אמבט|beauty|איפור|makeup|skincare/i.test(n), key: "bathroom_beauty" },
];

/**
 * Infer a product category from a legacy storage-area name (DB `room.name`).
 */
export function inferProductCategoryFromRoomName(roomName: string): ProductCategoryKey | null {
  const n = roomName.normalize("NFC").trim();
  if (!n) return null;

  for (const { test, key } of DIRECT_NAME_PROBES) {
    if (test(n)) return key;
  }

  const rk = resolveRoomKey(n);
  if (rk) {
    const mapped = LEGACY_ROOM_KEY_TO_PRODUCT[rk];
    if (mapped) return mapped;
  }

  return null;
}

/**
 * Resolve a dashboard/local task `room` slug to a canonical product category.
 */
export function inferProductCategoryFromDashboardTaskRoomSlug(slug: string): ProductCategoryKey | null {
  const s = slug.normalize("NFC").trim();
  if (!s) return null;
  const rk = DASHBOARD_TASK_ROOM_SLUG_TO_ROOM_KEY[s];
  if (rk) {
    const mapped = LEGACY_ROOM_KEY_TO_PRODUCT[rk];
    if (mapped) return mapped;
  }
  return inferProductCategoryFromRoomName(s.replace(/-/g, " "));
}

/**
 * Pick the first legacy room row that maps to the given product category.
 */
export function findLegacyRoomForProductCategory(
  rooms: ReadonlyArray<{ id: number; name: string }>,
  category: ProductCategoryKey,
): { id: number; name: string } | null {
  return rooms.find((r) => inferProductCategoryFromRoomName(r.name) === category) ?? null;
}
