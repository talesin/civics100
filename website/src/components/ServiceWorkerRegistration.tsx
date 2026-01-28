'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[SW] Service worker registered:', registration.scope)

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
              console.log('[SW] New content available')
            }
          })
        })
      })
      .catch((error) => {
        console.error('[SW] Service worker registration failed:', error)
      })
  }, [])

  return null
}
