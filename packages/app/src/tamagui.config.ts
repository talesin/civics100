// Canonical Tamagui config, shared by website (Next.js) and apps/mobile (Expo).
// The animation driver is imported from `./animations`, resolved per platform
// (animations.ts = css on web, animations.native.ts = moti on iOS/Android).
import { createTamagui, createTokens } from 'tamagui'
import { animations } from './animations'
import { serifFont } from './fonts'

// Map Tailwind design tokens to Tamagui tokens
const tokens = createTokens({
  color: {
    // Primary palette (Patriotic Blue)
    blue1: '#eff6ff',
    blue2: '#dbeafe',
    blue3: '#bfdbfe',
    blue4: '#93c5fd',
    blue5: '#60a5fa',
    blue6: '#3b82f6',
    bluePrimary: '#2563eb',
    blueLight: '#3b82f6',
    blueDark: '#1d4ed8',
    blue8: '#1e40af',
    blue9: '#1e3a8a',

    // Secondary palette (Civic Red)
    red1: '#fef2f2',
    red2: '#fee2e2',
    red3: '#fecaca',
    red4: '#fca5a5',
    red5: '#f87171',
    red6: '#ef4444',
    redSecondary: '#dc2626',
    redLight: '#ef4444',
    redDark: '#b91c1c',
    red8: '#991b1b',
    red9: '#7f1d1d',

    // Success
    green1: '#f0fdf4',
    green2: '#dcfce7',
    green3: '#bbf7d0',
    success: '#22c55e',
    green6: '#16a34a',
    green7: '#15803d',
    green8: '#166534',

    // Error
    errorLight: '#fef2f2',
    error1: '#fee2e2',
    error: '#ef4444',
    error6: '#dc2626',
    errorDark: '#b91c1c',

    // Warning
    warning1: '#fffbeb',
    warning2: '#fef3c7',
    warningBgDark: 'rgba(146, 64, 14, 0.25)',
    warning3: '#fde68a',
    warning: '#f59e0b',
    warning6: '#d97706',
    warning8: '#92400e',

    // Orange (--theme-warning is orange, not amber)
    orange4: '#fb923c',
    orange6: '#ea580c',

    // Purple
    purple4: '#a78bfa',
    purple6: '#9333ea',

    // Neutral/Gray
    gray1: '#f9fafb',
    gray2: '#f3f4f6',
    gray3: '#e5e7eb',
    gray4: '#d1d5db',
    gray5: '#9ca3af',
    gray6: '#6b7280',
    gray7: '#4b5563',
    gray8: '#374151',
    gray9: '#1f2937',
    gray10: '#111827',

    // Base colors
    white: '#ffffff',
    black: '#000000',

    // Card surface (--theme-card-bg dark)
    cardBgDark: '#1a1a1a',

    // Editorial palette (light values + dark counterparts; the theme blocks
    // below select per mode — values mirror design-tokens.css exactly)
    editorialInk: '#111827',
    editorialPaper: '#ffffff',
    editorialRule: '#e5e7eb',
    editorialMuted: '#6b7280',
    editorialAccent: '#1e3a8a',
    editorialAccentDark: '#93c5fd',
    editorialInkDark: '#e2e8f0',
    editorialPaperDark: '#0f172a',
    editorialRuleDark: '#1e293b',
    editorialMutedDark: '#94a3b8',
    editorialAccentSubtle: '#eff6ff',
    editorialAccentSubtleDark: 'rgba(30, 58, 138, 0.25)'
  },

  space: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    true: 16,
    5: 20,
    6: 24,
    8: 32,
    10: 40,
    12: 48,
    16: 64,
    20: 80,
    24: 96
  },

  size: {
    0: 0,
    1: 20,
    2: 24,
    3: 28,
    4: 32,
    true: 32,
    5: 36,
    6: 40,
    7: 44,
    8: 48,
    9: 52,
    10: 56,
    12: 64
  },

  radius: {
    0: 0,
    1: 2,
    2: 4,
    3: 6,
    4: 8,
    5: 12,
    6: 16,
    round: 9999
  },

  zIndex: {
    0: 0,
    1: 1000,
    2: 1020,
    3: 1030,
    4: 1040,
    5: 1050
  }
})

