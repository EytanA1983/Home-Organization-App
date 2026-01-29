/**
 * קבועי ניתוב - כל הנתיבים של האפליקציה
 * שימוש: import { ROUTES } from '../utils/routes';
 */
export const ROUTES = {
  // Public routes
  LOGIN: '/login',
  REGISTER: '/register',
  GOOGLE_CALLBACK: '/auth/google/callback',
  
  // Protected routes
  HOME: '/',
  SETTINGS: '/settings',
  CALENDAR: '/calendar',
  ROOM: (roomId: number | string) => `/room/${roomId}`,
} as const;

/**
 * Helper function to check if a route is protected
 */
export const isProtectedRoute = (path: string): boolean => {
  return path !== ROUTES.LOGIN && 
         path !== ROUTES.REGISTER && 
         path !== ROUTES.GOOGLE_CALLBACK;
};

/**
 * Helper function to get room route
 */
export const getRoomRoute = (roomId: number | string): string => {
  return ROUTES.ROOM(roomId);
};
