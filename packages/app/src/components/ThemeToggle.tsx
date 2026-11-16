/**
 * Web half of the platform-split theme toggle. Both icons are always in the
 * DOM; the .theme-icon-sun / .theme-icon-moon classes (globals.css) switch
 * visibility off the html.t_dark class set pre-hydration. This is load-bearing:
 * a state-based single-icon render hydration-mismatches (server renders the
 * light icon, the client resolves dark), and React's recovery re-render wipes
 * next-theme's t_dark class from <html>, flipping the whole page light. The
 * native half (ThemeToggle.native.tsx) renders state-based — no SSR there.
 */
import { styled, useTheme } from 'tamagui'
import { Moon, Sun } from './icons'
import { XStack } from './tamagui'
import { useThemeContext } from '../ThemeContext'

const ToggleButton = styled(XStack, {
  tag: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 6,
  borderRadius: 4,
  backgroundColor: 'transparent',
  borderWidth: 0,
  cursor: 'pointer'
})

export default function ThemeToggle() {
  const { toggleTheme } = useThemeContext()
  const theme = useTheme()
  const muted = theme.editorialMuted?.get() as string

  return (
    <ToggleButton onPress={toggleTheme} aria-label="Toggle theme">
      <span className="theme-icon-sun" style={{ color: muted }}>
        <Sun size={18} strokeWidth={1.5} />
      </span>
      <span className="theme-icon-moon" style={{ color: muted }}>
        <Moon size={18} strokeWidth={1.5} />
      </span>
    </ToggleButton>
  )
}
