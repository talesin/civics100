# Design Token Mapping: Tailwind → Tamagui

This document maps the current Tailwind CSS design tokens to their Tamagui equivalents for the migration.

## Colors

### Primary (Patriotic Blue)
| Tailwind Token | Value | Tamagui Token |
|---|---|---|
| `--color-primary-50` | #eff6ff | `$blue1` |
| `--color-primary-100` | #dbeafe | `$blue2` |
| `--color-primary-200` | #bfdbfe | `$blue3` |
| `--color-primary-300` | #93c5fd | `$blue4` |
| `--color-primary-400` | #60a5fa | `$blue5` |
| `--color-primary-500` | #3b82f6 | `$blue6` |
| `--color-primary-600` | #2563eb | `$bluePrimary` |
| `--color-primary-700` | #1d4ed8 | `$blueDark` |
| `--color-primary-800` | #1e40af | `$blue8` |
| `--color-primary-900` | #1e3a8a | `$blue9` |

### Secondary (Civic Red)
| Tailwind Token | Value | Tamagui Token |
|---|---|---|
| `--color-secondary-50` | #fef2f2 | `$red1` |
| `--color-secondary-100` | #fee2e2 | `$red2` |
| `--color-secondary-200` | #fecaca | `$red3` |
| `--color-secondary-300` | #fca5a5 | `$red4` |
| `--color-secondary-400` | #f87171 | `$red5` |
| `--color-secondary-500` | #ef4444 | `$red6` |
| `--color-secondary-600` | #dc2626 | `$redSecondary` |
| `--color-secondary-700` | #b91c1c | `$redDark` |
| `--color-secondary-800` | #991b1b | `$red8` |
| `--color-secondary-900` | #7f1d1d | `$red9` |

### Success
| Tailwind Token | Value | Tamagui Token |
|---|---|---|
| `--color-success-50` | #f0fdf4 | `$green1` |
| `--color-success-100` | #dcfce7 | `$green2` |
| `--color-success-500` | #22c55e | `$success` |
| `--color-success-600` | #16a34a | `$green6` |
| `--color-success-700` | #15803d | `$green7` |

### Error
| Tailwind Token | Value | Tamagui Token |
|---|---|---|
| `--color-error-50` | #fef2f2 | `$errorLight` |
| `--color-error-100` | #fee2e2 | `$error1` |
| `--color-error-500` | #ef4444 | `$error` |
| `--color-error-600` | #dc2626 | `$error6` |
| `--color-error-700` | #b91c1c | `$errorDark` |

### Warning
| Tailwind Token | Value | Tamagui Token |
|---|---|---|
| `--color-warning-50` | #fffbeb | `$warning1` |
| `--color-warning-100` | #fef3c7 | `$warning2` |
| `--color-warning-500` | #f59e0b | `$warning` |
| `--color-warning-600` | #d97706 | `$warning6` |

### Neutral
| Tailwind Token | Value | Tamagui Token |
|---|---|---|
| `--color-neutral-50` | #f9fafb | `$gray1` |
| `--color-neutral-100` | #f3f4f6 | `$gray2` |
| `--color-neutral-200` | #e5e7eb | `$gray3` |
| `--color-neutral-300` | #d1d5db | `$gray4` |
| `--color-neutral-400` | #9ca3af | `$gray5` |
| `--color-neutral-500` | #6b7280 | `$gray6` |
| `--color-neutral-600` | #4b5563 | `$gray7` |
| `--color-neutral-700` | #374151 | `$gray8` |
| `--color-neutral-800` | #1f2937 | `$gray9` |
| `--color-neutral-900` | #111827 | `$gray10` |

## Spacing

| Tailwind Token | Value | Tamagui Token |
|---|---|---|
| `--space-1` | 0.25rem (4px) | `$1` |
| `--space-2` | 0.5rem (8px) | `$2` |
| `--space-3` | 0.75rem (12px) | `$3` |
| `--space-4` | 1rem (16px) | `$4` |
| `--space-5` | 1.25rem (20px) | `$5` |
| `--space-6` | 1.5rem (24px) | `$6` |
| `--space-8` | 2rem (32px) | `$8` |
| `--space-10` | 2.5rem (40px) | `$10` |
| `--space-12` | 3rem (48px) | `$12` |
| `--space-16` | 4rem (64px) | `$16` |
| `--space-20` | 5rem (80px) | `$20` |
| `--space-24` | 6rem (96px) | `$24` |

## Typography

### Font Sizes
| Tailwind Token | Value | Tamagui Token |
|---|---|---|
| `--font-size-xs` | 0.75rem (12px) | `$1` |
| `--font-size-sm` | 0.875rem (14px) | `$2` |
| `--font-size-base` | 1rem (16px) | `$3` |
| `--font-size-lg` | 1.125rem (18px) | `$4` |
| `--font-size-xl` | 1.25rem (20px) | `$5` |
| `--font-size-2xl` | 1.5rem (24px) | `$6` |
| `--font-size-3xl` | 1.875rem (30px) | `$7` |
| `--font-size-4xl` | 2.25rem (36px) | `$8` |
| `--font-size-5xl` | 3rem (48px) | `$9` |

