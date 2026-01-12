# Phase 2: Button Theming Fixes

## Overview

This plan addresses hardcoded color values in website components that should use Tamagui theme tokens. These issues were identified during the Tamagui migration and documented for Phase 9 cleanup but were not fully resolved.

**Priority:** Medium
**Estimated Effort:** 1.5-2 hours
**Affected Workspace:** website

---

## Background

The Tamagui Migration Report noted:

> **Known Limitations**
> - Button Theming: Some buttons still use hardcoded colors (documented for Phase 9)

And Phase 9 of the migration plan specified:

> **Fix approach:**
> 1. Replace hardcoded colors with theme tokens (`$primary`, `$secondary`)
> 2. Ensure buttons respond to theme changes (light/dark)
> 3. Verify hover/press states use theme-appropriate colors

---

## Available Theme Tokens

From `website/tamagui.config.ts`:

### Color Tokens

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `$primary` | `#2563eb` | `#3b82f6` |
| `$primaryHover` | `#1d4ed8` | `#2563eb` |
| `$secondary` | `#dc2626` | `#ef4444` |
| `$secondaryHover` | `#b91c1c` | `#dc2626` |
| `$success` | `#22c55e` | `#22c55e` |
| `$error` | `#ef4444` | `#ef4444` |
| `$background` | `#ffffff` | `#1f2937` |
| `$backgroundHover` | `#f9fafb` | `#374151` |
| `$backgroundPress` | `#f3f4f6` | `#4b5563` |
| `$color` | `#111827` | `#f9fafb` |
| `$borderColor` | `#d1d5db` | `#374151` |
| `$placeholderColor` | `#9ca3af` | `#6b7280` |

### Theme Context Pattern

```typescript
import { useThemeContext, themeColors } from '@/components/TamaguiProvider'

const { theme } = useThemeContext()  // 'light' | 'dark'
const colors = themeColors[theme]
```

---

## Issue 1: GameControls.tsx

### Location

`website/src/components/GameControls.tsx`

### Status: COMPLIANT ✓

Investigation revealed this file already correctly uses theme tokens:

- `PrimaryButton`: Uses `$primary` with `$primaryHover` on hover
- `SecondaryButton`: Uses `$backgroundPress` with `$backgroundHover` on hover

**No changes needed.**

---

## Issue 2: GameResults.tsx

### Location

`website/src/components/GameResults.tsx`

### Problems Found

**Problem A: `getResultColor()` function (lines 194-202)**

```typescript
const getResultColor = (): string => {
  if (result.isEarlyFail === true) {
    return '#dc2626'  // Hardcoded red-600
  } else if (result.isEarlyWin === true || result.percentage >= 60) {
    return '#16a34a'  // Hardcoded green-600
  } else {
    return '#dc2626'  // Hardcoded red-600
  }
}
```

**Problem B: `getScoreColor()` function (lines 204-208)**

```typescript
const getScoreColor = (): string => {
  if (result.percentage >= 80) return '#16a34a'  // Hardcoded green-600
  if (result.percentage >= 60) return '#2563eb'  // Hardcoded blue-600
  return '#dc2626'  // Hardcoded red-600
}
```

**Problem C: SVG stroke colors (lines 221, 238)**

```typescript
stroke="#16a34a"  // Success icon - hardcoded
stroke="#dc2626"  // Failure icon - hardcoded
```

### Solution

**Step 1: Add theme context**

```typescript
const { theme } = useThemeContext()
const colors = themeColors[theme]
```

**Step 2: Update color functions**

```typescript
const getResultColor = (): string => {
  if (result.isEarlyFail === true) {
    return colors.error
  } else if (result.isEarlyWin === true || result.percentage >= 60) {
    return colors.success
  } else {
    return colors.error
  }
}

const getScoreColor = (): string => {
  if (result.percentage >= 80) return colors.success
  if (result.percentage >= 60) return colors.primary
  return colors.error
}
```

**Step 3: Update SVG strokes**

```typescript
stroke={colors.success}  // Success icon
stroke={colors.error}    // Failure icon
```

### Files to Modify

- `website/src/components/GameResults.tsx`

---

## Issue 3: QuestionDetailModal.tsx (CRITICAL)

### Location

`website/src/components/QuestionDetailModal.tsx:242-283`

### Problem

The entire `dynamicColors` object manually duplicates theme logic with ~15 hardcoded hex values instead of using the theme system.

**Current Code:**

```typescript
const dynamicModalStyles = useMemo((): React.CSSProperties => ({
  backgroundColor: isDark ? '#1a1a1a' : 'white',
  // ...
}), [isDark])

const dynamicThStyles = useMemo((): React.CSSProperties => ({
  color: isDark ? '#d1d5db' : '#374151',
  backgroundColor: isDark ? '#262626' : '#f9fafb',
}), [isDark])

const dynamicTdStyles = useMemo((): React.CSSProperties => ({
  borderTop: `1px solid ${isDark ? '#404040' : '#e5e7eb'}`,
}), [isDark])

const dynamicColors = useMemo(() => ({
  text: isDark ? '#e5e5e5' : '#111827',
  muted: isDark ? '#a1a1aa' : '#6b7280',
  success: isDark ? '#22c55e' : '#16a34a',
  primary: isDark ? '#60a5fa' : '#2563eb',
  purple: isDark ? '#a78bfa' : '#9333ea',
  successBg: isDark ? '#166534' : '#dcfce7',
  successText: isDark ? '#bbf7d0' : '#166534',
  errorBg: isDark ? '#7f1d1d' : '#fee2e2',
  errorText: isDark ? '#fecaca' : '#991b1b',
  border: isDark ? '#404040' : '#e5e7eb',
  iconStroke: isDark ? '#a1a1aa' : '#9ca3af',
}), [isDark])
```

