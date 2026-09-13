import { useRouter } from 'expo-router'
import { ResultsScreen } from 'app/screens'
import { ScreenFrame } from '@/components/ScreenFrame'

// Thin route wrapper over the shared screen.
export default function Results() {
  const router = useRouter()

  return (
    <ScreenFrame title="Test Results">
      <ResultsScreen
        onNavigateToGame={() => router.push('/game')}
        onNavigateToStatistics={() => router.push('/statistics')}
      />
    </ScreenFrame>
  )
}
