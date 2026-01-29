import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { ROUTES } from '../utils/routes';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use URLSearchParams for x-www-form-urlencoded body
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const response = await api.post('/api/auth/login', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Save both access and refresh tokens
      const { access_token, refresh_token } = response.data;
      localStorage.setItem('token', access_token);

      // Store refresh token for automatic token renewal
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      // Redirect to home
      navigate(ROUTES.HOME);
      window.location.reload(); // Refresh to update auth state
    } catch (err: any) {
      setError(err.response?.data?.detail || 'שגיאה בהתחברות. נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-cream via-cream/95 to-cream p-4 relative overflow-hidden">
      {/* רקע - דלת כניסה */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-full max-w-md h-[600px] bg-gradient-to-b from-amber-800/20 via-amber-700/15 to-amber-900/20 rounded-3xl border-8 border-amber-900/30 shadow-2xl relative">
          {/* ידית דלת */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-amber-700/40 border-4 border-amber-800/50 flex items-center justify-center">
            <span className="emoji text-2xl">🚪</span>
          </div>
          {/* מסגרת דלת */}
          <div className="absolute inset-4 border-4 border-amber-800/20 rounded-2xl"></div>
        </div>
      </div>

      {/* תוכן מעל הדלת */}
      <div className="relative z-10 text-center mb-8 px-4">
        <h1 className="text-fluid-3xl sm:text-fluid-4xl font-bold text-gray-800 mb-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          <span className="emoji text-fluid-4xl">🏡</span>
          <span>אלי מאור – סידור וארגון הבית</span>
        </h1>
        <p className="text-gray-600 text-fluid-lg">ברוכים הבאים לבית שלנו</p>
      </div>

      {/* שלט תליה - תיבת ההתחברות */}
      <div className="relative z-10 w-full max-w-md">
        {/* חבל תליה */}
        <div className="flex justify-center mb-2">
          <div className="w-1 h-12 bg-gradient-to-b from-amber-700/60 to-amber-800/40 rounded-full"></div>
        </div>

        {/* שלט אליפסה */}
        <div className="bg-gradient-to-br from-white via-cream to-white rounded-[60%] shadow-2xl border-4 border-amber-800/30 p-8 relative transform hover:scale-105 transition-transform duration-300">
          {/* קישוטי פינות */}
          <div className="absolute top-4 left-4 w-3 h-3 bg-amber-700/30 rounded-full"></div>
          <div className="absolute top-4 right-4 w-3 h-3 bg-amber-700/30 rounded-full"></div>
          <div className="absolute bottom-4 left-4 w-3 h-3 bg-amber-700/30 rounded-full"></div>
          <div className="absolute bottom-4 right-4 w-3 h-3 bg-amber-700/30 rounded-full"></div>

          <div className="text-center mb-6">
            <span className="emoji text-5xl block mb-3">🔑</span>
            <h2 className="text-2xl font-bold text-gray-800">כניסה לבית</h2>
            <p className="text-gray-600 mt-2 text-sm">התחבר לחשבון שלך</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <span className="emoji text-xl">⚠️</span>
              <span className="text-red-800">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <span className="emoji">📧</span>
                <span>אימייל</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <span className="emoji">🔒</span>
                <span>סיסמה</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky to-sky/90 text-white py-3 px-4 rounded-lg hover:from-sky/90 hover:to-sky transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>מתחבר...</span>
                </>
              ) : (
                <>
                  <span className="emoji">🚀</span>
                  <span>התחבר</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              אין לך חשבון?{' '}
              <Link to={ROUTES.REGISTER} className="text-sky hover:underline font-medium">
                הירשם כאן
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
