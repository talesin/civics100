import { StatisticsScreen } from 'app/screens'
import { ScreenFrame } from '@/components/ScreenFrame'

// Thin route wrapper over the shared screen (no navigation callbacks).
export default function Statistics() {
  return (
    <ScreenFrame title="Question Statistics">
      <StatisticsScreen />
    </ScreenFrame>
  )
}