### Impact

- Duplicates Tamagui's theme system
- Colors won't update if theme tokens change
- Maintenance burden - two sources of truth
- Manual light/dark branching throughout component

### Solution

**Step 1: Replace manual isDark checks with theme context**

```typescript
// Remove: const isDark = theme === 'dark'
// Use: const { theme } = useThemeContext()
const colors = themeColors[theme]
```

**Step 2: Map dynamicColors to theme tokens**

```typescript
const dynamicColors = useMemo(() => ({
  text: colors.text,
  muted: colors.textMuted,
  success: colors.success,
  primary: colors.primary,
  purple: colors.purple,  // May need to add to theme
  successBg: colors.successBg,
  successText: colors.successText,
  errorBg: colors.errorBg,
  errorText: colors.errorText,
  border: colors.border,
  iconStroke: colors.textMuted,
}), [colors])
```

**Step 3: Update themeColors in TamaguiProvider if needed**
If any colors are missing from `themeColors`, add them:

```typescript
// In TamaguiProvider.tsx
export const themeColors = {
  light: {
    // ... existing colors
    purple: '#9333ea',
    successBg: '#dcfce7',
    successText: '#166534',
    errorBg: '#fee2e2',
    errorText: '#991b1b',
  },
  dark: {
    // ... existing colors
    purple: '#a78bfa',
    successBg: '#166534',
    successText: '#bbf7d0',
    errorBg: '#7f1d1d',
    errorText: '#fecaca',
  }
}
```

**Step 4: Update style objects**

```typescript
const dynamicModalStyles = useMemo((): React.CSSProperties => ({
  backgroundColor: colors.cardBg,
  // ...
}), [colors])

const dynamicThStyles = useMemo((): React.CSSProperties => ({
  color: colors.textMuted,
  backgroundColor: colors.backgroundHover,
}), [colors])

const dynamicTdStyles = useMemo((): React.CSSProperties => ({
  borderTop: `1px solid ${colors.border}`,
}), [colors])
```

### Files to Modify

- `website/src/components/QuestionDetailModal.tsx`
- `website/src/components/TamaguiProvider.tsx` (add missing color tokens)

---

## Issue 4: StateSelector.tsx

### Location

`website/src/components/StateSelector.tsx:217-227`

### Problem

Select element inline styles use hardcoded colors:

```typescript
style={{
  borderColor: '#d1d5db',      // Hardcoded gray-300
  backgroundColor: 'white',     // Hardcoded white
}}
```

### Solution

```typescript
const { theme } = useThemeContext()
const colors = themeColors[theme]

// In JSX
style={{
  borderColor: colors.border,
  backgroundColor: colors.cardBg,
}}
```

### Files to Modify

- `website/src/components/StateSelector.tsx`

---

## Implementation Order

1. **StateSelector.tsx** (15 min) - Simplest, good warmup
2. **GameResults.tsx** (30 min) - Straightforward function updates
3. **QuestionDetailModal.tsx** (45 min) - Most complex, may need TamaguiProvider updates
4. **TamaguiProvider.tsx** (15 min) - Add any missing color tokens

---

## Verification

### Manual Testing

```bash
cd website
npm run dev
```

**Test each page in both themes:**

1. Toggle between light and dark mode
2. Verify GameResults colors change appropriately
3. Open QuestionDetailModal - verify all colors adapt
4. Check StateSelector dropdown styling
5. No hardcoded colors should remain visible when theme changes

### Automated Tests

```bash
cd website
npm test
```

---

## Verification Checklist

- [ ] GameResults success/error colors use theme tokens
- [ ] GameResults SVG strokes use dynamic colors
- [ ] QuestionDetailModal uses theme context (not isDark checks)
- [ ] QuestionDetailModal all 15+ colors use theme tokens
- [ ] StateSelector uses theme colors for borders/backgrounds
- [ ] TamaguiProvider has all required color tokens
- [ ] Light mode displays correctly
- [ ] Dark mode displays correctly
- [ ] Theme toggle transitions smoothly
- [ ] All tests pass

---

## Color Mapping Reference

| Hardcoded Value | Theme Token | Usage |
|-----------------|-------------|-------|
| `#dc2626` | `colors.error` | Error/failure states |
| `#16a34a` | `colors.success` | Success states |
| `#2563eb` | `colors.primary` | Primary actions |
| `#d1d5db` | `colors.border` | Borders |
| `#111827` | `colors.text` | Primary text |
| `#6b7280` | `colors.textMuted` | Secondary text |
| `#f9fafb` | `colors.backgroundHover` | Hover backgrounds |
| `#ffffff` / `white` | `colors.cardBg` | Card backgrounds |
| `#1a1a1a` / `#1f2937` | `colors.cardBg` (dark) | Card backgrounds |
