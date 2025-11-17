import { createAnimations } from '@tamagui/animations-css'
import { createTamagui, createTokens } from 'tamagui'

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
    success: '#22c55e',
    green6: '#16a34a',
    green7: '#15803d',

    // Error
    errorLight: '#fef2f2',
    error1: '#fee2e2',
    error: '#ef4444',
    error6: '#dc2626',
    errorDark: '#b91c1c',

    // Warning
    warning1: '#fffbeb',
    warning2: '#fef3c7',
    warning: '#f59e0b',
    warning6: '#d97706',

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
  },

  space: {
    0: 0,
    1: 4,     // 0.25rem
    2: 8,     // 0.5rem
    3: 12,    // 0.75rem
    4: 16,    // 1rem
    true: 16, // default space (1rem)
    5: 20,    // 1.25rem
    6: 24,    // 1.5rem
    8: 32,    // 2rem
    10: 40,   // 2.5rem
    12: 48,   // 3rem
    16: 64,   // 4rem
    20: 80,   // 5rem
    24: 96,   // 6rem
  },

  size: {
    0: 0,
    1: 20,
    2: 24,
    3: 28,
    4: 32,
    true: 32, // default size
    5: 36,
    6: 40,
    7: 44,
    8: 48,
    9: 52,
    10: 56,
    12: 64,
  },

  radius: {
    0: 0,
    1: 2,     // sm
    2: 4,     // base
    3: 6,     // md
    4: 8,     // lg
    5: 12,    // xl
    6: 16,    // 2xl
    round: 9999,
  },

  zIndex: {
    0: 0,
    1: 1000,   // dropdown
    2: 1020,   // sticky
    3: 1030,   // fixed
    4: 1040,   // modal-backdrop
    5: 1050,   // modal
  },
})

// Create animations matching Tailwind's custom animations
const animations = createAnimations({
  fast: {
    type: 'timing',
    duration: 150,
  },
  medium: {
    type: 'timing',
    duration: 200,
  },
  slow: {
    type: 'timing',
    duration: 300,
  },
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
})

// Create themes for light and dark modes
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

  // Semantic
  primary: tokens.color.bluePrimary,
  primaryHover: tokens.color.blueDark,
  secondary: tokens.color.redSecondary,
  secondaryHover: tokens.color.redDark,

  success: tokens.color.success,
  warning: tokens.color.warning,
  error: tokens.color.error,
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

  // Semantic
  primary: tokens.color.blueLight,
  primaryHover: tokens.color.bluePrimary,
  secondary: tokens.color.redLight,
  secondaryHover: tokens.color.redSecondary,

  success: tokens.color.success,
  warning: tokens.color.warning,
  error: tokens.color.error,
}

const config = createTamagui({
  tokens,
  themes: {
    light: lightTheme,
    dark: darkTheme,
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
    gtLg: { minWidth: 1281 },
  },
  animations,
})

export type AppConfig = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config
