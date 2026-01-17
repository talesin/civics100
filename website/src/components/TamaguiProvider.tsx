'use client'

import '@tamagui/core/reset.css'
import { useServerInsertedHTML } from 'next/navigation'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { TamaguiProvider as TamaguiProviderCore } from 'tamagui'
import tamaguiConfig from '../../tamagui.config'

type ThemeName = 'light' | 'dark'

interface ThemeContextValue {
  theme: ThemeName
  toggleTheme: () => void
  setTheme: (theme: ThemeName) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function useThemeContext() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a TamaguiProvider')
  }
  return context
}

export const themeColors = {
  light: {
    // Text
    text: '#111827',
    textMuted: '#6b7280',

    // Backgrounds
    background: '#ffffff',
    backgroundHover: '#f9fafb',
    cardBg: '#ffffff',

    // Borders
    border: '#d1d5db',

    // Semantic colors
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    success: '#16a34a',
    error: '#dc2626',
    purple: '#9333ea',

    // Badge backgrounds
    successBg: '#dcfce7',
    successText: '#166534',
    errorBg: '#fee2e2',
    errorText: '#991b1b',

    // Icons
    iconStroke: '#9ca3af',
  },
  dark: {
    // Text
    text: '#e5e5e5',
    textMuted: '#a1a1aa',

    // Backgrounds
    background: '#111827',
    backgroundHover: '#1f2937',
    cardBg: '#1a1a1a',

    // Borders
    border: '#404040',

    // Semantic colors
    primary: '#60a5fa',
    primaryHover: '#3b82f6',
    success: '#22c55e',
    error: '#ef4444',
    purple: '#a78bfa',

    // Badge backgrounds
    successBg: '#166534',
    successText: '#bbf7d0',
    errorBg: '#7f1d1d',
    errorText: '#fecaca',

    // Icons
    iconStroke: '#a1a1aa',
  }
} as const

export type ThemeColors = typeof themeColors.light

export function TamaguiProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    setMounted(true)
    let initialTheme: ThemeName = 'light'
    try {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'dark' || savedTheme === 'light') {
        initialTheme = savedTheme
      } else {
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        initialTheme = systemDark ? 'dark' : 'light'
      }
    } catch {
      // Fallback to system preference if localStorage fails
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      initialTheme = systemDark ? 'dark' : 'light'
    }
    setThemeState(initialTheme)
    // Sync html.dark class for CSS-based styling
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme)
    // Sync html.dark class for CSS-based styling
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem('theme', newTheme)
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  useServerInsertedHTML(() => {
    const styles = tamaguiConfig.getNewCSS()

    if (styles !== undefined && styles !== '') {
      return (
        <style
          dangerouslySetInnerHTML={{ __html: styles }}
          id="tamagui-ssr"
        />
      )
    }

    return null
  })

  const contextValue: ThemeContextValue = {
    theme,
    toggleTheme,
    setTheme,
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <TamaguiProviderCore
        config={tamaguiConfig}
        defaultTheme={mounted ? theme : 'light'}
      >
        {children}
      </TamaguiProviderCore>
    </ThemeContext.Provider>
  )
}
