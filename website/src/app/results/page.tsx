'use client'

import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { ResultsScreen } from 'app/screens'

// Thin route wrapper: the screen lives in packages/app and receives navigation
// as callbacks; Layout is web-only chrome.
export default function Results() {
  const router = useRouter()

  return (
    <Layout title="Test Results">
      <ResultsScreen
        onNavigateToGame={() => router.push('/game')}
        onNavigateToStatistics={() => router.push('/statistics')}
      />
    </Layout>
  )
}
