import React from 'react'
import { Sun, Moon } from 'app/components'
import { styled, useTheme } from 'tamagui'
import { XStack } from '@/components/tamagui'
import { useThemeContext } from '@/components/TamaguiProvider'

const ToggleButton = styled(XStack, {
  tag: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 6,
  borderRadius: 4,
  backgroundColor: 'transparent',
  borderWidth: 0,
  cursor: 'pointer',
})

export default function ThemeToggle() {
  const { toggleTheme } = useThemeContext()
  const theme = useTheme()
  const muted = theme.editorialMuted?.get() as string

  // Both icons are always in the DOM. CSS classes (.theme-icon-sun / .theme-icon-moon)
  // control visibility based on the html.t_dark class set before hydration.
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
