import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { ROUTES } from '../utils/routes';

export const GoogleLoginRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      // שליחת קוד ל‑backend (endpoint שהגדרנו)
      api
        .get('/api/auth/google/callback', { params: { code } })
        .then(() => navigate(ROUTES.SETTINGS, { replace: true }))
        .catch((error) => {
          console.error('Error in Google callback:', error);
          navigate(`${ROUTES.SETTINGS}?error=google_auth_failed`, { replace: true });
        });
    } else {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [location.search, navigate]);

  return <p>ממתין לאימות Google…</p>;
};
