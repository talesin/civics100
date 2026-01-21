# PWA Offline Support Implementation Plan

## Overview

This plan outlines the implementation of Progressive Web App (PWA) capabilities for the Civics 100 website, enabling offline functionality and app-like installation on mobile and desktop devices.

**Priority:** Medium
**Affected Workspace:** website

---

## Background

### Why PWA?

The Civics 100 application is an ideal PWA candidate because:

- **Fully client-side** - No backend API calls required during gameplay
- **Static generation** - Predictable, cacheable assets via Next.js export
- **Local persistence** - Already uses localStorage for settings, results, and progress
- **Self-contained content** - Question data ships with the build
- **Educational use case** - Users may want to practice offline (commute, travel, areas with poor connectivity)

### Current State

| Aspect | Status |
|--------|--------|
| Service Worker | Not implemented |
| Web App Manifest | Not implemented |
| PWA icons | Only basic favicon exists |
| Offline fallback | Not implemented |
| Install prompt | Not implemented |
| Caching strategy | Not implemented |

### Target State

- Fully functional offline after first visit
- Installable on iOS, Android, and desktop
- Seamless experience indistinguishable from native app
- Automatic cache updates when new versions deploy

---

## Implementation Tasks

### Task 1: Install and Configure next-pwa

**Rationale:** The `next-pwa` package provides automatic service worker generation with sensible defaults, cache strategies, and Next.js integration.

**Step 1.1: Install dependency**

```bash
cd website
npm install next-pwa
```

**Step 1.2: Update next.config.ts**

```typescript
import type { NextConfig } from 'next'
import withPWA from 'next-pwa'

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  distDir: 'dist',
  images: {
    unoptimized: true,
  },
  transpilePackages: [
    'civics2json',
    'questionnaire',
    'tamagui',
    '@tamagui/core',
    '@tamagui/animations-css',
  ],
}

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.(png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.(js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
      },
    },
    {
      urlPattern: /\.html$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'html-cache',
      },
    },
  ],
})

export default pwaConfig(nextConfig)
```

**Files to modify:**
- `website/next.config.ts`
- `website/package.json` (dependency added via npm)

---

### Task 2: Create Web App Manifest

**Rationale:** The manifest enables browser install prompts and defines how the app appears when installed.

**Step 2.1: Create manifest.json**

Create `website/public/manifest.json`:

```json
{
  "name": "Civics 100 - U.S. Citizenship Test Practice",
  "short_name": "Civics 100",
  "description": "Practice for the U.S. Citizenship Civics Test with 100 official USCIS questions",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "en-US",
  "categories": ["education", "games"],
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Home screen showing quiz options"
    },
    {
      "src": "/screenshots/game.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Quiz question in progress"
    }
  ]
}
```

**Files to create:**
- `website/public/manifest.json`

---

### Task 3: Generate PWA Icons

**Rationale:** PWA requires multiple icon sizes for different platforms and contexts.

**Step 3.1: Create icon source**

Ensure a high-resolution source icon exists (at least 512x512, preferably 1024x1024 SVG or PNG).

**Step 3.2: Generate icon sizes**

Create `website/public/icons/` directory with the following icons:

| File | Size | Purpose |
|------|------|---------|
| `icon-72.png` | 72x72 | Android legacy |
| `icon-96.png` | 96x96 | Android legacy |
| `icon-128.png` | 128x128 | Chrome Web Store |
| `icon-144.png` | 144x144 | iOS/Android |
| `icon-152.png` | 152x152 | iOS iPad |
| `icon-192.png` | 192x192 | Android Chrome (required) |
| `icon-384.png` | 384x384 | Android splash |
| `icon-512.png` | 512x512 | Android splash (required) |
| `icon-maskable-192.png` | 192x192 | Android adaptive icon |
| `icon-maskable-512.png` | 512x512 | Android adaptive icon |

**Maskable icons:** Should have 10% safe-zone padding around the logo to prevent clipping on different Android launchers.

**Tool recommendation:** Use a tool like `pwa-asset-generator` or design manually:

```bash
npx pwa-asset-generator ./public/icon.svg ./public/icons --background "#2563eb" --splash-only false --icon-only true
```

