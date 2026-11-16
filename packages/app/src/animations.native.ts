// Native animation driver — Moti/reanimated. NEVER imports @tamagui/animations-css.
// Metro/babel resolve `./animations` to this file on iOS/Android (.native.ts wins).
// NOTE: on the pinned Tamagui v1.144 line the package is `@tamagui/animations-moti`.
// It was renamed `@tamagui/animations-motion` only in Tamagui v2 — do not use that here.
// IMPORTANT: this platform split only works through the package-internal relative
// `./animations` import — Metro does not apply .native substitution to exports-map
// targets, so never add an `./animations` subpath to package.json "exports".
// Keys must match animations.ts exactly (fadeUp* = the home page's staggered entrance).
import { createAnimations } from '@tamagui/animations-moti'

export const animations = createAnimations({
  fast: { type: 'timing', duration: 150 },
  medium: { type: 'timing', duration: 200 },
  slow: { type: 'timing', duration: 300 },
  lazy: { type: 'timing', duration: 500 },
  pulse: { type: 'timing', duration: 750 },
  bouncy: { type: 'spring', damping: 10, mass: 0.9, stiffness: 100 },
  fadeUp: { type: 'timing', duration: 280 },
  fadeUp50: { type: 'timing', duration: 280, delay: 50 },
  fadeUp100: { type: 'timing', duration: 280, delay: 100 },
  fadeUp150: { type: 'timing', duration: 280, delay: 150 },
  fadeUp200: { type: 'timing', duration: 280, delay: 200 },
  fadeUp250: { type: 'timing', duration: 280, delay: 250 }
})
