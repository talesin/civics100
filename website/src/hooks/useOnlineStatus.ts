'use client'

import { useState, useEffect } from 'react'

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial state from navigator
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine)
    }

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
