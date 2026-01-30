'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const isDev = process.env.NODE_ENV === 'development'

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (isDev) console.log('[SW] Service worker registered:', registration.scope)

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker === null) return

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller !== null
            ) {
              // New content is available, will be used on next refresh
              if (isDev) console.log('[SW] New content available')
            }
          })
        })
      })
      .catch((error) => {
        // Keep error logging in production for debugging user issues
        console.error('[SW] Service worker registration failed:', error)
      })
  }, [])

  return null
}