**Files to create:**
- `website/public/icons/` (directory with all icon sizes)

---

### Task 4: Update Layout Metadata

**Rationale:** PWA metadata in the HTML head enables proper theme colors, Apple-specific features, and manifest linking.

**Step 4.1: Update layout.tsx metadata**

Update `website/src/app/layout.tsx`:

```typescript
import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Civics 100',
  description: 'Practice for the U.S. Citizenship Civics Test',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Civics 100',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}
```

**Step 4.2: Add Apple touch icons to head**

In layout.tsx, add to the `<head>`:

```tsx
<head>
  <link rel="apple-touch-icon" href="/icons/icon-152.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />
</head>
```

**Files to modify:**
- `website/src/app/layout.tsx`

---

### Task 5: Create Offline Fallback Page

**Rationale:** When a user is offline and tries to access an uncached page, they should see a friendly offline message instead of browser error.

**Step 5.1: Create offline page**

Create `website/public/offline.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Civics 100</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      background: #f9fafb;
      color: #111827;
    }
    @media (prefers-color-scheme: dark) {
      body { background: #1f2937; color: #f9fafb; }
    }
    .container { text-align: center; max-width: 400px; }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #6b7280; margin-bottom: 1.5rem; }
    button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 1rem;
      cursor: pointer;
    }
    button:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. The app will work again once you're back online.</p>
    <button onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>
```

**Step 5.2: Configure next-pwa to use offline fallback**

Update the pwa config in `next.config.ts`:

```typescript
const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  fallbacks: {
    document: '/offline.html',
  },
  // ... rest of config
})
```

**Files to create/modify:**
- `website/public/offline.html` (create)
- `website/next.config.ts` (modify)

---

### Task 6: Add Install Prompt Component (Optional Enhancement)

**Rationale:** Provides a user-friendly way to prompt installation rather than relying solely on browser UI.

**Step 6.1: Create install prompt hook**

Create `website/src/hooks/useInstallPrompt.ts`:

```typescript
'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) return false

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    setDeferredPrompt(null)
    setIsInstallable(false)

    return outcome === 'accepted'
  }

  return { isInstallable, isInstalled, promptInstall }
}
```

**Step 6.2: Create install banner component**

Create `website/src/components/InstallPrompt.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { XStack, YStack, Text, Button } from 'tamagui'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { useThemeContext, themeColors } from '@/components/TamaguiProvider'

export function InstallPrompt() {
  const { isInstallable, promptInstall } = useInstallPrompt()
  const [dismissed, setDismissed] = useState(false)
  const { theme } = useThemeContext()
  const colors = themeColors[theme]

  if (!isInstallable || dismissed) return null

  const handleInstall = async () => {
    await promptInstall()
  }

  return (
    <XStack
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      padding="$3"
      backgroundColor={colors.cardBg}
      borderTopWidth={1}
      borderTopColor={colors.border}
      justifyContent="space-between"
      alignItems="center"
      zIndex={1000}
    >
      <YStack flex={1}>
        <Text fontWeight="600" color={colors.text}>
          Install Civics 100
        </Text>
        <Text fontSize="$2" color={colors.textMuted}>
          Add to your home screen for offline access
        </Text>
      </YStack>
      <XStack gap="$2">
        <Button
          size="$3"
          onPress={() => setDismissed(true)}
          backgroundColor="transparent"
        >
          Not now
        </Button>
        <Button
          size="$3"
          onPress={handleInstall}
          backgroundColor="$primary"
          color="white"
        >
          Install
        </Button>
      </XStack>
    </XStack>
  )
}
```

**Files to create:**
- `website/src/hooks/useInstallPrompt.ts`
- `website/src/components/InstallPrompt.tsx`

---

### Task 7: Add Offline Status Indicator (Optional Enhancement)

**Rationale:** Users should know when they're offline and that the app still works.

**Step 7.1: Create offline status hook**

Create `website/src/hooks/useOnlineStatus.ts`:

```typescript
'use client'

import { useState, useEffect } from 'react'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

**Step 7.2: Create offline indicator component**

Create `website/src/components/OfflineIndicator.tsx`:

```typescript
'use client'

