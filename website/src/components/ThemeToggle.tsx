import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { Stack } from '@/components/tamagui'
import { useThemeContext } from '@/components/TamaguiProvider'
import { styled } from 'tamagui'

const ThemeButton = styled(Stack, {
  tag: 'button',
  padding: '$2',
  borderRadius: '$2',
  cursor: 'pointer',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'transparent',
  borderWidth: 0,

  hoverStyle: {
    backgroundColor: '$backgroundHover',
  },

  focusStyle: {
    outlineWidth: 2,
    outlineColor: '$borderColorFocus',
    outlineStyle: 'solid',
  },

  pressStyle: {
    opacity: 0.8,
  },
})

export default function ThemeToggle() {
  const { toggleTheme } = useThemeContext()

  // Both icons are always in the DOM. CSS classes (.theme-icon-sun / .theme-icon-moon)
  // control visibility based on the html.t_dark class set before hydration.
  return (
    <ThemeButton onPress={toggleTheme} accessibilityLabel="Toggle theme">
      <span className="theme-icon-sun" style={{ display: 'none', color: 'var(--editorial-muted)' }}>
        <Sun size={18} strokeWidth={1.5} />
      </span>
      <span className="theme-icon-moon" style={{ color: 'var(--editorial-muted)' }}>
        <Moon size={18} strokeWidth={1.5} />
      </span>
    </ThemeButton>
  )
}
