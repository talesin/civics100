/**
 * Shared contract for the platform-split keyboard-navigation hook — imported
 * by both useKeyboardNavigation.ts (web) and useKeyboardNavigation.native.ts
 * (no-op) so the two halves cannot drift in signature or shortcut set.
 */
export interface KeyboardNavigationOptions {
  onSelectAnswer: (index: number) => void
  onNext: () => void
  onRestart: () => void
  isAnswered: boolean
  totalAnswers: number
  disabled?: boolean
}

// Keyboard shortcut mappings for better maintainability
export const KEYBOARD_SHORTCUTS = {
  ANSWER_NUMBERS: ['1', '2', '3', '4'] as const,
  ANSWER_LETTERS: ['a', 'b', 'c', 'd'] as const,
  NAVIGATION: ['enter', ' '] as const,
  RESTART: ['r'] as const,
  HELP: ['?', '/'] as const
} as const
