/**
 * Dashboard task row: show canonical product category (not legacy room-type labels).
 */
import {
  getProductCategoryEmoji,
  inferProductCategoryFromDashboardTaskRoomSlug,
} from "../domain/productCategories";

/**
 * Label for the small category tag on a dashboard task card.
 * Uses `productCategories.items.*` + emoji; falls back to `rooms.room_types.default` if unmapped.
 */
export function getDashboardTaskCategoryLabel(
  taskRoomSlug: string,
  tProductCategories: (key: string) => string,
  tRoomsFallback: (key: string) => string,
): string {
  const cat = inferProductCategoryFromDashboardTaskRoomSlug(taskRoomSlug);
  if (cat) {
    return `${getProductCategoryEmoji(cat)} ${tProductCategories(`items.${cat}`)}`;
  }
  return tRoomsFallback("room_types.default");
}
