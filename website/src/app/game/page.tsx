'use client'

import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { GameScreen } from 'app/screens'

// Thin route wrapper: the screen lives in packages/app and receives navigation
// as a callback. Layout is web-only chrome; the screen renders it as its Frame
// so the header title tracks the game state ("Question 3/20 (#45)", ...).
export default function Game() {
  const router = useRouter()

  return <GameScreen Frame={Layout} onNavigateToResults={() => router.push('/results')} />
}
