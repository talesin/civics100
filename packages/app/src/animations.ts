// Default/web animation driver — CSS. This is the canonical file that `tsc` resolves for
// `./animations` (TypeScript does not do React Native platform-extension resolution) and
// that Metro picks on web. On native, Metro prefers `animations.native.ts` (moti) over
// this file. The animation KEYS are identical across drivers, so the config's `animation`
// prop type is the same whichever file resolves.
//
// Values are CSS transition strings: the css driver interpolates each key verbatim into
// `transition: all <value>` (and regex-reads the duration out of it). Object configs
// like `{ type: 'timing', duration }` belong to the moti driver only — passed here they
// stringify to "[object Object]" and every web transition silently becomes instant,
// which is how the pre-Stage-14 config behaved.
//
// fadeUp* = the home page's staggered entrance (was framer-motion: 280ms ease-out,
// delay i × 50ms). The css driver has no per-instance delay, so each step is a key.
import { createAnimations } from '@tamagui/animations-css'

export const animations = createAnimations({
  fast: '150ms ease',
  medium: '200ms ease',
  slow: '300ms ease',
  lazy: '500ms ease',
  pulse: '750ms ease',
  bouncy: '200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  fadeUp: '280ms ease-out',
  fadeUp50: '280ms ease-out 50ms',
  fadeUp100: '280ms ease-out 100ms',
  fadeUp150: '280ms ease-out 150ms',
  fadeUp200: '280ms ease-out 200ms',
  fadeUp250: '280ms ease-out 250ms'
})
