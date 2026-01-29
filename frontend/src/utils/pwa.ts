/**
 * PWA Utilities
 * 
 * Helper functions for PWA functionality including:
 * - Service Worker registration and updates
 * - Install prompt handling
 * - Online/offline detection
 * - Cache management
 */

// ==================== TYPES ====================

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAStatus {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

// ==================== STATE ====================

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let swRegistration: ServiceWorkerRegistration | null = null;
let updateCallback: (() => void) | null = null;

// ==================== SERVICE WORKER REGISTRATION ====================

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });

    swRegistration = registration;

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Every hour

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker is ready
          console.log('New service worker available');
          updateCallback?.();
        }
      });
    });

    console.log('Service Worker registered:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
    console.log('All Service Workers unregistered');
    return true;
  } catch (error) {
    console.error('Failed to unregister Service Workers:', error);
    return false;
  }
}

/**
 * Force update the service worker
 */
export async function updateServiceWorker(): Promise<void> {
  if (!swRegistration) return;

  try {
    await swRegistration.update();
    
    // Tell the waiting service worker to skip waiting
    const waitingWorker = swRegistration.waiting;
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      // Reload page to use new service worker
      window.location.reload();
    }
  } catch (error) {
    console.error('Failed to update Service Worker:', error);
  }
}

/**
 * Set callback for when update is available
 */
export function onUpdateAvailable(callback: () => void): void {
  updateCallback = callback;
}

// ==================== INSTALL PROMPT ====================

/**
 * Initialize install prompt capture
 */
export function initInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    console.log('Install prompt captured');
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    console.log('App installed');
  });
}

/**
 * Check if app can be installed
 */
export function canInstall(): boolean {
  return deferredPrompt !== null;
}

/**
 * Prompt user to install the app
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  if (!deferredPrompt) {
    return 'unavailable';
  }

  try {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome;
  } catch (error) {
    console.error('Install prompt failed:', error);
    return 'unavailable';
  }
}

/**
 * Check if app is running in standalone mode (installed)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://')
  );
}

// ==================== ONLINE/OFFLINE ====================

/**
 * Check if currently online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Subscribe to online/offline events
 */
export function subscribeToNetworkStatus(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

// ==================== CACHE MANAGEMENT ====================

/**
 * Get total cache size
 */
export async function getCacheSize(): Promise<number> {
  if (!('caches' in window)) return 0;

  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Failed to get cache size:', error);
    return 0;
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (!('caches' in window)) return;

  try {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    console.log('All caches cleared');
    
    // Also notify service worker
    if (swRegistration?.active) {
      swRegistration.active.postMessage({ type: 'CLEAR_CACHE' });
    }
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
}

/**
 * Get list of cached URLs
 */
export async function getCachedUrls(): Promise<string[]> {
  if (!('caches' in window)) return [];

  try {
    const cacheNames = await caches.keys();
    const urls: string[] = [];

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      urls.push(...requests.map((r) => r.url));
    }

    return urls;
  } catch (error) {
    console.error('Failed to get cached URLs:', error);
    return [];
  }
}

// ==================== PWA STATUS ====================

/**
 * Get comprehensive PWA status
 */
export async function getPWAStatus(): Promise<PWAStatus> {
  return {
    isInstallable: canInstall(),
    isInstalled: isStandalone(),
    isOnline: isOnline(),
    isUpdateAvailable: swRegistration?.waiting !== null,
    registration: swRegistration,
  };
}

// ==================== INITIALIZATION ====================

/**
 * Initialize all PWA features
 */
export function initPWA(): void {
  initInstallPrompt();
  registerServiceWorker();
}

// Export types
export type { BeforeInstallPromptEvent, PWAStatus };
