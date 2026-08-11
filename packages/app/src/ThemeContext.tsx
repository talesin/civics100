/**
 * Shared theme context, split out of the website's TamaguiProvider in Phase 5
 * Stage 8. The context is PROVIDED per platform: on web the TamaguiProvider's
 * ThemeContextBridge supplies the value (backed by @tamagui/next-theme); the
 * native provider arrives in Phase 6. Providers should use the React 19
 * `<ThemeContext value={...}>` form.
 */
import { createContext, use } from 'react'

export type ThemeName = 'light' | 'dark'

export interface ThemeContextValue {
  theme: ThemeName
  toggleTheme: () => void
  setTheme: (theme: ThemeName) => void
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function useThemeContext(): ThemeContextValue {
  const context = use(ThemeContext)
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a theme provider')
  }
  return context
}
