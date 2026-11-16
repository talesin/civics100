'use client'

import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { HomeScreen } from 'app/screens'

// Thin route wrapper: the screen lives in packages/app and receives navigation
// as callbacks; Layout is web-only chrome.
export default function Home() {
  const router = useRouter()

  return (
    <Layout title="US Civics Test">
      <HomeScreen
        onNavigateToGame={() => router.push('/game')}
        onNavigateToSettings={() => router.push('/settings')}
        onNavigateToResults={() => router.push('/results')}
      />
    </Layout>
  )
}
