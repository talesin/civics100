# Tamagui Migration Plan - Civics Native 2


## Executive Summary

This plan provides a granular, step-by-step approach to migrating the civics-native-2 project from Tailwind CSS to Tamagui. The plan is designed to avoid the loops and failures of previous attempts by:

1. Breaking work into **very small, verifiable phases**
2. Requiring **clean, install, build, test** after each phase
3. Providing **rollback instructions** for each phase
4. Converting **one component at a time** with verification
5. Maintaining **dual support** (Tailwind + Tamagui) during transition

**Total Estimated Time:** 8-12 hours across 9 phases
**Risk Level:** Medium (managed through incremental approach)

### Important: Git Command Handling

**All git write commands (checkout, commit, add, etc.) will be prompted to you for manual execution.** Claude will prepare the content changes, run builds/tests, and provide the exact commands you should run. Git checkpoints are marked with **→ ACTION REQUIRED** throughout the plan.

---

## Current State Analysis

### Project Structure
- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS v4 with custom design tokens
- **Architecture:** Effect-TS functional programming
- **Components:** 18 .tsx files in `/website/src/components/`
- **Pages:** 5 routes (/, /game, /settings, /results, /statistics)
- **Platform:** Web-only (no React Native)

### Design System
- **Colors:** Patriotic palette (blue primary, red secondary)
- **Typography:** Scale from xs to 5xl
- **Spacing:** Custom tokens
- **Dark Mode:** CSS variables with class-based switching
- **Animations:** Custom CSS animations (fade-in, slide-in, bounce-in, pulse)

### Key Files to Migrate
1. `Layout.tsx` - Main layout wrapper
2. `GameQuestion.tsx` - Quiz question display
3. `GameControls.tsx` - Button controls
4. `GameResults.tsx` - Results display
5. `QuestionDetailModal.tsx` - Modal component
6. `QuestionStatisticsTable.tsx` - Table component
7. `StatsSummary.tsx` - Stats card
8. `DistrictSelector.tsx` - Dropdown
9. `StateSelector.tsx` - Dropdown
10. `ThemeToggle.tsx` - Dark mode toggle
11. Plus 8 more components

---

## Phase 0: Preparation & Baseline ✅ COMPLETE

**Goal:** Document current state and ensure everything works before migration
**Duration:** 30 minutes
**Risk:** Low
**Status:** Completed - Baseline metrics: 18.1s build, 159MB bundle, 50 tests passing

### Prerequisites
✅ Git working directory is clean
✅ All tests passing
✅ Build succeeds

### Steps

#### 0.1 Checkpoint: Create Baseline
**→ ACTION REQUIRED:** Please create a git checkpoint for the baseline state:
```bash
git checkout -b tamagui-migration-baseline
git add .
git commit -m "Baseline: Pre-Tamagui migration state"
```

#### 0.2 Document Current Metrics
```bash
cd website
npm run clean
npm install
npm run build
npm run test
```

**Record:**
- [x] Build time: 18.1 seconds
- [x] Bundle size (`dist` folder): 159 MB
- [x] Test count: 50 passing (5 suites)
- [x] Dev server startup time: 718ms

#### 0.3 Extract Design Token Mapping
Create `/website/docs/design-token-mapping.md`:

```markdown
# Design Token Mapping: Tailwind → Tamagui

## Colors
- Tailwind: Custom patriotic palette in design-tokens.css
- Tamagui: Will map to theme colors

## Spacing
- Tailwind: Uses default scale
- Tamagui: Will map to space tokens

## Typography
- Tailwind: xs to 5xl scale
- Tamagui: Will map to fontSize tokens

## Animations
- fade-in, slide-in-left, slide-in-right
- bounce-in, pulse-success, pulse-error
```

#### 0.4 Screenshot Visual Regression Reference
Take screenshots of:
- [ ] Home page (light mode)
- [ ] Home page (dark mode)
- [ ] Game page (light mode)
- [ ] Game page (dark mode)
- [ ] Settings page
- [ ] Results page
- [ ] Statistics page

Save to `/website/docs/visual-regression-baseline/`

### Verification Checklist
- [x] Clean build completes without errors
- [x] All tests pass (npm run test)
- [x] Dev server runs without warnings
- [x] All pages render correctly
- [x] Dark mode toggle works
- [ ] Screenshots saved (skipped - can verify visually during migration)
- [x] Baseline metrics recorded
- [x] Baseline branch created

