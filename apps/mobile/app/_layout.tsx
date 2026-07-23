import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { TamaguiProvider } from 'tamagui'
import config from '../tamagui.config'

// Root layout: provide Tamagui + safe-area context to every route, host the stack.
// Phase 6 swaps the bare Stack for the real tab/stack navigation; Phase 1 just needs a
// single screen to render.
export default function RootLayout() {
  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </TamaguiProvider>
  )
}