### Line Heights
| Tailwind Token | Value | Usage |
|---|---|---|
| `--line-height-tight` | 1.25 | Headers |
| `--line-height-snug` | 1.375 | Subheaders |
| `--line-height-normal` | 1.5 | Body text |
| `--line-height-relaxed` | 1.625 | Long-form content |
| `--line-height-loose` | 2 | Special spacing |

### Font Weights
| Tailwind Token | Value | Tamagui Usage |
|---|---|---|
| `--font-weight-light` | 300 | `fontWeight: '300'` |
| `--font-weight-normal` | 400 | `fontWeight: '400'` |
| `--font-weight-medium` | 500 | `fontWeight: '500'` |
| `--font-weight-semibold` | 600 | `fontWeight: '600'` |
| `--font-weight-bold` | 700 | `fontWeight: '700'` |
| `--font-weight-extrabold` | 800 | `fontWeight: '800'` |

## Border Radius

| Tailwind Token | Value | Tamagui Token |
|---|---|---|
| `--radius-sm` | 0.125rem (2px) | `$1` |
| `--radius-base` | 0.25rem (4px) | `$2` |
| `--radius-md` | 0.375rem (6px) | `$3` |
| `--radius-lg` | 0.5rem (8px) | `$4` |
| `--radius-xl` | 0.75rem (12px) | `$5` |
| `--radius-2xl` | 1rem (16px) | `$6` |
| `--radius-full` | 9999px | `$round` |

## Shadows

| Tailwind Token | Tamagui Equivalent |
|---|---|
| `--shadow-sm` | `shadowColor: '$color', shadowOpacity: 0.05, shadowRadius: 2` |
| `--shadow-base` | `shadowColor: '$color', shadowOpacity: 0.1, shadowRadius: 3` |
| `--shadow-md` | `shadowColor: '$color', shadowOpacity: 0.1, shadowRadius: 6` |
| `--shadow-lg` | `shadowColor: '$color', shadowOpacity: 0.1, shadowRadius: 15` |
| `--shadow-xl` | `shadowColor: '$color', shadowOpacity: 0.1, shadowRadius: 25` |

## Transitions/Animations

| Tailwind Token | Value | Tamagui Config |
|---|---|---|
| `--transition-fast` | 150ms ease-in-out | `fast: { duration: 150 }` |
| `--transition-base` | 200ms ease-in-out | `medium: { duration: 200 }` |
| `--transition-slow` | 300ms ease-in-out | `slow: { duration: 300 }` |

## Z-Index

| Tailwind Token | Value | Tamagui Token |
|---|---|---|
| `--z-index-dropdown` | 1000 | `$1` |
| `--z-index-sticky` | 1020 | `$2` |
| `--z-index-fixed` | 1030 | `$3` |
| `--z-index-modal-backdrop` | 1040 | `$4` |
| `--z-index-modal` | 1050 | `$5` |
| `--z-index-popover` | 1060 | (custom) |
| `--z-index-tooltip` | 1070 | (custom) |

## Theme Mapping

### Light Theme
- Background: `$background` → `--color-neutral-50` (#f9fafb)
- Text: `$color` → `--color-neutral-900` (#111827)
- Border: `$borderColor` → `--color-neutral-200` (#e5e7eb)
- Primary: `$primary` → `--color-primary-600` (#2563eb)
- Secondary: `$secondary` → `--color-secondary-600` (#dc2626)

### Dark Theme
- Background: `$background` → `--color-neutral-900` (#111827)
- Text: `$color` → `--color-neutral-50` (#f9fafb)
- Border: `$borderColor` → `--color-neutral-700` (#374151)
- Primary: `$primary` → `--color-primary-500` (#3b82f6)
- Secondary: `$secondary` → `--color-secondary-500` (#ef4444)

## Common Class Mappings

| Tailwind Classes | Tamagui Props |
|---|---|
| `flex items-center` | `<XStack alignItems="center">` |
| `flex flex-col` | `<YStack>` |
| `gap-4` | `gap="$4"` |
| `p-4` | `padding="$4"` |
| `px-4 py-2` | `paddingHorizontal="$4" paddingVertical="$2"` |
| `bg-primary-600` | `backgroundColor="$bluePrimary"` |
| `text-neutral-900` | `color="$gray10"` |
| `rounded-lg` | `borderRadius="$4"` |
| `shadow-md` | `elevated` or shadow props |
| `hover:bg-primary-700` | `hoverStyle={{ backgroundColor: '$blueDark' }}` |
| `dark:bg-neutral-900` | (handled by theme) |

## Notes

1. Tamagui automatically handles dark mode through theme switching - no need for `dark:` prefixes
2. Spacing and size tokens use numeric keys (`$1`, `$2`, etc.) rather than named scales
3. Colors should use semantic token names (`$bluePrimary`, `$redSecondary`) rather than numbers for better clarity
4. Shadows in Tamagui use individual props rather than a single shadow token
5. Animations in Tamagui are configured globally and applied via props rather than CSS classes
