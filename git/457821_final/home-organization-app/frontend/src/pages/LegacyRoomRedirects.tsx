import { Navigate, useParams } from "react-router-dom";
import { useRooms } from "../hooks/useRooms";
import { inferProductCategoryFromRoomName } from "../domain/productCategories";
import { getCategoryRoute, ROUTES } from "../utils/routes";
import RoomPage from "./RoomPage";
import { LoadingSpinner } from "../components/LoadingSpinner";

/** `/rooms` → canonical categories hub (legacy bookmark compatibility). */
export function LegacyRoomsListRedirect() {
  return <Navigate to={ROUTES.CATEGORIES} replace />;
}

/**
 * `/rooms/:roomId` — redirect to `/categories/:key` when the legacy name maps;
 * otherwise render the legacy room detail screen (still uses numeric id + API).
 */
export function LegacyRoomDetailGate() {
  const { roomId } = useParams<{ roomId: string }>();
  const { data: rooms, isLoading } = useRooms();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const room = rooms?.find((r) => String(r.id) === String(roomId));
  const cat = room ? inferProductCategoryFromRoomName(room.name) : null;
  if (cat) {
    return <Navigate to={getCategoryRoute(cat)} replace />;
  }

  return <RoomPage />;
}
