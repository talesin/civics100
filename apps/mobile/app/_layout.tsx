import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useThemeContext } from 'app'
import { useHeaderOptions } from '@/components/headerOptions'
import { AppThemeProvider } from '@/components/ThemeProvider'

// Root stack: the (tabs) group owns the top of the screen (its navigator
// draws the header), and the game route is pushed above it with the stack
// header whose title ScreenFrame drives from the game state.
function RootStack() {
  const { theme } = useThemeContext()
  const headerOptions = useHeaderOptions()

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
