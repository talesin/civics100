/**
 * Native half of the platform-split serif font — see fonts.ts for the
 * contract. 'Georgia' is a real serif on iOS; Android has no Georgia and
 * silently falls back to the system default, which is acceptable Phase-5
 * degradation — Phase 6 loads Newsreader via expo-font and replaces this
 * family on both platforms.
 */
import { createFont } from 'tamagui'

export const serifFont = createFont({
  family: 'Georgia',
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 15,
    6: 16,
    7: 18,
    8: 20,
    9: 22,
    10: 26,
    11: 32,
    12: 40,
    true: 15
  },
  weight: {
    1: '400',
    5: '500',
    true: '400'
  },
  letterSpacing: {
    1: 0,
    true: 0
  }
})
