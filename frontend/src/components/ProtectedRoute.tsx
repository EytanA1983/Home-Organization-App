// src/components/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { ROUTES } from '../utils/routes';

/**
 * ProtectedRoute - Guards routes that require authentication
 *
 * Features:
 * - Checks for valid token in localStorage
 * - Shows loading state while checking auth
 * - Redirects to login if not authenticated
 * - Prevents flicker/flash during auth check
 *
 * Usage:
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/home" element={<HomePage />} />
 * </Route>
 */
export const ProtectedRoute = () => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem("token");

    // Optional: You can add token validation here
    // For now, we just check if token exists
    setIsAuth(!!token);

    // Future enhancement: Verify token with backend
    // try {
    //   const response = await api.get('/api/auth/me');
    //   setIsAuth(true);
    // } catch {
    //   localStorage.removeItem('token');
    //   localStorage.removeItem('refresh_token');
    //   setIsAuth(false);
    // }
  }, []);

  // Loading state - prevents flicker during auth check
  if (isAuth === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-cream via-cream/95 to-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-sky mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium flex items-center gap-2">
            <span className="emoji">⏳</span>
            <span>טוען...</span>
          </p>
        </div>
      </div>
    );
  }

  // Render protected routes or redirect to login
  return isAuth ? <Outlet /> : <Navigate to={ROUTES.LOGIN} replace />;
};
