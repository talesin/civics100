import { useCallback, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'
import { Effect } from 'effect'
import { TamaguiProvider } from 'tamagui'
import { ThemeContext, type ThemeContextValue, type ThemeName } from 'app'
import { AppRuntime, LocalStorageService } from 'app/services'
import config from '../tamagui.config'

const loadThemePreference = Effect.flatMap(LocalStorageService, (storage) =>
  storage.getThemePreference()
)

const saveThemePreference = (theme: ThemeName) =>
  Effect.flatMap(LocalStorageService, (storage) => storage.saveThemePreference(theme))

/**
 * Native provider for the shared ThemeContext (the web half is the
 * ThemeContextBridge inside website's TamaguiProvider). Seeds from the OS
 * appearance, then adopts the persisted choice from LocalStorageService
 * (AsyncStorage) once it loads; every explicit change — SettingsScreen's
 * dark-mode checkbox, the header ThemeToggle — is written back. Tamagui's
 * provider follows `defaultTheme` reactively.
 */
export function AppThemeProvider({ children }: { readonly children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [theme, setThemeState] = useState<ThemeName>(systemScheme === 'dark' ? 'dark' : 'light')

  // Adopt the saved preference (external data → state is the sanctioned
  // effect shape). No preference saved = keep following the system.
  useEffect(() => {
    let cancelled = false
    void AppRuntime.runPromise(loadThemePreference).then((saved) => {
      if (!cancelled && saved !== null) setThemeState(saved)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next)
    void AppRuntime.runPromise(saveThemePreference(next))
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark')
    }),
    [theme, setTheme]
  )

  return (
    <TamaguiProvider config={config} defaultTheme={theme}>
      <ThemeContext value={value}>{children}</ThemeContext>
    </TamaguiProvider>
  )
}
