# PWA (Progressive Web App) Implementation

## Overview

This application is a full Progressive Web App with:
- **Offline Support**: Works without internet connection
- **Installable**: Can be installed on desktop and mobile devices
- **Push Notifications**: Real-time notifications from the server
- **Background Sync**: (Future) Sync data when back online

## Features

### 1. Service Worker

The service worker (`src/sw.ts`) handles:

#### Caching Strategies

| Resource Type | Strategy | Cache Duration |
|--------------|----------|----------------|
| API calls (`/api/**`) | NetworkFirst | 24 hours |
| Static assets (JS, CSS) | CacheFirst | 30 days |
| Images | CacheFirst | 60 days |
| Fonts | CacheFirst | 1 year |
| Google Fonts | CacheFirst | 1 year |
| HTML pages | NetworkFirst | 5s timeout |
| Other resources | StaleWhileRevalidate | 7 days |

#### Push Notifications

- Handles incoming push events
- Shows Hebrew notifications with RTL support
- Action buttons: "צפה" (View), "התעלם" (Dismiss)
- Clicking notification navigates to relevant page

### 2. Web App Manifest

Located at `public/manifest.json`, includes:
- App name and description (Hebrew)
- Theme colors matching the app
- Icons for all device sizes
- Shortcuts for quick actions
- RTL direction support

### 3. Install Prompt

The `usePWA` hook provides:

```typescript
const {
  isInstallable,  // Can the app be installed?
  isInstalled,    // Is it already installed?
  isOnline,       // Is user online?
  isUpdateAvailable,  // Is there a new version?
  installApp,     // Trigger install prompt
  updateApp,      // Apply pending update
} = usePWA();
```

### 4. Offline Indicator

Shows a banner when user is offline:
```
📴 אתה במצב אופליין - חלק מהתכונות עשויות להיות מוגבלות
```

## Configuration

### vite.config.ts

```typescript
VitePWA({
  strategies: 'injectManifest',  // Custom service worker
  srcDir: 'src',
  filename: 'sw.ts',
  registerType: 'autoUpdate',
  // ... manifest and caching options
})
```

### Icons

Required icon sizes:
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512
- Apple touch icon (180x180)
- Badge icon (72x72)

Generate icons using:
```bash
npm run generate-icons
```

Or use online tools:
- https://realfavicongenerator.net
- https://pwa-asset-generator.vercel.app

## Components

### PWAPrompts

Main component that includes all PWA-related UI:

```tsx
import { PWAPrompts } from './components/PWAPrompt';

function App() {
  return (
    <>
      {/* ... app content ... */}
      <PWAPrompts />
    </>
  );
}
```

Individual components:
- `PWAInstallBanner` - Install prompt
- `PWAUpdateBanner` - Update available notification
- `PWAOfflineReady` - Offline ready toast
- `OfflineIndicator` - Offline status banner

## Testing PWA

### Chrome DevTools

1. Open DevTools → Application tab
2. Check "Service Workers" section
3. Test offline mode with "Offline" checkbox
4. Check "Cache Storage" for cached resources
5. Check "Manifest" for PWA configuration

### Lighthouse

Run Lighthouse audit for PWA:
1. DevTools → Lighthouse tab
2. Select "Progressive Web App" category
3. Click "Analyze page load"

### Manual Testing

1. **Install**: Look for install icon in address bar
2. **Offline**: Turn off network, app should still work
3. **Push**: Send test notification from backend
4. **Update**: Deploy new version, check for update prompt

## Troubleshooting

### Service Worker Not Updating

```javascript
// Force update
navigator.serviceWorker.getRegistration().then(reg => {
  reg?.update();
});

// Or clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### Install Prompt Not Showing

Requires:
- HTTPS (or localhost)
- Valid manifest.json
- Service worker registered
- Not already installed

### Push Notifications Not Working

Check:
1. Notification permission granted
2. Push subscription created
3. VAPID keys configured in backend
4. Service worker active

## API Reference

### usePWA Hook

```typescript
interface PWAHookReturn {
  // State
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  isOfflineReady: boolean;
  
  // Actions
  installApp(): Promise<'accepted' | 'dismissed' | 'unavailable'>;
  updateApp(): Promise<void>;
  dismissUpdate(): void;
  dismissOfflineReady(): void;
  getCacheSize(): Promise<number>;
  clearCache(): Promise<void>;
}
```

### Service Worker Messages

```javascript
// Skip waiting for new SW
navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' });

// Clear all caches
navigator.serviceWorker.controller?.postMessage({ type: 'CLEAR_CACHE' });

// Get cache size
const channel = new MessageChannel();
channel.port1.onmessage = (e) => console.log('Size:', e.data.size);
navigator.serviceWorker.controller?.postMessage(
  { type: 'GET_CACHE_SIZE' },
  [channel.port2]
);
```

## Best Practices

1. **Cache Wisely**: Don't cache everything, focus on critical resources
2. **Update Gracefully**: Notify users of updates, don't force refresh
3. **Handle Offline**: Show meaningful UI when offline
4. **Test Thoroughly**: Test install, offline, and update flows
5. **Monitor Performance**: Check Lighthouse PWA score regularly
