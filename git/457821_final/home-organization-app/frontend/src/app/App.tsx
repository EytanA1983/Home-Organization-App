import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { router } from './routes';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../utils/tokenStorage';

/**
 * Same-tab token changes (login flow dispatches `token-changed` after `queryClient.clear()` + dashboard prefetch).
 * Avoid invalidating `tasks` / `progress` here — that would force immediate refetches and undo Login prefetch.
 * Calendar anchor can depend on OAuth token shape; refresh it on token rotation.
 */
function TokenChangeQueryInvalidation() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const onTokenChanged = () => {
      void queryClient.invalidateQueries({ queryKey: ['google-calendar'] });
    };
    window.addEventListener('token-changed', onTokenChanged);
    return () => window.removeEventListener('token-changed', onTokenChanged);
  }, [queryClient]);
  return null;
}

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export default function App() {
  // Another tab changed auth tokens — avoid showing this tab's stale cached user-specific API data.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ACCESS_TOKEN_KEY || e.key === REFRESH_TOKEN_KEY) {
        queryClient.clear();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TokenChangeQueryInvalidation />
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '14px',
            maxWidth: '400px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
            style: {
              background: '#10b981',
              color: '#fff',
            },
          },
          error: {
            duration: 5000, // Errors stay longer
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: '#ef4444',
              color: '#fff',
            },
          },
          loading: {
            style: {
              background: '#3b82f6',
              color: '#fff',
            },
          },
        }}
      />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
