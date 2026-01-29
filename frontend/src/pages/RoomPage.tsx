import { useParams } from 'react-router-dom';
import { TaskList } from '../components/TaskList';
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import { getRoomEmoji } from '../utils/roomColors';

type Room = { id: number; name: string };

/**
 * RoomPage - displays tasks for a specific room
 * Optimized with useMemo to prevent unnecessary re-renders
 */
export const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();

  // Parse roomId once
  const parsedRoomId = useMemo(() => Number(roomId), [roomId]);

  // Use React Query for room data (with caching)
  const { data: room, isLoading, error } = useQuery<Room>({
    queryKey: ['room', parsedRoomId],
    queryFn: async () => {
      const { data } = await api.get(`/api/rooms/${parsedRoomId}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!parsedRoomId && !isNaN(parsedRoomId),
  });

  // Memoize filter object to prevent TaskList re-renders
  const taskFilter = useMemo(() => ({
    roomId: parsedRoomId
  }), [parsedRoomId]);

  // Memoize room emoji
  const emoji = useMemo(() => {
    if (!room?.name) return '🏠';
    return getRoomEmoji(room.name);
  }, [room?.name]);

  // Memoize background image source
  const roomBackgroundImage = useMemo(() => {
    if (!room?.name) return null;

    const name = room.name.toLowerCase();
    const isBathroom = name.includes('שירותים') || name.includes('bathroom') || name.includes('אמבטיה');
    const isBedroom = name.includes('שינה') || name.includes('bedroom') || name.includes('חדר שינה');

    if (isBathroom) {
      return '/bathroom-background.jpg';
    }

    if (isBedroom) {
      return '/bedroom-background.jpg';
    }

    return null;
  }, [room?.name]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky"></div>
        <span className="mr-3 text-gray-600 dark:text-gray-300 flex items-center gap-2">
          <span className="emoji">⏳</span>
          <span>טוען חדר...</span>
        </span>
      </div>
    );
  }

  // Error state
  if (error || !room) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[50vh]">
        <span className="emoji text-5xl mb-4">😕</span>
        <h2 className="text-xl font-bold text-gray-800 dark:text-dark-text mb-2">
          החדר לא נמצא
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          {(error as Error)?.message || 'לא הצלחנו לטעון את פרטי החדר'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-cream dark:bg-dark-bg">
      {/* Background image (lazy-loaded with responsive srcset) */}
      {roomBackgroundImage && (
        <>
          <picture>
            {/* WebP sources for better compression */}
            <source
              srcSet={`
                ${roomBackgroundImage.replace(/\.(jpg|jpeg|png|svg)$/i, '-400.webp')} 400w,
                ${roomBackgroundImage.replace(/\.(jpg|jpeg|png|svg)$/i, '-800.webp')} 800w,
                ${roomBackgroundImage.replace(/\.(jpg|jpeg|png|svg)$/i, '-1200.webp')} 1200w
              `}
              sizes="100vw"
              type="image/webp"
            />
            {/* Fallback to original format */}
            <img
              src={roomBackgroundImage}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover opacity-30 dark:opacity-40"
              aria-hidden="true"
            />
          </picture>
          <div className="absolute inset-0 bg-cream/60 dark:bg-dark-bg/60 backdrop-blur-[2px]" />
        </>
      )}

      {/* Content */}
      <div className="relative z-10 p-4">
        {/* Room header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="emoji text-fluid-3xl">{emoji}</span>
          <h2 className="text-fluid-3xl font-bold text-gray-800 dark:text-dark-text">
            {room.name}
          </h2>
        </div>

        {/* Task list */}
        <TaskList filter={taskFilter} />
      </div>
    </div>
  );
};

export default RoomPage;