import { XStack, Text } from 'tamagui'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <XStack
      position="fixed"
      top={0}
      left={0}
      right={0}
      padding="$2"
      backgroundColor="#f59e0b"
      justifyContent="center"
      zIndex={1000}
    >
      <Text color="white" fontWeight="600" fontSize="$2">
        You're offline - changes will sync when reconnected
      </Text>
    </XStack>
  )
}
```

**Files to create:**
- `website/src/hooks/useOnlineStatus.ts`
- `website/src/components/OfflineIndicator.tsx`

---

### Task 8: Update .gitignore

**Rationale:** next-pwa generates service worker files that should not be committed.

Add to `website/.gitignore`:

```gitignore
# PWA generated files
public/sw.js
public/sw.js.map
public/workbox-*.js
public/workbox-*.js.map
public/worker-*.js
public/worker-*.js.map
```

**Files to modify:**
- `website/.gitignore`

---

## Implementation Order

| Order | Task | Complexity | Dependencies |
|-------|------|------------|--------------|
| 1 | Task 3: Generate PWA icons | Low | None |
| 2 | Task 2: Create manifest.json | Low | Task 3 (icons) |
| 3 | Task 1: Install next-pwa | Medium | None |
| 4 | Task 4: Update layout metadata | Low | Task 2 |
| 5 | Task 5: Create offline fallback | Low | Task 1 |
| 6 | Task 8: Update .gitignore | Low | Task 1 |
| 7 | Task 6: Install prompt (optional) | Medium | Task 1 |
| 8 | Task 7: Offline indicator (optional) | Low | None |

---

## Verification

### Automated Testing

```bash
cd website
npm run build
npm run lint
npm test
```

### Manual Testing Checklist

#### Build Verification

- [ ] `npm run build` completes without errors
- [ ] Service worker files generated in `dist/`
- [ ] Manifest.json present in `dist/`
- [ ] All icon files present in `dist/icons/`

#### PWA Installation

- [ ] Chrome shows install icon in address bar
- [ ] "Add to Home Screen" works on Android Chrome
- [ ] "Add to Home Screen" works on iOS Safari
- [ ] Installed app opens in standalone mode (no browser chrome)
- [ ] App icon appears correctly on home screen

#### Offline Functionality

- [ ] Visit site, then disconnect from internet
- [ ] Refresh page - app still loads
- [ ] Navigate between pages while offline
- [ ] Start a quiz while offline - works correctly
- [ ] Complete a quiz while offline - results save to localStorage
- [ ] Reconnect - no data loss

#### Lighthouse Audit

Run Lighthouse PWA audit in Chrome DevTools:

- [ ] Installable: Yes
- [ ] PWA Optimized: All checks pass
- [ ] Offline capability: Verified

---

## Caching Strategy Reference

| Resource Type | Strategy | Rationale |
|---------------|----------|-----------|
| HTML pages | NetworkFirst | Always try for fresh content, fall back to cache |
| JS/CSS bundles | StaleWhileRevalidate | Serve cached version immediately, update in background |
| Images | CacheFirst | Rarely change, prioritize speed |
| Question data JSON | CacheFirst | Static, ships with build |
| API calls (if any) | NetworkFirst | Need fresh data when available |

---

## Rollback Plan

If PWA implementation causes issues:

1. Remove `next-pwa` from dependencies
2. Revert `next.config.ts` to original
3. Delete generated SW files from `public/`
4. Remove manifest and icon references from layout.tsx

The app will continue to function as a standard web application.

---

## Future Enhancements

After initial PWA implementation:

1. **Background sync** - Queue answer submissions if offline, sync when reconnected
2. **Push notifications** - Daily practice reminders
3. **Periodic updates** - Check for new question data in background
4. **Share API** - Share quiz results natively
5. **Shortcuts** - Quick actions from app icon long-press

---

## References

- [Next.js PWA Guide](https://github.com/shadowwalker/next-pwa)
- [Web App Manifest Spec](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox Strategies](https://developer.chrome.com/docs/workbox/modules/workbox-strategies/)
- [PWA Builder](https://www.pwabuilder.com/) - Icon and manifest generator