### Rollback
**→ ACTION REQUIRED:** To rollback this phase:
```bash
git checkout tamagui
git branch -D tamagui-migration-baseline
```

---

## Phase 1: Install Tamagui Dependencies ✅ COMPLETE

**Goal:** Add Tamagui packages without breaking existing Tailwind setup
**Duration:** 15 minutes
**Risk:** Low
**Status:** Completed - All packages installed (v1.138.0), build and tests pass

### Prerequisites
✅ Phase 0 completed
✅ Baseline checkpoint created

### Steps

#### 1.1 Checkpoint: Create Phase Branch
**→ ACTION REQUIRED:** Please create a branch for this phase:
```bash
git checkout -b tamagui-migration-phase-1
```

#### 1.2 Install Core Tamagui Packages
```bash
cd website
npm install tamagui @tamagui/config @tamagui/next-plugin @tamagui/next-theme
```

**Expected packages:**
- `tamagui` - Full UI kit
- `@tamagui/config` - Default configuration
- `@tamagui/next-plugin` - Next.js integration
- `@tamagui/next-theme` - Theme provider for SSR

#### 1.3 Install Animation Driver
```bash
npm install @tamagui/animations-css
```

#### 1.4 Verify Installation
```bash
npm list tamagui
npm list @tamagui/config
npm list @tamagui/next-plugin
npm list @tamagui/next-theme
npm list @tamagui/animations-css
```

### Verification Checklist
- [x] `npm run clean` succeeds
- [x] `npm install` succeeds
- [x] `npm run build` succeeds (should still build with Tailwind)
- [x] `npm run test` passes (50 tests, 5 suites)
- [x] No new warnings in build output
- [x] Dev server starts successfully (600ms)
- [x] All pages still render with Tailwind

### Rollback
**→ ACTION REQUIRED:** To rollback this phase:
```bash
cd website
git checkout package.json package-lock.json
npm install
```

---

## Phase 2: Create Tamagui Configuration ✅ COMPLETE

