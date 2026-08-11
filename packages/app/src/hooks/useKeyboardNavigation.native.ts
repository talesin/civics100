/**
 * Native half of the platform-split keyboard-navigation hook — see
 * useKeyboardNavigation.ts for the contract. A same-signature no-op: there is
 * no `document` in React Native and mobile gets no hardware-keyboard game
 * navigation in Phase 5 (Phase 6 decision). Returns the same shortcuts object
 * so call sites and the return type match the web half.
 */
import { KEYBOARD_SHORTCUTS, type KeyboardNavigationOptions } from './useKeyboardNavigation.shared'

export const useKeyboardNavigation = (_options: KeyboardNavigationOptions) => {
  return {
    // Return keyboard shortcut info for potential use in UI
    shortcuts: KEYBOARD_SHORTCUTS
  }
}
