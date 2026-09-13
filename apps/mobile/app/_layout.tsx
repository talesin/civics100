import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useTheme } from 'tamagui'
import { useThemeContext } from 'app'
import { ThemeToggle } from 'app/components'
import { AppThemeProvider } from '@/components/ThemeProvider'

const HeaderRight = () => <ThemeToggle />

// The stack header stands in for the web Layout header: editorial paper/ink
// colours from the active theme and the shared ThemeToggle on the right. The
// real tab/stack navigation is Phase 6; routes set their own titles through
// ScreenFrame.
function RootStack() {
  const { theme } = useThemeContext()
  const tamaguiTheme = useTheme()
  const paper = tamaguiTheme.editorialPaper?.get() as string
  const ink = tamaguiTheme.editorialInk?.get() as string

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: paper },
          headerTintColor: ink,
          headerShadowVisible: false,
          headerRight: HeaderRight,
          contentStyle: { backgroundColor: paper }
        }}
      />
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
