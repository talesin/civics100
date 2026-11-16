/**
 * Native half of the platform-split serif font — see fonts.ts for the
 * contract. Phase 6: Newsreader statics embedded by the expo-font config
 * plugin (apps/mobile/app.config.ts, files under apps/mobile/assets/fonts).
 *
 * Web gets Newsreader's optical-size axis for free from the variable font;
 * native ships two static cuts instead: the 14pt text cut behind `$serif`
 * and the 36pt display cut behind `$serifDisplay` (page titles, hero, big
 * stat values). Face names differ per platform — iOS resolves embedded fonts
 * by PostScript name, Android by the asset file stem — so `face` maps each
 * weight/style to the platform's name and `family` is the 400 face.
 */
import { Platform } from 'react-native'
import { createFont } from 'tamagui'

const ios = Platform.OS === 'ios'
const text = (cut: string) => (ios ? `Newsreader14pt-${cut}` : `Newsreader_14pt-${cut}`)
const display = (cut: string) => (ios ? `Newsreader36pt-${cut}` : `Newsreader_36pt-${cut}`)

const serifSize = {
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
}

export const serifFont = createFont({
  family: text('Regular'),
  size: serifSize,
  weight: {
    1: '400',
    5: '500',
    true: '400'
  },
  letterSpacing: {
    1: 0,
    true: 0
  },
  face: {
    400: { normal: text('Regular'), italic: text('Italic') },
    500: { normal: text('Medium'), italic: text('MediumItalic') },
    600: { normal: text('SemiBold'), italic: text('SemiBoldItalic') },
    // No bold cut shipped; SemiBold is the heaviest weight the UI uses in serif
    700: { normal: text('SemiBold'), italic: text('SemiBoldItalic') }
  }
})

// Display cut: Regular + Medium only (no italics shipped — titles never use them).
export const serifDisplayFont = createFont({
  family: display('Regular'),
  size: serifSize,
  weight: {
    1: '400',
    5: '500',
    true: '500'
  },
  letterSpacing: {
    1: 0,
    true: 0
  },
  face: {
    400: { normal: display('Regular') },
    500: { normal: display('Medium') },
    600: { normal: display('Medium') },
    700: { normal: display('Medium') }
  }
})

// iOS has no generic 'monospace' family; Courier is its built-in monospace.
export const monoFont = createFont({
  family: Platform.OS === 'ios' ? 'Courier' : 'monospace',
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
