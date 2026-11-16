/**
 * Native half of the platform-split theme toggle: state-based single-icon
 * render off the shared ThemeContext. No SSR/hydration on native, so the web
 * half's CSS dual-icon visibility hack is unnecessary here.
 */
import { styled, useTheme } from 'tamagui'
import { Moon, Sun } from './icons'
import { XStack } from './tamagui'
import { useThemeContext } from '../ThemeContext'

const ToggleButton = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'center',
  padding: 6,
  borderRadius: 4,
  backgroundColor: 'transparent',
  borderWidth: 0
})

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeContext()
  const tamaguiTheme = useTheme()
  const muted = tamaguiTheme.editorialMuted?.get() as string

  // The visible icon is the theme the press switches TO: light shows the
  // moon, dark shows the sun (matches the web half's CSS behavior).
  return (
    <ToggleButton onPress={toggleTheme} aria-label="Toggle theme">
      {theme === 'dark' ? (
        <Sun size={18} strokeWidth={1.5} color={muted} />
      ) : (
        <Moon size={18} strokeWidth={1.5} color={muted} />
      )}
    </ToggleButton>
  )
}
