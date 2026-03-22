# Legacy `/rooms` compatibility (post–Categories refactor)

The product primary navigation is **Categories** (`/categories`, `CategoryDetailPage`). The following remain **on purpose** so bookmarks, deep links, and API-backed “areas” keep working.

## Routes

- **`/rooms`** → `LegacyRoomsListRedirect` → canonical categories hub (or equivalent redirect defined there).
- **`/rooms/:roomId`** → `LegacyRoomDetailGate` → either a **category detail** URL when the legacy area maps cleanly, or **`RoomPage`** when no mapping exists.

## Utilities

- **`utils/routes.ts`**: `ROUTES.ROOMS`, `getRoomRoute`, `resolveAreaPath` — used to link API room/area records to the correct SPA path (category vs legacy room).

## UI still using “room” data

- **`RoomPage`**, **`RoomCard`**, **`HousePage` / `HouseView`**: still reflect user-defined areas from the backend; naming may say “room” in copy or i18n while UX is category-first elsewhere.
- **`InteractiveHouseMap`**: used on **`CategoriesPage`** as a visual tap map for linked API areas; navigation uses `resolveAreaPath` (category when mappable, else legacy room).

## PWA / manifest

- Install shortcuts point to **`/categories`** for the hub. **`/rooms`** remains a valid runtime route for compatibility only.

## Renamed dashboard helper

- **`getDashboardTaskCategoryLabel`** lives in `utils/dashboardTaskCategoryLabel.ts` (formerly `dashboardRoomLabel.ts`). It uses `domain/productCategories` and falls back to `rooms.room_types.default` only when a dashboard task slug does not map to a product category.
