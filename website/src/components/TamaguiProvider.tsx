'use client'

import '@tamagui/core/reset.css'
import { useServerInsertedHTML } from 'next/navigation'
import React, { createContext, useContext, useMemo } from 'react'
import { NextThemeProvider, useRootTheme, useThemeSetting } from '@tamagui/next-theme'
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

// CSS variable-based theme colors for use in inline styles.
// These produce identical HTML on server and client — the actual colors
// are resolved at paint time via the html.t_dark class.
export const cssColors = {
  text: 'var(--theme-text)',
  textMuted: 'var(--theme-text-muted)',
  background: 'var(--theme-background)',
  backgroundHover: 'var(--theme-background-hover)',
  cardBg: 'var(--theme-card-bg)',
  border: 'var(--theme-border)',
  primary: 'var(--theme-primary)',
  primaryHover: 'var(--theme-primary-hover)',
  success: 'var(--theme-success)',
  error: 'var(--theme-error)',
  purple: 'var(--theme-purple)',
  successBg: 'var(--theme-success-bg)',
  successText: 'var(--theme-success-text)',
  errorBg: 'var(--theme-error-bg)',
  errorText: 'var(--theme-error-text)',
  iconStroke: 'var(--theme-icon-stroke)',
} as const

// Inner component that bridges @tamagui/next-theme → ThemeContext
function ThemeContextBridge({ children }: { readonly children: React.ReactNode }) {
  const themeSetting = useThemeSetting()
  const theme = (themeSetting.resolvedTheme as ThemeName) ?? 'light'

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
  const [theme, setTheme] = useRootTheme()

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
