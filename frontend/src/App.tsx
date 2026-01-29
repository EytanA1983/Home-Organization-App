import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavBar } from './components/NavBar';
import { ToastProvider } from './components/ToastProvider';
import { ThemeProvider } from './contexts/ThemeContext';
import { SkipLink } from './components/SkipLink';
import { PWAPrompts } from './components/PWAPrompt';
import HomePage from './pages/HomePage';
import { RoomPage } from './pages/RoomPage';
import { Settings } from './components/Settings';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { GoogleLoginRedirect } from './pages/GoogleLoginRedirect';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ROUTES } from './utils/routes';
import { useEffect, useState, lazy, Suspense } from 'react';

// Lazy load heavy components (FullCalendar is ~200KB+)
const CalendarPage = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="flex flex-col items-center gap-3">
      <div className="spinner w-10 h-10 border-4"></div>
      <span className="text-gray-600 dark:text-dark-text">טוען...</span>
    </div>
  </div>
);

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Catch-all route component that redirects based on auth status
const CatchAllRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check authentication immediately
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  // Show loading while checking
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cream dark:bg-dark-bg">
        <div className="text-gray-600 dark:text-dark-text">טוען...</div>
      </div>
    );
  }

  // Redirect based on auth status
  return <Navigate to={isAuthenticated ? ROUTES.HOME : ROUTES.LOGIN} replace />;
};

function App() {
  // Ensure theme is applied immediately on mount (before ThemeContext initializes)
  useEffect(() => {
    const theme = localStorage.getItem('theme') ?? 'light';
    const resolvedTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;

    // Update data-theme attribute for CSS variables
    document.documentElement.dataset.theme = resolvedTheme;

    // Also update class for Tailwind dark: variant
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            {/* Skip link for keyboard navigation - WCAG 2.4.1 */}
            <SkipLink targetId="main-content">דלג לתוכן הראשי</SkipLink>

            <NavBar />

            <main
              id="main-content"
              className="max-w-screen-xl 3xl:max-w-screen-2xl 4xl:max-w-screen-3xl mx-auto mt-4 px-responsive"
              role="main"
              aria-label="תוכן ראשי"
              tabIndex={-1}
            >
              <Routes>
                <Route path={ROUTES.LOGIN} element={<LoginPage />} />
                <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
                <Route path={ROUTES.GOOGLE_CALLBACK} element={<GoogleLoginRedirect />} />

                {/* Protected routes using Outlet pattern */}
                <Route element={<ProtectedRoute />}>
                  <Route path={ROUTES.HOME} element={<HomePage />} />
                  <Route path="/room/:roomId" element={<RoomPage />} />
                  <Route path={ROUTES.SETTINGS} element={<Settings />} />
                  {/* Lazy loaded - FullCalendar is heavy (~200KB) */}
                  <Route path={ROUTES.CALENDAR} element={
                    <Suspense fallback={<PageLoader />}>
                      <CalendarPage />
                    </Suspense>
                  } />
                </Route>

                {/* Catch-all route - redirect based on auth status */}
                <Route path="*" element={<CatchAllRoute />} />
              </Routes>
            </main>

            {/* Footer for screen readers */}
            <footer className="sr-only" role="contentinfo">
              <p>אלי מאור - סידור וארגון הבית</p>
            </footer>

            {/* PWA prompts (install, update, offline) */}
            <PWAPrompts />
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
export default App;
