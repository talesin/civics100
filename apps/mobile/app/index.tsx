import { useRouter } from 'expo-router'
import { HomeScreen } from 'app/screens'
import { ScreenFrame } from '@/components/ScreenFrame'

// Thin route wrapper: the screen lives in packages/app and receives navigation
// as callbacks (same shape as website/src/app/page.tsx).
export default function Home() {
  const router = useRouter()

  return (
    <ScreenFrame title="US Civics Test">
      <HomeScreen
        onNavigateToGame={() => router.push('/game')}
        onNavigateToSettings={() => router.push('/settings')}
        onNavigateToResults={() => router.push('/results')}
      />
    </ScreenFrame>
  )
}
