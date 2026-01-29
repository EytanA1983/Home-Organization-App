/**
 * API Client Setup
 *
 * Call this once at application startup to configure the API client.
 *
 * Usage in main.tsx:
 *   import { setupApiClient } from '@/api/setup';
 *   setupApiClient();
 */

import { configureApiClient } from './generated';

export function setupApiClient() {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  configureApiClient({
    baseUrl: `${baseUrl}/api`,

    // Get auth token from localStorage
    getToken: () => localStorage.getItem('token'),

    // Handle unauthorized responses
    onUnauthorized: () => {
      // Clear stored tokens
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');

      // Redirect to login (unless already there)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    },

    // Handle API errors
    onError: (error) => {
      console.error('API Error:', error);

      // You can show a toast notification here
      // toast.error(error.message);
    },
  });

  console.log('API client configured:', baseUrl);
}

export default setupApiClient;
