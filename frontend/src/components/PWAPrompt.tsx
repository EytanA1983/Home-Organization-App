/**
 * PWA Install Prompt Component
 *
 * Shows prompts for:
 * - Installing the app
 * - Updates available
 * - Offline ready notification
 */

import React, { memo, useCallback } from 'react';
import { usePWA } from '../hooks/usePWA';

interface PWAPromptProps {
  className?: string;
}

/**
 * PWA Install Banner - shown when app can be installed
 */
export const PWAInstallBanner = memo(function PWAInstallBanner({ className = '' }: PWAPromptProps) {
  const { isInstallable, isInstalled, installApp } = usePWA();

  const handleInstall = useCallback(async () => {
    const result = await installApp();
    console.log('Install result:', result);
  }, [installApp]);

  // Don't show if already installed or not installable
  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96
        bg-white dark:bg-dark-surface rounded-xl shadow-elevated p-4
        flex items-center gap-4 z-50 animate-fade-in-up ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0 text-4xl">🏡</div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-dark-text">
          התקן את האפליקציה
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          גישה מהירה מהמסך הראשי
        </p>
      </div>
      <button
        onClick={handleInstall}
        className="btn-primary px-4 py-2 text-sm font-medium"
        aria-label="התקן אפליקציה"
      >
        התקן
      </button>
    </div>
  );
});

/**
 * PWA Update Banner - shown when update is available
 */
export const PWAUpdateBanner = memo(function PWAUpdateBanner({ className = '' }: PWAPromptProps) {
  const { isUpdateAvailable, updateApp, dismissUpdate } = usePWA();

  const handleUpdate = useCallback(async () => {
    await updateApp();
  }, [updateApp]);

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96
        bg-sky text-white rounded-xl shadow-elevated p-4
        flex items-center gap-4 z-50 animate-fade-in-up ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0 text-4xl">🔄</div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold">עדכון זמין!</h3>
        <p className="text-sm opacity-90">
          גרסה חדשה מוכנה להתקנה
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={dismissUpdate}
          className="px-3 py-1.5 text-sm font-medium bg-white/20 hover:bg-white/30 rounded-lg transition"
          aria-label="אחר כך"
        >
          אחר כך
        </button>
        <button
          onClick={handleUpdate}
          className="px-3 py-1.5 text-sm font-medium bg-white text-sky rounded-lg hover:bg-white/90 transition"
          aria-label="עדכן עכשיו"
        >
          עדכן
        </button>
      </div>
    </div>
  );
});

/**
 * PWA Offline Ready Toast - shown when app is ready for offline use
 */
export const PWAOfflineReady = memo(function PWAOfflineReady({ className = '' }: PWAPromptProps) {
  const { isOfflineReady, dismissOfflineReady } = usePWA();

  if (!isOfflineReady) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80
        bg-emerald-500 text-white rounded-xl shadow-elevated p-4
        flex items-center gap-3 z-50 animate-fade-in-up ${className}`}
      role="alert"
      aria-live="polite"
    >
      <span className="text-2xl">✓</span>
      <div className="flex-1">
        <p className="font-medium">האפליקציה מוכנה לשימוש אופליין</p>
      </div>
      <button
        onClick={dismissOfflineReady}
        className="p-1 hover:bg-white/20 rounded transition"
        aria-label="סגור"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
});

/**
 * Offline Indicator - shows when user is offline
 */
export const OfflineIndicator = memo(function OfflineIndicator({ className = '' }: PWAPromptProps) {
  const { isOnline } = usePWA();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 px-4 z-50 ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <span className="text-sm font-medium">
        📴 אתה במצב אופליין - חלק מהתכונות עשויות להיות מוגבלות
      </span>
    </div>
  );
});

/**
 * Combined PWA Prompts - includes all PWA-related prompts
 */
export const PWAPrompts = memo(function PWAPrompts() {
  return (
    <>
      <OfflineIndicator />
      <PWAInstallBanner />
      <PWAUpdateBanner />
      <PWAOfflineReady />
    </>
  );
});

export default PWAPrompts;
