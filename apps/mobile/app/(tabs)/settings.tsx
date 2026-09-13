import { useRouter } from 'expo-router'
import { SettingsScreen } from 'app/screens'
import { ScreenFrame } from '@/components/ScreenFrame'

// Thin route wrapper over the shared screen.
export default function Settings() {
  const router = useRouter()

  return (
    <ScreenFrame title="Game Settings">
      <SettingsScreen onNavigateToGame={() => router.push('/game')} />
    </ScreenFrame>
  )
}
