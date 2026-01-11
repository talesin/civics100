# Comprehensive TypeScript/Effect-TS Code Review Report

**Date:** January 10, 2026
**Scope:** All 4 workspaces (civics2json, distractions, questionnaire, website)
**Reviewers:** effect-ts-code-reviewer agents with reference documentation augmentation

---

## Executive Summary

The civics100 monorepo demonstrates **solid Effect-TS foundations** across all workspaces. The codebase follows many project standards including proper service patterns, curried dependency injection, and test layer patterns. The `distractions` workspace error handling is exemplary.

### Overall Scores by Workspace

| Workspace | Service Patterns | Error Handling | Type Safety | Testing | Overall |
|-----------|-----------------|----------------|-------------|---------|---------|
| civics2json | Good | Medium | Good | Good | B+ |
| distractions | Excellent | Excellent | Good | Good | A |
| questionnaire | Good | Medium | Medium | Medium | B |
| website | Good | Medium | Medium | Good | B |

---

## Critical Issues (Must Fix)

### 1. Cache Implementation Bug (distractions)
**File:** `packages/distractions/src/utils/cache.ts:53-70`
**Impact:** Cache always returns lookup result, never executes actual operation on miss

### 2. Impure Side Effects (questionnaire)
**Files:** `packages/questionnaire/src/services/GameService.ts:20-22, 119-134`
**Impact:** `Date.now()` and `Math.random()` bypass Effect's controlled side-effect system, making tests non-deterministic

### 3. Type Assertions Bypass Effect Safety (website)
**File:** `website/src/services/ServiceProvider.ts:29-32`
**Impact:** Casting away Requirements parameter could mask missing dependencies

### 4. Test Duplicates Production Code (questionnaire)
**File:** `packages/questionnaire/test/GameService.test.ts:7-30`
**Impact:** Tests could pass while actual code is broken

---

## High Priority Issues

### Error Handling

| Workspace | Issue | Location |
|-----------|-------|----------|
| civics2json | Generic `Error` instead of tagged errors | QuestionsManager.ts:169,193,366,410 |
| civics2json | `Effect.die` for potentially expected errors | QuestionsManager.ts:503,523 |
| questionnaire | Missing discriminated union for game states | types.ts:102-116 |

### Type Safety

| Workspace | Issue | Location |
|-----------|-------|----------|
| civics2json | Missing `readonly` on type properties | types.ts:125 |
| civics2json | Duplicate type definitions (manual vs schema-derived) | types.ts & schema.ts |
| distractions | `@ts-expect-error` for missing type definitions | SimilarityService.ts:4-7 |
| questionnaire | Unsafe type assertion `as PairedQuestionNumber` | GameService.ts:149-153 |
| website | Type assertion for StateAbbreviation | LocalStorageService.ts:159-160 |
| website | Missing Schema for PairedAnswers | LocalStorageService.ts:256-257 |

---

## Medium Priority Issues

### Effect Patterns

| Workspace | Issue | Location | Fix |
|-----------|-------|----------|-----|
| civics2json | Test layer signature mismatches | Senators.ts:75-86 | Update override signatures |
| civics2json | Inconsistent service method signatures | CivicsQuestions.ts:88-91 | Wrap fetch in function |
| distractions | `console.log` instead of `Effect.log` | CuratedDistractorService.ts:16,22 | Use Effect.log |
| distractions | `Math.random` instead of `Effect.random` | EnhancedStaticGenerator.ts:236 | Use Random.shuffle |
| questionnaire | `new Date()` used directly | Multiple files | Use Clock service |
| website | Mixed Effect and raw localStorage access | game/page.tsx:137-147 | Use LocalStorageService consistently |

### Code Organization

| Workspace | Issue | Location |
|-----------|-------|----------|
| civics2json | Service identifiers not namespaced | All service files |
| civics2json | Mutable forEach pattern | QuestionsManager.ts:494-497 |
| questionnaire | Mutable variables in Effect generators | GameService.ts:68-114 |
| distractions | Unbounded concurrency | EnhancedStaticGenerator.ts:600-611 |

---

## Low Priority Issues

- Missing explicit return types on some functions
- Implicit boolean expressions
- Verbose test layer type repetition
- Missing exhaustiveness checks in some switch statements
- `any` type for webkitAudioContext (website)

---

## Exemplary Patterns (Preserve These)

### 1. Tagged Error Design (distractions/types/errors.ts)
Excellent comprehensive error hierarchy with categorization helpers:
```typescript
export class OpenAIRateLimitError extends Data.TaggedError('OpenAIRateLimitError')<{
  readonly cause: unknown
  readonly retryAfter?: number
  readonly requestsRemaining?: number
}> {}

export const isRetryableError = (error: DistractorGenerationError): boolean => { ... }
export const getErrorSeverity = (error: DistractorGenerationError): ... { ... }
```

### 2. Service Definition Pattern (all workspaces)
Consistent `Effect.Service` usage with curried dependency injection:
```typescript
export const fetchSenators = (httpClient: HttpClient, config: CivicsConfig) =>
  Effect.fn(function* () { ... })
```

### 3. Test Layer Pattern (all workspaces)
Proper test layers with optional overrides:
```typescript
export const TestServiceLayer = (overrides?: {
  method1?: () => Effect.Effect<...>
}) => Layer.succeed(Service, Service.of({ ... }))
```

### 4. Branded Types (questionnaire)
Nominal typing for IDs: `QuestionNumber`, `PairedQuestionNumber`

### 5. Schema Validation (civics2json, website)
Proper Schema definitions with type derivation:
```typescript
export const SenatorSchema = Schema.Struct({ ... })
export type Senator = typeof SenatorSchema.Type
```

---

## Recommendations by Priority

### Immediate (Critical)
1. Fix cache implementation in distractions workspace
2. Replace `Date.now()`/`Math.random()` with Clock/Random services
3. Fix test that duplicates production code

### Short-term (High)
4. Convert generic `Error` to tagged errors in civics2json
5. Add discriminated union for game states in questionnaire
6. Add Schema validation for PairedAnswers in website

### Medium-term
7. Add `readonly` modifiers consistently
8. Namespace all service identifiers
9. Replace `console.log` with `Effect.log`
10. Add type declarations for external modules (sentence-similarity)

---

## Reference Documentation Used

### Local Project Standards
- `docs/effect-ts-guide.md` - Service patterns, DI, error handling
- `docs/type-design.md` - Discriminated unions, branded types
- `docs/typescript-patterns.md` - Type safety, avoiding `any`
- `docs/testing-guide.md` - Test layer patterns

### External References
- `_references/typescript/` - Effective TypeScript (type design, generics)
- `_references/effect/` - Effect-TS patterns (error handling, services, testing)
- `_references/design/` - SOLID principles, functional design

---

## Issue Counts by Category

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Effect Pattern | 1 | 2 | 6 | 3 |
| Type Safety | 0 | 5 | 2 | 2 |
| Error Handling | 0 | 2 | 1 | 1 |
| Testing | 2 | 0 | 2 | 0 |
| **Total** | **3** | **9** | **11** | **6** |
