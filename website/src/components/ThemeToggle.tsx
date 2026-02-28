import React from 'react'
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
    <ThemeButton
      onPress={toggleTheme}
      accessibilityLabel="Toggle theme"
    >
      {/* Sun icon - visible in dark mode */}
      <svg className="theme-icon-sun" width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
      {/* Moon icon - visible in light mode */}
      <svg className="theme-icon-moon" width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </ThemeButton>
  )
}
