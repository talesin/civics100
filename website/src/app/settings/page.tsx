'use client'

import { useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { SettingsScreen } from 'app/screens'

// Thin route wrapper: the screen lives in packages/app and receives navigation
// as a callback; Layout is web-only chrome.
export default function Settings() {
  const router = useRouter()

  return (
    <Layout title="Game Settings">
      <SettingsScreen onNavigateToGame={() => router.push('/game')} />
    </Layout>
  )
}