const lightTheme = {
  background: tokens.color.white,
  backgroundHover: tokens.color.gray1,
  backgroundPress: tokens.color.gray2,
  backgroundFocus: tokens.color.gray2,

  color: tokens.color.gray10,
  colorHover: tokens.color.gray10,
  colorPress: tokens.color.gray10,

  borderColor: tokens.color.gray3,
  borderColorHover: tokens.color.gray4,
  borderColorFocus: tokens.color.bluePrimary,

  placeholderColor: tokens.color.gray5,

  primary: tokens.color.bluePrimary,
  primaryHover: tokens.color.blueDark,
  secondary: tokens.color.redSecondary,
  secondaryHover: tokens.color.redDark,

  success: tokens.color.success,
  warning: tokens.color.warning,
  error: tokens.color.error,

  // Editorial palette (1:1 with the --editorial-* CSS vars in design-tokens.css)
  editorialInk: tokens.color.editorialInk,
  editorialPaper: tokens.color.editorialPaper,
  editorialRule: tokens.color.editorialRule,
  editorialMuted: tokens.color.editorialMuted,
  editorialAccent: tokens.color.editorialAccent,
  editorialAccentSubtle: tokens.color.editorialAccentSubtle,

  // Exact-parity keys for the --theme-*/--color-* CSS vars whose values differ
  // from the pre-existing keys above (which are in use and cannot change).
  themeError: tokens.color.error6,
  themeErrorBg: tokens.color.error1,
  themeErrorText: tokens.color.red8,
  themeSuccess: tokens.color.green6,
  themeSuccessBg: tokens.color.green2,
  themeSuccessText: tokens.color.green8,
  themeWarning: tokens.color.orange6,
  themeWarningBg: tokens.color.warning2,
  themeWarningText: tokens.color.warning8,
  themePrimary: tokens.color.bluePrimary,
  themePurple: tokens.color.purple6,
  themeCardBg: tokens.color.white,
  neutral100: tokens.color.gray2,
  shadowMd: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
}

const darkTheme = {
  background: tokens.color.gray10,
  backgroundHover: tokens.color.gray9,
  backgroundPress: tokens.color.gray8,
  backgroundFocus: tokens.color.gray8,

  color: tokens.color.gray1,
  colorHover: tokens.color.gray1,
  colorPress: tokens.color.gray1,

  borderColor: tokens.color.gray8,
  borderColorHover: tokens.color.gray7,
  borderColorFocus: tokens.color.blueLight,

  placeholderColor: tokens.color.gray6,

  primary: tokens.color.blueLight,
  primaryHover: tokens.color.bluePrimary,
  secondary: tokens.color.redLight,
  secondaryHover: tokens.color.redSecondary,

  success: tokens.color.success,
  warning: tokens.color.warning,
  error: tokens.color.error,

  // Editorial palette — dark values from design-tokens.css html.t_dark
  editorialInk: tokens.color.editorialInkDark,
  editorialPaper: tokens.color.editorialPaperDark,
  editorialRule: tokens.color.editorialRuleDark,
  editorialMuted: tokens.color.editorialMutedDark,
  editorialAccent: tokens.color.editorialAccentDark,
  editorialAccentSubtle: tokens.color.editorialAccentSubtleDark,

  // Exact-parity keys — dark values from design-tokens.css html.t_dark
  themeError: tokens.color.error,
  themeErrorBg: tokens.color.red9,
  themeErrorText: tokens.color.red3,
  themeSuccess: tokens.color.success,
  themeSuccessBg: tokens.color.green8,
  themeSuccessText: tokens.color.green3,
  themeWarning: tokens.color.orange4,
  themeWarningBg: tokens.color.warningBgDark,
  themeWarningText: tokens.color.warning3,
  themePrimary: tokens.color.blue5,
  themePurple: tokens.color.purple4,
  themeCardBg: tokens.color.cardBgDark,
  neutral100: tokens.color.gray9,
  shadowMd: '0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.2)'
}

const config = createTamagui({
  // Web: emit base-theme CSS as `:root.t_light` / `:root.t_dark` so the theme
  // variables apply from the <html> class set by @tamagui/next-theme's
  // pre-hydration script. Without this, Tamagui emits descendant selectors
  // (`:root .t_light`) that never match — theme keys silently resolve to
  // nothing. No effect on native (themes resolve in JS there).
  themeClassNameOnRoot: true,
  // Serif only — deliberately no `body`/`heading` fonts and no defaultFont:
  // adding a default would restyle every Text/Paragraph site-wide. The
  // driver is platform-split via ./fonts (web = var(--font-family-serif),
  // native = platform serif until Phase 6 loads Newsreader).
  fonts: {
    serif: serifFont
  },
  tokens,
  themes: {
    light: lightTheme,
    dark: darkTheme
  },
  media: {
    xs: { maxWidth: 640 },
    sm: { maxWidth: 768 },
    md: { maxWidth: 1024 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1536 },
    gtXs: { minWidth: 641 },
    gtSm: { minWidth: 769 },
    gtMd: { minWidth: 1025 },
    gtLg: { minWidth: 1281 }
  },
  animations
})

export type AppConfig = typeof config

declare module 'tamagui' {
  // Tamagui's documented augmentation pattern: the empty extends is what registers
  // the app's tokens/themes with tamagui's types.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config
