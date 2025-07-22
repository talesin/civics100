import { useEffect, useCallback } from 'react'

interface KeyboardNavigationOptions {
  onSelectAnswer: (index: number) => void
  onNext: () => void
  onRestart: () => void
  isAnswered: boolean
  totalAnswers: number
  disabled?: boolean
}

// Keyboard shortcut mappings for better maintainability
const KEYBOARD_SHORTCUTS = {
  ANSWER_NUMBERS: ['1', '2', '3', '4'] as const,
  ANSWER_LETTERS: ['a', 'b', 'c', 'd'] as const,
  NAVIGATION: ['enter', ' '] as const,
  RESTART: ['r'] as const,
  HELP: ['?', '/'] as const
} as const

// All keys that should have default behavior prevented
const CONTROLLED_KEYS = [
  ...KEYBOARD_SHORTCUTS.ANSWER_NUMBERS,
  ...KEYBOARD_SHORTCUTS.ANSWER_LETTERS,
  ...KEYBOARD_SHORTCUTS.NAVIGATION,
  ...KEYBOARD_SHORTCUTS.RESTART
] as const

export const useKeyboardNavigation = ({
  onSelectAnswer,
  onNext,
  onRestart,
  isAnswered,
  totalAnswers,
  disabled = false
}: KeyboardNavigationOptions) => {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return

      const key = event.key.toLowerCase()

      // Prevent default behavior for game controls
      if (CONTROLLED_KEYS.includes(key as (typeof CONTROLLED_KEYS)[number])) {
        event.preventDefault()
      }

      // Answer selection when not yet answered
      if (!isAnswered) {
        // Number key selection (1-4)
        const numberKey = parseInt(event.key)
        if (
          numberKey >= 1 &&
          numberKey <= Math.min(totalAnswers, KEYBOARD_SHORTCUTS.ANSWER_NUMBERS.length)
        ) {
          onSelectAnswer(numberKey - 1)
          return
        }

        // Letter key selection (A-D)
        const letterIndex = KEYBOARD_SHORTCUTS.ANSWER_LETTERS.indexOf(
          key as (typeof KEYBOARD_SHORTCUTS.ANSWER_LETTERS)[number]
        )
        if (letterIndex !== -1 && letterIndex < totalAnswers) {
          onSelectAnswer(letterIndex)
          return
        }
      }

      // Navigation controls (Enter/Space for next when answered)
      if (
        KEYBOARD_SHORTCUTS.NAVIGATION.includes(
          key as (typeof KEYBOARD_SHORTCUTS.NAVIGATION)[number]
        )
      ) {
        if (isAnswered) {
          onNext()
        }
        return
      }

      // Restart with 'R' key
      if (KEYBOARD_SHORTCUTS.RESTART.includes(key as (typeof KEYBOARD_SHORTCUTS.RESTART)[number])) {
        onRestart()
        return
      }

      // Help with '?' or '/' key
      if (KEYBOARD_SHORTCUTS.HELP.includes(key as (typeof KEYBOARD_SHORTCUTS.HELP)[number])) {
        // Using console.info for better semantic meaning
        console.info(
          'Keyboard shortcuts: 1-4 or A-D to select answers, Enter/Space for next, R to restart'
        )
        return
      }
    },
    [onSelectAnswer, onNext, onRestart, isAnswered, totalAnswers, disabled]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  return {
    // Return keyboard shortcut info for potential use in UI
    shortcuts: KEYBOARD_SHORTCUTS
  }
}
