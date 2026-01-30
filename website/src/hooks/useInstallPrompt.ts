'use client'

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface UseInstallPromptResult {
  canInstall: boolean
  isInstalled: boolean
  promptInstall: () => Promise<void>
  dismissPrompt: () => void
}

export function useInstallPrompt(): UseInstallPromptResult {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      setIsInstalled(true)
      return
    }

    // Check if user previously dismissed the prompt
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed !== null) {
      setDismissed(true)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser prompt
      e.preventDefault()
      // Store the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      )
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (deferredPrompt === null) return

    // Show the install prompt
    await deferredPrompt.prompt()

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
    }

    // Clear the deferred prompt
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const dismissPrompt = useCallback(() => {
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }, [])

  return {
    canInstall: deferredPrompt !== null && !dismissed && !isInstalled,
    isInstalled,
    promptInstall,
    dismissPrompt
  }
}
