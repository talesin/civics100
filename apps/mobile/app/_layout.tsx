import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SystemUI from 'expo-system-ui'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useTheme } from 'tamagui'
import { useThemeContext } from 'app'
import { useHeaderOptions } from '@/components/headerOptions'
import { AppThemeProvider } from '@/components/ThemeProvider'

// Root stack: the (tabs) group owns the top of the screen (its navigator
// draws the header), and the game route is pushed above it with the stack
// header whose title ScreenFrame drives from the game state.
function RootStack() {
  const { theme } = useThemeContext()
  const headerOptions = useHeaderOptions()
  const paper = useTheme().editorialPaper?.get() as string

  // Root view background = editorial paper, so Android's navigation
  // transitions and the iOS over-scroll never flash the default colour.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(paper)
  }, [paper])

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={headerOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
