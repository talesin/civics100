import { useRouter } from 'expo-router'
import { GameScreen } from 'app/screens'
import { ScreenFrame } from '@/components/ScreenFrame'

// Thin route wrapper. ScreenFrame is the screen's Frame so the stack header
// title tracks the game state ("Question 3/20 (#45)", "Test Complete", ...).
export default function Game() {
  const router = useRouter()

  return <GameScreen Frame={ScreenFrame} onNavigateToResults={() => router.push('/results')} />
}
