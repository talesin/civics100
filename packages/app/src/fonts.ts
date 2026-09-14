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
 * Native half (fonts.native.ts) ships Newsreader static cuts via expo-font.
 * `serifDisplay` exists for its benefit: native needs a separate 36pt
 * optical-size cut for large titles, whereas the web variable font selects
 * the optical size from the font-size itself — so here it is the SAME chain
 * as `serif`, and `$serifDisplay` renders identically to `$serif` on web.
 *
 * `mono` backs the keyboard-shortcut chips on the game screen: the generic
 * CSS `monospace` family the old inline style used, verbatim.
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

export const serifDisplayFont = serifFont

export const monoFont = createFont({
  family: 'monospace',
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 15,
    6: 16,
    true: 14
  },
  weight: {
    1: '400',
    true: '400'
  },
  letterSpacing: {
    1: 0,
    true: 0
  }
})
