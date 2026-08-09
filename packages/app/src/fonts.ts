/**
 * Platform-split serif font (same mechanism as animations.ts/.native.ts —
 * package-internal relative import only; NEVER an exports subpath).
 *
 * Web half: the family is the literal CSS variable chain the website has
 * always used — next/font loads Newsreader in website/src/app/layout.tsx and
 * design-tokens.css maps it to --font-family-serif. Tamagui emits the string
 * verbatim into its generated CSS, so `fontFamily="$serif"` is value-identical
 * with the old inline `var(--font-family-serif)` styles.
 *
 * Native half (fonts.native.ts) substitutes a platform serif until Phase 6
 * loads Newsreader via expo-font.
 */
import { createFont } from 'tamagui'

export const serifFont = createFont({
  family: 'var(--font-family-serif)',
  // Converted components set numeric fontSize directly; this scale only backs
  // $-token sizes and createFont's required shape.
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
