import { useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import { TamaguiProvider } from 'tamagui'
import { ThemeContext, type ThemeContextValue, type ThemeName } from 'app'
import config from '../tamagui.config'

/**
 * Native provider for the shared ThemeContext (the web half is the
 * ThemeContextBridge inside website's TamaguiProvider). Seeds from the OS
 * appearance and keeps the choice in memory: SettingsScreen's dark-mode
 * checkbox and ThemeToggle drive `setTheme`/`toggleTheme`, and Tamagui's
 * provider follows `defaultTheme` reactively. Persisting the choice through
 * LocalStorageService is Phase 6.
 */
export function AppThemeProvider({ children }: { readonly children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [theme, setTheme] = useState<ThemeName>(systemScheme === 'dark' ? 'dark' : 'light')

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
    }),
    [theme]
  )

  return (
    <TamaguiProvider config={config} defaultTheme={theme}>
      <ThemeContext value={value}>{children}</ThemeContext>
    </TamaguiProvider>
  )
}
