import axios from 'axios';

/**
 * Axios instance configuration
 * 
 * IMPORTANT: baseURL must be a full URL (e.g., 'http://localhost:8000')
 * NOT a relative path (e.g., '/api')
 * 
 * For Axios v0.27+, if baseURL is a relative path, it may cause issues.
 * The '/api' prefix is included in the route paths (e.g., '/api/rooms'),
 * not in the baseURL.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  // baseURL should be: 'http://localhost:8000' (development)
  // or 'http://backend:8000' (Docker)
  // NOT '/api' or '/api/'
});

/**
 * מוסיף JWT לכל הבקשות (אם קיים ב‑localStorage)
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      console.warn('Unauthorized - token cleared');
      // Redirect to login if not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
