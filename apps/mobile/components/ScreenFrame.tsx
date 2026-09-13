import { Stack, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ScrollView } from 'tamagui'
import { ErrorBoundary } from 'app/components'

export interface ScreenFrameProps {
  /** Header title — the native stand-in for the web Layout's title. */
  readonly title: string
  readonly children: React.ReactNode
}

/**
 * Per-route chrome, the native counterpart of website's Layout: sets the
 * header title on the nearest navigator (`Stack.Screen` is expo-router's
 * generic Screen — it serves the tab headers too), scrolls the page body
 * with the web Main's padding, and wraps the screen in the shared
 * ErrorBoundary. Its props match GameScreen's
 * `GameFrameProps`, so the game route passes it as `Frame` and the header
 * tracks the game state the same way the web header does.
 */
export function ScreenFrame({ title, children }: ScreenFrameProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        flex={1}
        backgroundColor="$editorialPaper"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 32,
          paddingBottom: 32 + insets.bottom
        }}
      >
        <ErrorBoundary onNavigateHome={() => router.dismissTo('/')}>{children}</ErrorBoundary>
      </ScrollView>
    </>
  )
}
