# Website Code Review Report: TypeScript and React

**Date:** 2026-01-28
**Scope:** `/website/src` - 37 TypeScript files
**Status:** Build passes, all 50 tests pass, no lint errors

---

## Executive Summary

The civics100 website demonstrates solid TypeScript practices with strict typing enabled and no `any` types found. The codebase effectively uses Effect-TS for service composition and Schema for runtime validation. However, several patterns warrant attention for improved type safety, React best practices, and maintainability.

### Key Statistics
- **Type Assertions (`as` keyword):** 40 usages found (12 are harmless `as const`)
- **`any` Types:** 0 (excellent)
- **Error Boundaries:** None implemented
- **Direct localStorage Bypasses:** 3 locations

---

## Part 1: TypeScript Type Safety Issues

### Critical Issues

#### 1.1 Schema Casts in LocalStorageService.ts (Lines 310, 313)
**Severity:** Medium
**File:** `website/src/services/LocalStorageService.ts`

```typescript
// Line 310
return decodedOption.value as PairedAnswers

// Line 313
return {} as PairedAnswers
```

**Issue:** After schema validation, the decoded value is cast to `PairedAnswers`, but the schema's output type doesn't perfectly align. The `PairedAnswersSchema` is defined as:

```typescript
const PairedAnswersSchema = Schema.Record({
  key: Schema.String,
  value: Schema.Array(AnswerHistoryEntrySchema)
})
```

This produces `Record<string, Array<{ts: Date, correct: boolean}>>`, but `PairedAnswers` from questionnaire is:
```typescript
type PairedAnswers = Record<PairedQuestionNumber, AnswerHistory>
// Where PairedQuestionNumber = string & Brand.Brand<'PairedQuestionNumber'>
```

**Recommendation:** The cast is *necessary* here because Effect Schema cannot produce branded types. However, this should be documented:
```typescript
// Schema validates structure; brand is lost but keys are validated strings
// that would satisfy PairedQuestionNumber if branded
return decodedOption.value as PairedAnswers
```

Line 313's `{} as PairedAnswers` is safe since an empty record satisfies the type.

#### 1.2 Effect.runSync in SessionService.ts (Lines 38, 47)
**Severity:** Medium
**File:** `website/src/services/SessionService.ts`

```typescript
// Line 38
return Effect.runSync(gameService.processGameAnswer(session, answer))

// Line 47
return Effect.runSync(gameService.calculateGameResult(session))
```

**Issue:** `Effect.runSync` will throw if the Effect:
1. Contains async operations
2. Fails with an error

**Analysis:** Reviewing the questionnaire package, these operations are actually synchronous computations (no I/O). However, the pattern is risky because:
- Future changes to GameService could introduce failures
- Stack traces become harder to debug

**Recommendation:** Consider wrapping in try-catch or converting to async pattern:
```typescript
const processAnswer = (gameService: GameService) =>
  (session: GameSession, answer: UserAnswer): Effect.Effect<GameSession, never, never> =>
    gameService.processGameAnswer(session, answer)
```

#### 1.3 Inline Type Import in types/index.ts (Line 35)
**Severity:** Low
**File:** `website/src/types/index.ts`

```typescript
userState: 'CA' as import('civics2json').StateAbbreviation,
```

**Recommendation:** Import at top level for clarity:
```typescript
import type { StateAbbreviation } from 'civics2json'
// ...
userState: 'CA' as StateAbbreviation,
```

---

### High Priority Issues

#### 1.4 Type Assertions in StateSelector.tsx
**Severity:** Medium
**File:** `website/src/components/StateSelector.tsx`

| Line | Code | Issue |
|------|------|-------|
| 74 | `detectedState: null as StateAbbreviation \| null` | Unnecessary, type inference works |
| 155 | `StatesByAbbreviation[stateAbbr as StateAbbreviation]` | Checked with `typeof` first - acceptable |
| 157 | `const detectedState = stateAbbr as StateAbbreviation` | Follows validation - acceptable |
| 198 | `event.target.value as StateAbbreviation` | **Needs guard** |

