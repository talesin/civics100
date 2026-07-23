// Default/web animation driver — CSS. This is the canonical file that `tsc` resolves for
// `./animations` (TypeScript does not do React Native platform-extension resolution) and
// that Metro picks on web. On native, Metro prefers `animations.native.ts` (moti) over
// this file. The animation KEYS are identical across drivers, so the config's `animation`
// prop type is the same whichever file resolves.
import { createAnimations } from '@tamagui/animations-css'

export const animations = createAnimations({
  fast: { type: 'timing', duration: 150 },
  medium: { type: 'timing', duration: 200 },
  slow: { type: 'timing', duration: 300 },
  bouncy: { type: 'spring', damping: 10, mass: 0.9, stiffness: 100 },
})
