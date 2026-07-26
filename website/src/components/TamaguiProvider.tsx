'use client'

import '@tamagui/core/reset.css'
import { useServerInsertedHTML } from 'next/navigation'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { NextThemeProvider, useThemeSetting } from '@tamagui/next-theme'
import { TamaguiProvider as TamaguiProviderCore } from 'tamagui'
import tamaguiConfig from 'app/tamagui.config'

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

// Inner component that bridges @tamagui/next-theme → ThemeContext
function ThemeContextBridge({ children }: { readonly children: React.ReactNode }) {
  const themeSetting = useThemeSetting()

  // After mount, read the actual visual theme from the DOM class (t_dark)
  // set by @tamagui/next-theme's pre-hydration script. This avoids the
  // timing gap where resolvedTheme may be undefined during hydration or
  // deferred via startTransition when the theme is 'system'.
  const [domTheme, setDomTheme] = useState<ThemeName>('light')

  useEffect(() => {
    setDomTheme(
      document.documentElement.classList.contains('t_dark') ? 'dark' : 'light'
    )
  }, [])

  // Prefer context value when available; fall back to DOM-derived theme.
  const theme: ThemeName = (themeSetting.resolvedTheme as ThemeName) ?? domTheme

  // Keep domTheme in sync so the fallback stays correct during transitions.
  useEffect(() => {
    if (themeSetting.resolvedTheme != null) {
      setDomTheme(themeSetting.resolvedTheme as ThemeName)
    }
  }, [themeSetting.resolvedTheme])

  const contextValue: ThemeContextValue = useMemo(() => ({
    theme,
    toggleTheme: () => themeSetting.set(theme === 'dark' ? 'light' : 'dark'),
    setTheme: (t: ThemeName) => themeSetting.set(t),
  }), [theme, themeSetting])

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export const TamaguiProvider = ({ children }: { readonly children: React.ReactNode }): React.ReactElement => {
  const [theme, setTheme] = useState<ThemeName>('light')

  // Sync Tamagui's internal theme from DOM after hydration.
  // The next-themes pre-hydration script sets t_dark on <html> before React
  // hydrates, so we read the actual class once on mount to avoid a mismatch.
  useEffect(() => {
    const cl = document.documentElement.classList
    setTheme(cl.contains('t_dark') ? 'dark' : 'light')
  }, [])

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

  return (
    <NextThemeProvider
      onChangeTheme={(next) => setTheme(next as 'dark' | 'light')}
      skipNextHead
    >
      <TamaguiProviderCore
        config={tamaguiConfig}
        disableRootThemeClass
        defaultTheme={theme}
      >
        <ThemeContextBridge>
          {children}
        </ThemeContextBridge>
      </TamaguiProviderCore>
    </NextThemeProvider>
  )
}