**Issue at Line 198:**
```typescript
const handleStateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  const newState = event.target.value as StateAbbreviation
  onStateChange(newState)
}
```

The select is populated with valid options, but a type guard would be safer:
```typescript
const handleStateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
  const value = event.target.value
  if (value in StatesByAbbreviation) {
    onStateChange(value as StateAbbreviation)
  }
}
```

#### 1.5 JSON.parse Cast in settings/page.tsx (Line 57)
**Severity:** Medium
**File:** `website/src/app/settings/page.tsx`

```typescript
const parsed = JSON.parse(savedSettings) as WebsiteGameSettings
setSettings(parsed)
```

**Issue:** No runtime validation - malformed localStorage data could crash the app.

**Recommendation:** Use Schema validation like LocalStorageService does:
```typescript
import { Schema, Option } from 'effect'

const decoded = Schema.decodeUnknownOption(WebsiteGameSettingsSchema)(JSON.parse(savedSettings))
if (Option.isSome(decoded)) {
  setSettings(decoded.value)
}
```

Or, better yet, use LocalStorageService directly instead of direct localStorage access.

#### 1.6 Enum Cast in statistics/page.tsx (Line 264)
**Severity:** Low
**File:** `website/src/app/statistics/page.tsx`

```typescript
onChange={(e) => setFilter(e.target.value as QuestionFilter)}
```

**Issue:** Select options match enum values, but cast bypasses validation.

**Recommendation:** Add validation:
```typescript
const value = e.target.value
if (Object.values(QuestionFilter).includes(value as QuestionFilter)) {
  setFilter(value as QuestionFilter)
}
```

---

### Good Practices Found

1. **No `any` types** - Strict mode is working well
2. **Branded types** (`QuestionNumber`, `PairedQuestionNumber`) used correctly in questionnaire package
3. **Type re-exports** in `types/index.ts` provide clean API
4. **Schema validation** for localStorage data in LocalStorageService
5. **`as const`** assertions used appropriately (12 instances)

---

## Part 2: React Pattern Issues

### Critical Issues

#### 2.1 Floating Promises with Effect.runPromise
**Severity:** High
**Files:** Multiple

| File | Line | Code |
|------|------|------|
| `game/page.tsx` | 144 | `runWithServicesAndErrorHandling(..., console.error)` |
| `page.tsx` | 59-61 | `Effect.runPromise(...).catch(console.error)` |
| `results/page.tsx` | 85-87 | `Effect.runPromise(...).catch(console.error)` |
| `statistics/page.tsx` | 60-93 | `runWithServicesAndErrorHandling(...)` |

**Issues:**
1. Promises not awaited - React can't track completion
2. State updates may occur after component unmounts
3. Error handling is inconsistent

**Recommendation:** Add mounted ref pattern consistently:
```typescript
useEffect(() => {
  let mounted = true

  const loadData = async () => {
    try {
      const result = await runWithServices(effect)
      if (mounted) setData(result)
    } catch (e) {
      if (mounted) setError(e)
    }
  }

  loadData()
  return () => { mounted = false }
}, [])
```

#### 2.2 Ref Syncing Anti-Pattern in game/page.tsx (Lines 109-114)
**Severity:** Medium
**File:** `website/src/app/game/page.tsx`

```typescript
const sessionRef = useRef(session)
const currentQuestionIndexRef = useRef(currentQuestionIndex)
const questionsRef = useRef(questions)
sessionRef.current = session
currentQuestionIndexRef.current = currentQuestionIndex
questionsRef.current = questions
```

**Issue:** Syncing refs on every render bypasses React's dependency tracking. This pattern is used to avoid stale closures in the setTimeout callback, but it's fragile.

**Recommendation:** Use functional setState or useCallback with proper deps:
```typescript
// Instead of using refs in setTimeout:
transitionTimeoutRef.current = setTimeout(() => {
  setSession(prevSession => {
    if (prevSession === null) return prevSession
    // use prevSession instead of sessionRef.current
  })
}, TRANSITION_DELAY_MS)
```

