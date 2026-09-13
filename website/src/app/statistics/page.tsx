'use client'

import Layout from '@/components/Layout'
import { StatisticsScreen } from 'app/screens'

// Thin route wrapper: the screen lives in packages/app; Layout is web-only chrome.
export default function Statistics() {
  return (
    <Layout title="Question Statistics">
      <StatisticsScreen />
    </Layout>
  )
}
