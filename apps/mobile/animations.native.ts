// Native animation driver — Moti/reanimated. NEVER imports @tamagui/animations-css.
// Metro/babel resolve `./animations` to this file on iOS/Android (.native.ts wins).
// NOTE: on the pinned Tamagui v1.144 line the package is `@tamagui/animations-moti`.
// It was renamed `@tamagui/animations-motion` only in Tamagui v2 — do not use that here.
import { createAnimations } from '@tamagui/animations-moti'

export const animations = createAnimations({
  fast: { type: 'timing', duration: 150 },
  medium: { type: 'timing', duration: 200 },
  slow: { type: 'timing', duration: 300 },
  bouncy: { type: 'spring', damping: 10, mass: 0.9, stiffness: 100 },
})