Or move the timeout logic into a custom hook.

#### 2.3 Direct localStorage Access Bypassing Service Layer
**Severity:** Medium
**Files:** Multiple locations

| File | Lines | Usage |
|------|-------|-------|
| `settings/page.tsx` | 53-65 | `localStorage.getItem/setItem('civics100_game_settings')` |
| `game/page.tsx` | 307-317 | `localStorage.getItem/setItem('civics-keyboard-help-seen')` |
| `TamaguiProvider.tsx` | 98-110 | `localStorage.getItem/setItem('theme')` |

**Issue:**
- Inconsistent with LocalStorageService pattern
- Different error handling approaches
- settings/page.tsx bypasses Schema validation

**Recommendation:**
- Add `theme` and `keyboardHelpSeen` to LocalStorageService
- Use service consistently across all components

---

### High Priority Issues

#### 2.4 No Error Boundaries
**Severity:** High
**Files:** Entire app

**Issue:** No React Error Boundary components exist. If a component throws during rendering, the entire app crashes.

**Recommendation:** Add error boundary wrapping main content:
```typescript
// components/ErrorBoundary.tsx
'use client'
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>
    }
    return this.props.children
  }
}
```

Use in Layout:
```typescript
<ErrorBoundary fallback={<ErrorFallbackUI />}>
  {children}
</ErrorBoundary>
```

#### 2.5 Mixed Styling Approaches
**Severity:** Low-Medium
**Files:** Throughout codebase

| Approach | Count | Examples |
|----------|-------|----------|
| Tamagui `styled()` | 15+ | `QuestionCard`, `Label`, etc. |
| Inline style objects | 20+ | `style={{ display: 'flex', ...}}` |
| CSS classes | 10+ | `className="card card-elevated"` |
| Hardcoded colors | 5+ | DistrictSelector lines 33-67 |

**Issue:** DistrictSelector has hardcoded colors that don't respond to theme:
```typescript
// DistrictSelector.tsx lines 33-67
borderColor: '#d1d5db',  // gray-300 - hardcoded!
backgroundColor: '#f9fafb',  // gray-50 - hardcoded!
color: '#6b7280',  // gray-500 - hardcoded!
```

**Recommendation:** Use theme context in DistrictSelector like other components.

#### 2.6 useEffect Dependencies Issues
**Severity:** Medium
**File:** `results/page.tsx` (lines 70-72)

```typescript
useEffect(() => {
  loadData()
}, [])
```

**Issue:** `loadData` is not memoized with useCallback, yet it's called in useEffect with empty deps. This works but is inconsistent with other pages that use useCallback.

**File:** `DistrictSelector.tsx` (lines 89-112)

```typescript
useEffect(() => {
  // ...
  if (stateDistricts.length === 1 && selectedDistrict !== stateDistricts[0]) {
    onDistrictChangeRef.current(stateDistricts[0])
  }
  else if (selectedDistrict !== null && selectedDistrict !== undefined && !stateDistricts.includes(selectedDistrict)) {
    onDistrictChangeRef.current(undefined)
  }
}, [selectedState, selectedDistrict])  // Effect modifies selectedDistrict!
```

**Issue:** Effect depends on `selectedDistrict` but also modifies it via callback. While the ref pattern prevents infinite loops, this is confusing logic.

---

### Good Practices Found

1. **Keyboard navigation** implemented with proper ARIA attributes
2. **Focus restoration** handled in modals via button auto-focus
3. **Skip link** present in Layout for accessibility
4. **aria-live regions** for feedback (GameQuestion line 422-423)
5. **Consistent hook usage** - useCallback for handlers, useMemo for expensive computations
6. **Sound feedback** properly abstracted in useGameSounds hook

---

## Part 3: Verification Results

