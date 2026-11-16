import { useEffect } from 'react'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useTheme } from 'tamagui'
import { useThemeContext } from 'app'
import { useHeaderOptions } from '@/components/headerOptions'
import { AppThemeProvider } from '@/components/ThemeProvider'

// Hold the native splash (module scope, before the first render) until the
// tree below has committed with the persisted theme: AppThemeProvider renders
// nothing until the preference loads, and RootStack releases the splash from a
// mount effect, so the first visible frame is already light or dark.
void SplashScreen.preventAutoHideAsync()

// Root stack: the (tabs) group owns the top of the screen (its navigator
// draws the header), and the game route is pushed above it with the stack
// header whose title ScreenFrame drives from the game state. The group's
// `title` only ever shows as the game header's back label.
function RootStack() {
  const { theme } = useThemeContext()
  const headerOptions = useHeaderOptions()
  const paper = useTheme().editorialPaper?.get() as string

  // Root view background = editorial paper, so Android's navigation
  // transitions and the iOS over-scroll never flash the default colour.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(paper)
  }, [paper])

  // First commit of the themed tree — release the splash held above.
  useEffect(() => {
    void SplashScreen.hideAsync()
  }, [])

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={headerOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Home' }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <AppThemeProvider>
      <SafeAreaProvider>
        <RootStack />
      </SafeAreaProvider>
    </AppThemeProvider>
  )
}
