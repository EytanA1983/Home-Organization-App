// src/components/ProtectedRouteAdvanced.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ROUTES } from '../utils/routes';
import api from '../api';

/**
 * ProtectedRoute (Advanced) - Enhanced route guard with token validation
 *
 * Features:
 * - Checks for token existence in localStorage
 * - Validates token with backend (/api/auth/me)
 * - Automatic token refresh if access token expired
 * - Shows loading state during validation
 * - Redirects to login with return URL
 * - Cleans up invalid tokens
 *
 * Usage:
 * <Route element={<ProtectedRouteAdvanced />}>
 *   <Route path="/home" element={<HomePage />} />
 * </Route>
 */
export const ProtectedRouteAdvanced = () => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const location = useLocation();

  useEffect(() => {
    validateAuth();
  }, []);

  const validateAuth = async () => {
    const token = localStorage.getItem("token");

    // No token - not authenticated
    if (!token) {
      setIsAuth(false);
      setIsValidating(false);
      return;
    }

    try {
      // Validate token with backend
      await api.get('/api/auth/me');
      setIsAuth(true);
    } catch (error: any) {
      console.error('Token validation failed:', error);

      // Try to refresh token if we have a refresh token
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const response = await api.post('/api/auth/refresh', {
            refresh_token: refreshToken,
          });

          // Save new tokens
          localStorage.setItem('token', response.data.access_token);
          if (response.data.refresh_token) {
            localStorage.setItem('refresh_token', response.data.refresh_token);
          }

          setIsAuth(true);
          console.log('✅ Token refreshed successfully');
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);

          // Clear invalid tokens
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          setIsAuth(false);
        }
      } else {
        // No refresh token - clear and redirect
        localStorage.removeItem('token');
        setIsAuth(false);
      }
    } finally {
      setIsValidating(false);
    }
  };

  // Loading state - prevents flicker during validation
  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-cream via-cream/95 to-cream dark:from-dark-bg dark:via-dark-surface dark:to-dark-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-sky dark:border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium flex items-center gap-2 justify-center">
            <span className="emoji">🔐</span>
            <span>מאמת הזדהות...</span>
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login with return URL if not authenticated
  if (!isAuth) {
    return (
      <Navigate
        to={ROUTES.LOGIN}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Render protected routes
  return <Outlet />;
};

export default ProtectedRouteAdvanced;
