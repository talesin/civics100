/**
 * Platform-split haptic feedback (same mechanism as confirmDialog.ts /
 * .native.ts — package-internal relative import only, never an exports
 * subpath). Web half: browsers have no reliable haptics API, so this is a
 * no-op. haptics.native.ts substitutes expo-haptics under Metro.
 */
export const hapticAnswerFeedback = (_isCorrect: boolean): void => {}
