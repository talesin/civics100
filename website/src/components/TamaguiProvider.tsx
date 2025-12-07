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
