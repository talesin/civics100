'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const isDev = process.env.NODE_ENV === 'development'

    // When the SW controller changes (new SW took over), reload so the page
    // runs against fresh assets rather than whatever was cached by the old SW.
    // The new sw.js uses network-first for navigation, so the reload is safe.
    const handleControllerChange = () => {
      if (isDev) console.log('[SW] Controller changed — reloading for fresh assets')
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    // Safety net: if a module failed to load because the SW served a stale
    // bundle (e.g. 'module factory is not available', 'ChunkLoadError'), do a
    // one-shot hard reload. The sessionStorage flag prevents infinite loops.
    // If we reloaded due to a stale module and it worked, clear the flag so
    // the safety net can fire again if needed in a future deploy.
    const RELOAD_FLAG = 'sw-stale-reload'
    sessionStorage.removeItem(RELOAD_FLAG)

    const handleModuleError = (event: ErrorEvent) => {
      const msg = event.message ?? ''
      const isStaleModule =
        msg.includes('module factory is not available') ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Loading chunk')

      if (isStaleModule && sessionStorage.getItem(RELOAD_FLAG) === null) {
        sessionStorage.setItem(RELOAD_FLAG, '1')
        if (isDev) console.log('[SW] Stale module detected — reloading')
        window.location.reload()
      }
    }
    window.addEventListener('error', handleModuleError)

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        if (isDev) console.log('[SW] Registered:', registration.scope)

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker === null) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller !== null) {
              if (isDev) console.log('[SW] New version installed')
              // skipWaiting is already called in sw.js; controllerchange will
              // fire and trigger the reload above.
            }
          })
        })
      })
      .catch((error) => {
        console.error('[SW] Registration failed:', error)
      })

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
      window.removeEventListener('error', handleModuleError)
    }
  }, [])

  return null
}