### Build Status
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (10/10)
```

### Test Status
```
Test Suites: 5 passed, 5 total
Tests:       50 passed, 50 total
```

### Lint Status
```
✔ No ESLint warnings or errors
```

---

## Prioritized Recommendations

### Must Fix
1. Add Error Boundary component to prevent full app crashes
2. Fix DistrictSelector hardcoded colors to use theme

### Should Fix
3. Add mounted ref pattern to all useEffect with async operations
4. Move theme and keyboard help to LocalStorageService
5. Add Schema validation to settings/page.tsx JSON.parse

### Nice to Have
6. Add type guard to StateSelector.handleStateChange
7. Consider converting SessionService Effect.runSync to async pattern
8. Document schema cast rationale in LocalStorageService
9. Add type guard to statistics/page.tsx filter enum cast

---

## Files Reviewed

### Critical Files
| File | Status | Issues |
|------|--------|--------|
| `LocalStorageService.ts` | ✅ Reviewed | Schema casts documented |
| `SessionService.ts` | ✅ Reviewed | Effect.runSync noted |
| `game/page.tsx` | ✅ Reviewed | Ref syncing, floating promises |
| `TamaguiProvider.tsx` | ✅ Reviewed | Direct localStorage |

### High Priority Files
| File | Status | Issues |
|------|--------|--------|
| `settings/page.tsx` | ✅ Reviewed | JSON.parse cast, direct localStorage |
| `StateSelector.tsx` | ✅ Reviewed | Type assertion on select |
| `types/index.ts` | ✅ Reviewed | Inline import |
| `ServiceProvider.ts` | ✅ Reviewed | Clean implementation |

### Medium Priority Files
| File | Status | Issues |
|------|--------|--------|
| `statistics/page.tsx` | ✅ Reviewed | Enum cast |
| `results/page.tsx` | ✅ Reviewed | useEffect deps |
| `GameQuestion.tsx` | ✅ Reviewed | Good accessibility |
| `DistrictSelector.tsx` | ✅ Reviewed | Hardcoded colors |

---

## Conclusion

The codebase demonstrates strong TypeScript practices with effective use of Effect-TS and branded types. The main areas for improvement are:

1. **Error resilience** - Adding Error Boundaries
2. **Consistency** - Unifying localStorage access through service layer
3. **Type safety** - Adding guards for select/input casts
4. **React patterns** - Proper async effect handling

The build passes, tests pass, and no lint errors exist - indicating a production-ready codebase with room for defensive improvements.

---

## Implementation Status (2026-01-28)

All prioritized recommendations have been implemented:

### Completed Fixes

| # | Recommendation | Status | Files Changed |
|---|----------------|--------|---------------|
| 1 | Add Error Boundary component | ✅ Done | `ErrorBoundary.tsx` (new), `Layout.tsx` |
| 2 | Fix DistrictSelector hardcoded colors | ✅ Done | `DistrictSelector.tsx` |
| 3 | Add mounted ref pattern to async effects | ✅ Done | `page.tsx`, `game/page.tsx`, `results/page.tsx`, `statistics/page.tsx` |
| 4 | Consolidate localStorage access | ✅ Partial | `settings/page.tsx` - uses LocalStorageService now |
| 5 | Add Schema validation to settings | ✅ Done | `settings/page.tsx` - uses LocalStorageService |
| 6 | Add type guard to StateSelector | ✅ Done | `StateSelector.tsx` |
| 7 | Effect.runSync pattern | ⏭️ Deferred | Low risk, would require API changes |
| 8 | Document schema casts | ✅ Done | `LocalStorageService.ts` |
| 9 | Add type guard to statistics filter | ✅ Done | `statistics/page.tsx` |

### Notes

- **Task #4 (localStorage consolidation)**: Theme storage in TamaguiProvider and keyboard help flag in game/page.tsx were left as direct localStorage access. TamaguiProvider runs before the service provider context is available, and these simple string/boolean values don't benefit from Schema validation.

- **Task #7 (Effect.runSync)**: Deferred because the underlying operations are synchronous and the current pattern works. Converting would require API changes to SessionService.

### Verification

```
Build:  ✅ Passes
Tests:  ✅ 50/50 pass
Lint:   ✅ No errors
```