**Goal:** Set up Tamagui config with design tokens mapped from Tailwind
**Duration:** 45 minutes
**Risk:** Low (config file only, doesn't affect app yet)
**Status:** Completed - Config created with full token mapping, TypeScript compiles successfully

### Prerequisites
✅ Phase 1 completed
✅ Dependencies installed

### Steps

#### 2.1 Checkpoint: Create Phase Branch
**→ ACTION REQUIRED:** Please create a branch for this phase:
```bash
git checkout -b tamagui-migration-phase-2
```

#### 2.2 Create Tamagui Config File
Create `/website/tamagui.config.ts`:

```typescript
import { createAnimations } from '@tamagui/animations-css'
import { createTamagui, createTokens } from 'tamagui'

// Map Tailwind design tokens to Tamagui tokens
const tokens = createTokens({
  color: {
    // Patriotic palette
    bluePrimary: '#1e40af',
    blueLight: '#3b82f6',
    blueDark: '#1e3a8a',
    redSecondary: '#dc2626',
    redLight: '#ef4444',
    redDark: '#991b1b',

    // Grays
    white: '#ffffff',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    black: '#000000',

    // Semantic colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },

  space: {
    0: 0,
    1: 4,     // 0.25rem
    2: 8,     // 0.5rem
    3: 12,    // 0.75rem
    4: 16,    // 1rem
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
    1: 3,
    2: 5,
    3: 7,
    4: 9,
    5: 12,
    6: 16,
    round: 999,
  },

  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
  },
})

// Create animations matching Tailwind's custom animations
const animations = createAnimations({
  fast: {
    type: 'timing',
    duration: 200,
  },
  medium: {
    type: 'timing',
    duration: 300,
  },
  slow: {
    type: 'timing',
    duration: 500,
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
  backgroundHover: tokens.color.gray50,
  backgroundPress: tokens.color.gray100,
  backgroundFocus: tokens.color.gray100,

  color: tokens.color.gray900,
  colorHover: tokens.color.gray900,
  colorPress: tokens.color.gray900,

  borderColor: tokens.color.gray300,
  borderColorHover: tokens.color.gray400,
  borderColorFocus: tokens.color.bluePrimary,

  placeholderColor: tokens.color.gray400,

  // Semantic
  primary: tokens.color.bluePrimary,
  primaryHover: tokens.color.blueLight,
  secondary: tokens.color.redSecondary,
  secondaryHover: tokens.color.redLight,

  success: tokens.color.success,
  warning: tokens.color.warning,
  error: tokens.color.error,
}

const darkTheme = {
  background: tokens.color.gray900,
  backgroundHover: tokens.color.gray800,
  backgroundPress: tokens.color.gray700,
  backgroundFocus: tokens.color.gray700,

  color: tokens.color.gray50,
  colorHover: tokens.color.gray50,
  colorPress: tokens.color.gray50,

  borderColor: tokens.color.gray700,
  borderColorHover: tokens.color.gray600,
  borderColorFocus: tokens.color.blueLight,

  placeholderColor: tokens.color.gray500,

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
```

#### 2.3 Verify Configuration Compiles
```bash
npm run build
```

The build should succeed. Tamagui config is created but not yet used.

### Verification Checklist
- [x] `tamagui.config.ts` created
- [x] TypeScript compiles without errors
- [x] `npm run build` succeeds (1.142s compile)
- [x] `npm run test` passes (50 tests)
- [x] No runtime changes (app still uses Tailwind)

### Rollback
**→ ACTION REQUIRED:** To rollback this phase:
```bash
git checkout tamagui-migration-phase-1
rm website/tamagui.config.ts
```

---

## Phase 3: Configure Next.js Plugin ✅ COMPLETE

**Goal:** Set up Next.js to work with Tamagui (without breaking Tailwind)
**Duration:** 30 minutes
**Risk:** Medium (modifies build config)
**Status:** Completed - Tamagui packages added to transpilePackages (plugin deferred due to Next.js 15 compatibility)

### Prerequisites
✅ Phase 2 completed
✅ Tamagui config exists

### Steps

#### 3.1 Checkpoint: Create Phase Branch
**→ ACTION REQUIRED:** Please create a branch for this phase:
```bash
git checkout -b tamagui-migration-phase-3
```

#### 3.2 Update next.config.js
Read current config:
```bash
cat website/next.config.js
```

Create new config with Tamagui plugin:

```javascript
// website/next.config.js
const { withTamagui } = require('@tamagui/next-plugin')

module.exports = function (name, { defaultConfig }) {
  let config = {
    ...defaultConfig,
    // Existing Next.js config
    reactStrictMode: true,
    swcMinify: true,
  }

  const tamaguiPlugin = withTamagui({
    config: './tamagui.config.ts',
    components: ['tamagui'],
    // Disable optimization during migration
    disableExtraction: true,
  })

  return {
    ...config,
    ...tamaguiPlugin(config),
  }
}
```

#### 3.3 Test Build
```bash
cd website
npm run clean
npm install
npm run build
```

### Verification Checklist
- [ ] Build completes without errors
- [ ] No Tamagui warnings in build output
- [ ] Tailwind still works
- [ ] Dev server starts: `npm run dev`
- [ ] All pages render correctly
- [ ] No console errors

### Rollback
**→ ACTION REQUIRED:** To rollback this phase:
```bash
git checkout tamagui-migration-phase-2
cd website
npm run clean
npm install
npm run build
```

---

## Phase 4: Add Tamagui Provider (Dual Mode) ✅ COMPLETE

**Goal:** Wrap app with TamaguiProvider while keeping Tailwind active
**Duration:** 45 minutes
**Risk:** Medium
**Status:** Completed - TamaguiProvider wrapping app, dual mode active (Tailwind + Tamagui)

### Prerequisites
✅ Phase 3 completed
✅ Next.js plugin configured

### Steps

#### 4.1 Checkpoint: Create Phase Branch
**→ ACTION REQUIRED:** Please create a branch for this phase:
```bash
git checkout -b tamagui-migration-phase-4
```

#### 4.2 Create TamaguiProvider Component
Create `/website/src/components/TamaguiProvider.tsx`:

```typescript
'use client'

import '@tamagui/core/reset.css'
import { useServerInsertedHTML } from 'next/navigation'
import { TamaguiProvider as TamaguiProviderCore } from 'tamagui'
import tamaguiConfig from '../../tamagui.config'

export function TamaguiProvider({ children }: { children: React.ReactNode }) {
  useServerInsertedHTML(() => {
    const styles = tamaguiConfig.getNewCSS()

    if (styles) {
      return (
        <style
          dangerouslySetInnerHTML={{ __html: styles }}
          id="tamagui-ssr"
        />
      )
    }

    return null
  })

  return (
    <TamaguiProviderCore config={tamaguiConfig} disableRootThemeClass>
      {children}
    </TamaguiProviderCore>
  )
}
```

#### 4.3 Update Root Layout
Update `/website/src/app/layout.tsx`:

```typescript
import { TamaguiProvider } from '@/components/TamaguiProvider'
import './globals.css' // Tailwind still here

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <TamaguiProvider>
          {children}
        </TamaguiProvider>
      </body>
    </html>
  )
}
```

#### 4.4 Test Dual Mode
```bash
npm run clean
npm install
npm run build
npm run dev
```

Visit each page and verify:
- Tailwind styles still work
- No console errors
- Dark mode toggle still works

### Verification Checklist
- [ ] Build succeeds
- [ ] Dev server starts
- [ ] All pages render (using Tailwind)
- [ ] No console errors
- [ ] Dark mode works
- [ ] Tamagui provider is in React tree (check DevTools)
- [ ] Tests pass: `npm run test`

### Rollback
**→ ACTION REQUIRED:** To rollback this phase:
```bash
git checkout tamagui-migration-phase-3
cd website
npm run clean
npm install
```

---

## Phase 5: Create Base Tamagui Components

**Goal:** Create Tamagui versions of primitive components without replacing Tailwind ones
**Duration:** 60 minutes
**Risk:** Low (new files, no changes to existing)

### Prerequisites
✅ Phase 4 completed
✅ TamaguiProvider active

### Steps

#### 5.1 Checkpoint: Create Phase Branch
**→ ACTION REQUIRED:** Please create a branch for this phase:
```bash
git checkout -b tamagui-migration-phase-5
```

#### 5.2 Create Component Directory
```bash
mkdir -p website/src/components/tamagui
```

#### 5.3 Create Base Button Component
Create `/website/src/components/tamagui/Button.tsx`:

```typescript
import { GetProps, styled } from 'tamagui'
import { Stack } from 'tamagui'

export const Button = styled(Stack, {
  name: 'Button',

  // Base styles
  tag: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: '$2',
  cursor: 'pointer',
  userSelect: 'none',

  backgroundColor: '$primary',
  borderColor: '$primary',
  borderWidth: 0,
  borderRadius: '$2',
  padding: '$3',
  color: 'white',
  fontWeight: '600',

  hoverStyle: {
    backgroundColor: '$primaryHover',
    opacity: 0.9,
  },

  pressStyle: {
    opacity: 0.8,
  },

  focusStyle: {
    outlineWidth: 2,
    outlineColor: '$borderColorFocus',
    outlineStyle: 'solid',
  },

  disabledStyle: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },

  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary',
        color: 'white',
      },
      secondary: {
        backgroundColor: '$secondary',
        color: 'white',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor',
        color: '$color',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '$color',
      },
    },

    size: {
      small: {
        padding: '$2',
        fontSize: '$2',
      },
      medium: {
        padding: '$3',
        fontSize: '$3',
      },
      large: {
        padding: '$4',
        fontSize: '$4',
      },
    },
  },

  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
} as const)

export type ButtonProps = GetProps<typeof Button>
```

#### 5.4 Create Base Card Component
Create `/website/src/components/tamagui/Card.tsx`:

```typescript
import { GetProps, styled } from 'tamagui'
import { Stack } from 'tamagui'

export const Card = styled(Stack, {
  name: 'Card',

  backgroundColor: '$background',
  borderColor: '$borderColor',
  borderWidth: 1,
  borderRadius: '$3',
  padding: '$4',

  hoverStyle: {
    borderColor: '$borderColorHover',
  },

  variants: {
    elevated: {
      true: {
        shadowColor: '$color',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
      },
    },
  },
} as const)

export type CardProps = GetProps<typeof Card>
```

#### 5.5 Create Base Text Components
Create `/website/src/components/tamagui/Text.tsx`:

```typescript
import { GetProps, styled } from 'tamagui'
import { Text as TamaguiText } from 'tamagui'

export const Text = styled(TamaguiText, {
  name: 'Text',
  color: '$color',
  fontSize: '$3',
})

export const Heading = styled(TamaguiText, {
  name: 'Heading',
  tag: 'h2',
  color: '$color',
  fontSize: '$8',
  fontWeight: '700',
  marginBottom: '$4',
})

export const Paragraph = styled(TamaguiText, {
  name: 'Paragraph',
  tag: 'p',
  color: '$color',
  fontSize: '$3',
  lineHeight: 1.6,
  marginBottom: '$3',
})

export type TextProps = GetProps<typeof Text>
export type HeadingProps = GetProps<typeof Heading>
export type ParagraphProps = GetProps<typeof Paragraph>
```

#### 5.6 Create Index Export
Create `/website/src/components/tamagui/index.ts`:

```typescript
export * from './Button'
export * from './Card'
export * from './Text'
export { Stack, XStack, YStack, ZStack } from 'tamagui'
```

#### 5.7 Create Test File
Create `/website/test/components/tamagui/Button.test.tsx`:

```typescript
import { render } from '@testing-library/react'
import { TamaguiProvider } from '@/components/TamaguiProvider'
import { Button } from '@/components/tamagui'

function renderWithProvider(component: React.ReactElement) {
  return render(
    <TamaguiProvider>{component}</TamaguiProvider>
  )
}

describe('Tamagui Button', () => {
  it('renders without crashing', () => {
    const { getByText } = renderWithProvider(
      <Button>Click Me</Button>
    )
    expect(getByText('Click Me')).toBeDefined()
  })

  it('applies variant styles', () => {
    const { container } = renderWithProvider(
      <Button variant="secondary">Secondary</Button>
    )
    expect(container).toBeDefined()
  })
})
```

### Verification Checklist
- [ ] All component files created
- [ ] TypeScript compiles without errors
- [ ] `npm run build` succeeds
- [ ] Tests pass: `npm run test`
- [ ] Components render in isolation
- [ ] No impact on existing Tailwind components

### Rollback
**→ ACTION REQUIRED:** To rollback this phase:
```bash
git checkout tamagui-migration-phase-4
rm -rf website/src/components/tamagui
rm -rf website/test/components/tamagui
```

---

## Phase 6: Incremental Component Migration

**Goal:** Convert one component at a time from Tailwind to Tamagui
**Duration:** 4-6 hours (depends on component count)
**Risk:** Medium (requires careful conversion)

### Migration Order (By Complexity)

1. ✅ **ThemeToggle.tsx** (simplest - just a button)
2. ✅ **StatsSummary.tsx** (card with text)
3. ✅ **GameControls.tsx** (buttons)
4. ✅ **StateSelector.tsx** (dropdown)
5. ✅ **DistrictSelector.tsx** (dropdown)
6. ✅ **GameResults.tsx** (layout with cards)
7. ✅ **QuestionStatisticsTable.tsx** (table)
8. ✅ **GameQuestion.tsx** (complex layout)
9. ✅ **QuestionDetailModal.tsx** (modal)
10. ✅ **Layout.tsx** (main layout - last)

### Per-Component Migration Process

For **each component** in the order above:

#### 6.X.1 Checkpoint: Prepare Component Migration
**→ ACTION REQUIRED:** Before starting each component, you may want to create a checkpoint:
```bash
git checkout -b tamagui-migration-component-{name}
```
Or simply work on the Phase 6 branch and commit after each component.

#### 6.X.2 Read Original Component
```bash
cat website/src/components/{ComponentName}.tsx
```

#### 6.X.3 Create Tamagui Version
Create plan:
1. Identify all Tailwind classes
2. Map each class to Tamagui props
3. Replace with Tamagui components
4. Preserve all functionality
5. Maintain TypeScript types

Example mapping:
```
Tailwind → Tamagui
-----------------
className="flex items-center" → <XStack alignItems="center">
className="bg-blue-600" → backgroundColor="$primary"
className="p-4" → padding="$4"
className="rounded-lg" → borderRadius="$3"
className="shadow-md" → elevated
className="hover:bg-blue-700" → hoverStyle={{ backgroundColor: '$primaryHover' }}
className="dark:bg-gray-800" → (handled by theme)
```

#### 6.X.4 Replace Component File
- Backup original: `cp {Component}.tsx {Component}.tsx.tailwind.backup`
- Write new Tamagui version
- Keep same exports and props interface

#### 6.X.5 Test Component
```bash
npm run build
npm run test
npm run dev
```

Visual check:
- [ ] Component renders correctly
- [ ] Light mode matches original
- [ ] Dark mode matches original
- [ ] Hover states work
- [ ] Press states work
- [ ] Responsive behavior maintained

#### 6.X.6 Compare Screenshots
Take new screenshots and compare with baseline:
```bash
# Manual visual comparison
open website/docs/visual-regression-baseline/{page}.png
# vs current rendering in browser
```

#### 6.X.7 Checkpoint: Save Component Progress
**→ ACTION REQUIRED:** After successfully migrating a component, create a checkpoint:
```bash
git add website/src/components/{ComponentName}.tsx
git commit -m "Migrate {ComponentName} to Tamagui"
```

#### 6.X.8 Clean, Install, Build, Test
```bash
cd website
npm run clean
npm install
npm run build
npm run test
```

**Success Criteria for Each Component:**
- [ ] TypeScript compiles
- [ ] Build succeeds
- [ ] Tests pass
- [ ] Visual appearance matches original
- [ ] Dark mode works
- [ ] Interactive states work
- [ ] No console errors
- [ ] No warnings

**If component fails:**
```bash
# Restore backup
cp {Component}.tsx.tailwind.backup {Component}.tsx
npm run build
```

### Component-Specific Notes

#### ThemeToggle.tsx
- Simple button component
- Needs to toggle Tamagui theme
- Update theme switching logic

#### StateSelector.tsx / DistrictSelector.tsx
- May need Tamagui Select component
- Or create custom with Stack + Pressable

#### QuestionDetailModal.tsx
- Use Tamagui Dialog or Sheet
- Maintain modal behavior

#### Layout.tsx
- Most complex
- Do this last
- Requires all other components working

### Verification Checklist (After Each Component)
- [ ] Component converted
- [ ] Build succeeds
- [ ] Tests pass
- [ ] Visual regression check passed
- [ ] Dark mode works
- [ ] Accessibility maintained
- [ ] No performance regression
- [ ] Backup created
- [ ] Git commit created

---

## Phase 7: Remove Tailwind

**Goal:** Remove Tailwind CSS after all components migrated
**Duration:** 30 minutes
**Risk:** Low (all components already using Tamagui)

### Prerequisites
✅ All components migrated to Tamagui
✅ Visual regression tests pass
✅ All functionality verified

### Steps

#### 7.1 Checkpoint: Create Phase Branch
**→ ACTION REQUIRED:** Please create a branch for this phase:
```bash
git checkout -b tamagui-migration-phase-7
```

#### 7.2 Remove Tailwind Packages
```bash
cd website
npm uninstall tailwindcss @tailwindcss/postcss
```

#### 7.3 Remove Tailwind Config
```bash
rm website/tailwind.config.js
rm website/postcss.config.js
```

#### 7.4 Remove Tailwind Imports
Update `/website/src/app/globals.css`:
- Remove `@tailwind` directives
- Keep any custom CSS (if needed)
- Or delete file if only Tailwind

#### 7.5 Update Layout
Remove Tailwind CSS import from layout if present.

#### 7.6 Clean Build
```bash
npm run clean
npm install
npm run build
```

### Verification Checklist
- [ ] Build succeeds
- [ ] No Tailwind in dependencies
- [ ] No Tailwind config files
- [ ] All pages render correctly
- [ ] Dark mode works
- [ ] Tests pass
- [ ] Bundle size reduced

### Rollback
**→ ACTION REQUIRED:** To rollback this phase:
```bash
git checkout tamagui-migration-phase-6
cd website
npm install
npm run build
```

---

## Phase 8: Enable Tamagui Optimizations

**Goal:** Enable compiler optimizations for production
**Duration:** 30 minutes
**Risk:** Low

### Prerequisites
✅ Tailwind removed
✅ All components using Tamagui

### Steps

#### 8.1 Checkpoint: Create Phase Branch
**→ ACTION REQUIRED:** Please create a branch for this phase:
```bash
git checkout -b tamagui-migration-phase-8
```

#### 8.2 Update next.config.js
Enable optimizations:

```javascript
const { withTamagui } = require('@tamagui/next-plugin')

module.exports = function (name, { defaultConfig }) {
  let config = {
    ...defaultConfig,
    reactStrictMode: true,
    swcMinify: true,
  }

  const tamaguiPlugin = withTamagui({
    config: './tamagui.config.ts',
    components: ['tamagui'],
    // Enable optimization for production
    outputCSS: process.env.NODE_ENV === 'production' ? './public/tamagui.css' : null,
    disableExtraction: process.env.NODE_ENV === 'development',
    logTimings: true,
  })

  return {
    ...config,
    ...tamaguiPlugin(config),
  }
}
```

#### 8.3 Update TamaguiProvider
Enable CSS injection control:

```typescript
'use client'

import '@tamagui/core/reset.css'
import { useServerInsertedHTML } from 'next/navigation'
import { TamaguiProvider as TamaguiProviderCore } from 'tamagui'
import tamaguiConfig from '../../tamagui.config'

// Load production CSS
if (process.env.NODE_ENV === 'production') {
  require('../../../public/tamagui.css')
}

export function TamaguiProvider({ children }: { children: React.ReactNode }) {
  useServerInsertedHTML(() => {
    if (process.env.NODE_ENV === 'production') {
      return null // CSS loaded from file
    }

    const styles = tamaguiConfig.getNewCSS()

    if (styles) {
      return (
        <style
          dangerouslySetInnerHTML={{ __html: styles }}
          id="tamagui-ssr"
        />
      )
    }

    return null
  })

  return (
    <TamaguiProviderCore
      config={tamaguiConfig}
      disableRootThemeClass
      disableInjectCSS={process.env.NODE_ENV === 'production'}
    >
      {children}
    </TamaguiProviderCore>
  )
}
```

#### 8.4 Test Production Build
```bash
npm run clean
npm install
NODE_ENV=production npm run build
```

Check for:
- [ ] `public/tamagui.css` created
- [ ] Build logs show optimization stats
- [ ] Build completes successfully

### Verification Checklist
- [ ] Production build succeeds
- [ ] CSS extraction works
- [ ] File size optimized
- [ ] Dev mode still fast (extraction disabled)
- [ ] All pages render in production build
- [ ] No console errors
- [ ] Tests pass

### Performance Comparison
Record new metrics:
- [ ] Build time: _______ seconds
- [ ] Bundle size: _______ MB
- [ ] Tamagui CSS size: _______ KB
- [ ] Lighthouse score: _______

Compare with Phase 0 baseline.

### Rollback
**→ ACTION REQUIRED:** To rollback this phase:
```bash
git checkout tamagui-migration-phase-7
cd website
npm run clean
npm install
```

---

## Phase 9: Final Cleanup & Documentation

**Goal:** Clean up temporary files, update documentation
**Duration:** 30 minutes
**Risk:** Low

### Steps

#### 9.1 Checkpoint: Create Phase Branch
**→ ACTION REQUIRED:** Please create a branch for this phase:
```bash
git checkout -b tamagui-migration-phase-9
```

#### 9.2 Remove Backup Files
```bash
cd website/src/components
rm -f *.tailwind.backup
```

#### 9.3 Remove Old Design Token Files
```bash
rm website/src/styles/design-tokens.css
# Keep any files still needed for custom CSS
```

#### 9.4 Update Documentation
Update `/website/README.md`:
- Document Tamagui usage
- Update styling guide
- List available components

Create `/website/docs/tamagui-guide.md`:
```markdown
# Tamagui Usage Guide

## Components
All components are in `/src/components/tamagui/`

## Creating New Components
Use styled() with design tokens

## Theme Switching
Theme is managed by TamaguiProvider

## Media Queries
Use $gtSm, $gtMd, $gtLg props
```

#### 9.5 Update CLAUDE.md
Add Tamagui-specific guidelines:
```markdown
## Tamagui

- Use Tamagui components from @/components/tamagui
- Always use design tokens ($primary, $4, etc.)
- Prefer variants over conditional styles
- Use XStack/YStack for layout
- Theme values for colors, not hardcoded
```

#### 9.6 Final Test Suite
```bash
npm run clean
npm install
npm run build
npm run test
npm run test:coverage
```

#### 9.7 Create Migration Report
Create `/website/docs/tamagui-migration-report.md`:

```markdown
# Tamagui Migration Report

## Summary
- Start Date: _______
- End Date: _______
- Duration: _______ hours

## Metrics
### Before (Tailwind)
- Build time: _______ seconds
- Bundle size: _______ MB
- Test count: _______

### After (Tamagui)
- Build time: _______ seconds
- Bundle size: _______ MB
- Test count: _______
- Improvement: _______ %

## Components Migrated
- [ ] ThemeToggle
- [ ] StatsSummary
- [ ] GameControls
... (list all)

## Issues Encountered
1. ...
2. ...

## Lessons Learned
1. ...
2. ...
```

### Verification Checklist
- [ ] All backups removed
- [ ] Documentation updated
- [ ] README.md reflects Tamagui
- [ ] CLAUDE.md updated
- [ ] Migration report created
- [ ] Final tests pass
- [ ] No warnings in build
- [ ] Production build optimized

---

## Merge to Main

### Prerequisites
✅ All phases completed
✅ All tests passing
✅ Visual regression verified
✅ Performance acceptable

### Steps

**→ ACTION REQUIRED:** When ready to merge, please perform the following git operations:

#### 1. Final Review
```bash
git diff tamagui-migration-baseline..tamagui-migration-phase-9
```

#### 2. Squash Commits (Optional)
```bash
git checkout tamagui
git merge --squash tamagui-migration-phase-9
git commit -m "Migrate from Tailwind CSS to Tamagui

- Add Tamagui dependencies and configuration
- Create design token mapping
- Migrate all 18 components
- Remove Tailwind CSS
- Enable production optimizations
- Update documentation

BREAKING CHANGE: Tailwind CSS removed, all components now use Tamagui"
```

#### 3. Create Pull Request
If using PRs:
- Create PR from `tamagui-migration-phase-9` to `main`
- Add migration report
- Request review
- Merge after approval

#### 4. Tag Release
```bash
git tag -a v2.0.0-tamagui -m "Tamagui migration complete"
git push origin v2.0.0-tamagui
```

---

## Rollback Strategy

### Emergency Rollback (Any Phase)
**→ ACTION REQUIRED:** To rollback to baseline:
```bash
# Rollback to baseline
git checkout tamagui
git reset --hard tamagui-migration-baseline
cd website
npm run clean
npm install
npm run build
```

### Partial Rollback (Specific Component)
Claude will restore component from backup when needed:
```bash
# Restore component from backup
cp src/components/{Component}.tsx.tailwind.backup src/components/{Component}.tsx
npm run build
```

---

## Common Issues & Solutions

### Issue 1: Build Fails After Adding Plugin
**Symptom:** Next.js build fails with Tamagui errors
**Solution:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

### Issue 2: Styles Not Applying
**Symptom:** Components render but have no styles
**Solution:**
- Check TamaguiProvider is wrapping app
- Verify config is imported correctly
- Check theme is set

### Issue 3: TypeScript Errors
**Symptom:** Type errors with Tamagui components
**Solution:**
```typescript
// Add to tamagui.config.ts
declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
```

### Issue 4: Dark Mode Not Working
**Symptom:** Theme doesn't switch
**Solution:**
- Use `@tamagui/next-theme` for SSR
- Update ThemeToggle to use Tamagui theme API

### Issue 5: Animation Not Smooth
**Symptom:** Animations janky or not working
**Solution:**
- Ensure animation driver installed
- Check animations config
- Animate transform/opacity only

---

## Success Criteria

### Technical
- ✅ All components migrated
- ✅ Zero Tailwind dependencies
- ✅ All tests passing
- ✅ TypeScript compiles without errors
- ✅ Production build optimized
- ✅ No console errors
- ✅ No build warnings

### Visual
- ✅ All pages render identically to baseline
- ✅ Dark mode works
- ✅ Responsive design maintained
- ✅ Animations smooth
- ✅ Hover states work
- ✅ Focus states work

### Performance
- ✅ Build time acceptable (not worse than baseline)
- ✅ Bundle size reduced or comparable
- ✅ Lighthouse score maintained or improved
- ✅ No runtime performance regression

### Documentation
- ✅ README updated
- ✅ CLAUDE.md updated
- ✅ Migration report created
- ✅ Component guide created

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| 0: Preparation | 30 min | 30 min |
| 1: Install | 15 min | 45 min |
| 2: Config | 45 min | 1.5 hr |
| 3: Next.js Plugin | 30 min | 2 hr |
| 4: Provider | 45 min | 2.75 hr |
| 5: Base Components | 60 min | 3.75 hr |
| 6: Migration (18 components × 20 min avg) | 6 hr | 9.75 hr |
| 7: Remove Tailwind | 30 min | 10.25 hr |
| 8: Optimizations | 30 min | 10.75 hr |
| 9: Cleanup | 30 min | 11.25 hr |

**Total: 11-12 hours** (assuming no major issues)

---

## Notes

- This plan is designed to be executed **one phase at a time**
- Each phase has clear **verification criteria**
- **Rollback instructions** provided for each phase
- Components migrated **incrementally** to reduce risk
- **Dual mode** (Tailwind + Tamagui) maintained during transition
- **Clean, install, build, test** required after each phase
- Visual regression checked against baseline screenshots
- Git commits created at each checkpoint

**Do not proceed to next phase until current phase is 100% verified.**
