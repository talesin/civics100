import React, { useState, useEffect } from 'react'
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

const LoadingSkeleton = styled(Stack, {
  width: 20,
  height: 20,
  backgroundColor: '$borderColor',
  borderRadius: '$1',
})

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeContext()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = theme === 'dark'

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <ThemeButton>
        <LoadingSkeleton />
      </ThemeButton>
    )
  }

  return (
    <ThemeButton
      onPress={toggleTheme}
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <svg width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </ThemeButton>
  )
}
