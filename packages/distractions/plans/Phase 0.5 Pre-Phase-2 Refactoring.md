# Phase 0.5: Pre-Phase-2 Refactoring

## Overview
This refactoring phase prepares the codebase for Phase 2 (Core Service Implementation) by consolidating configuration, updating architecture, and ensuring all components are properly wired together.

## Implementation Checklist

### 1. Consolidate Configuration ✅ COMPLETED
**Goal**: Remove duplicate Config definitions and establish single source of truth

- [x] Add missing configs to `environment.ts`
  - [x] `openaiTemperatureConfig`
  - [x] `openaiMaxTokensConfig`
  - [x] `openaiCacheSizeConfig`
  - [x] `openaiCacheTTLHoursConfig`
- [x] Update model default to `gpt-5-mini`
- [x] Update `environmentConfig` to include all new fields
- [x] Remove duplicate configs from `config.ts`
  - [x] Import `openaiTemperatureConfig` from environment
  - [x] Import `openaiMaxTokensConfig` from environment
- [x] Remove duplicate configs from `OpenAIDistractorService.ts`
  - [x] Remove all 8 local Config definitions
  - [x] Add imports from `@src/config/environment`
  - [x] Update all usages to use imported configs
- [x] Run tests to verify changes
  - Result: ✅ All 72 tests passing

**Time Estimate**: 1-2 hours
**Actual Time**: ~30 minutes
**Status**: ✅ COMPLETED

---

### 2. Update DistractorManager ✅ COMPLETED
**Goal**: Switch from basic StaticGenerator to EnhancedStaticGenerator

- [x] Update `DistractorManager.ts`
  - [x] Change import from `StaticGenerator` to `EnhancedStaticGenerator`
  - [x] Update service dependency to use `EnhancedStaticGenerator`
  - [x] Update type references
  - [x] Add `DistractorGenerationOptions` parameter support
  - [x] Update `generateAndWrite` to call `generateEnhanced`
  - [x] Update test layer signature
- [x] Update `DistractorManager` test
  - [x] Update test imports
  - [x] Update test layer dependencies (use `TestEnhancedStaticGeneratorLayer`)
  - [x] Update mock function name to `mockGenerateEnhanced`
  - [x] Pass `DEFAULT_GENERATION_OPTIONS` to `generateAndWrite`
  - [x] Verify test still passes
- [x] Run integration tests
  - [x] Verify end-to-end generation works
  - Result: ✅ All 72 tests passing

**Time Estimate**: 30 minutes
**Actual Time**: ~15 minutes
**Status**: ✅ COMPLETED

---

### 3. Enhance CLI with Service Layers and Configuration 🔲 TODO
**Goal**: Wire up all required services and add configuration loading to CLI

#### 3.1 Add Missing Service Layers
- [ ] Update `cli/index.ts` service providers
  - [ ] Add `EnhancedStaticGenerator.Default` layer
  - [ ] Add `OpenAIDistractorService.Default` layer
  - [ ] Add `DistractorQualityService.Default` layer
  - [ ] Add `SimilarityService.Default` layer
  - [ ] Ensure correct dependency order

#### 3.2 Add Configuration Loading
- [ ] Add configuration validation on CLI startup
  - [ ] Import `createValidatedConfiguration` from config
  - [ ] Call validation before running DistractorManager
  - [ ] Handle configuration errors gracefully
- [ ] Add environment variable checks
  - [ ] Check for OPENAI_API_KEY presence
  - [ ] Provide helpful error messages if missing

#### 3.3 Add CLI Command Options
- [ ] Define command options structure
  - [ ] `--regen-all` (boolean) - Regenerate all distractors
  - [ ] `--regen-incomplete` (boolean) - Only regenerate incomplete
  - [ ] `--target-count` (integer) - Number of distractors per question
  - [ ] `--use-openai` (boolean) - Enable OpenAI generation
  - [ ] `--filter-similar` (boolean) - Apply similarity filtering
- [ ] Wire options to DistractorGenerationOptions
  - [ ] Map CLI options to config object
  - [ ] Pass options to DistractorManager
- [ ] Add help text and descriptions
  - [ ] Document each option
  - [ ] Provide usage examples

#### 3.4 Testing
- [ ] Test CLI with various option combinations
- [ ] Verify service layers are properly provided
- [ ] Test configuration validation
- [ ] Test error handling for missing API key

**Time Estimate**: 2-3 hours
**Actual Time**: TBD
**Status**: 🔲 TODO

---

### 4. Clarify Generator Roles 🔲 TODO
**Goal**: Document and clarify the distinction between generators

#### 4.1 Code Documentation
- [ ] Add comprehensive JSDoc to `StaticGenerator.ts`
  - [ ] Document purpose: basic pool-based generation
  - [ ] Document use case: testing, fallback
  - [ ] Mark as deprecated or internal-only (TBD)
- [ ] Add comprehensive JSDoc to `EnhancedStaticGenerator.ts`
  - [ ] Document purpose: production-ready with OpenAI
  - [ ] Document features: quality filtering, similarity, caching
  - [ ] Document recommended usage

#### 4.2 Update Documentation Files
- [ ] Update `PLAN.md`
  - [ ] Document generator hierarchy
  - [ ] Update task list to reflect current state
- [ ] Update `README.md` (if exists in distractions package)
  - [ ] Document CLI usage with new options
  - [ ] Document environment variables
- [ ] Update `CLAUDE.md` (project root)
  - [ ] Update distractions package description
  - [ ] Document new CLI options

#### 4.3 Consider Deprecation Strategy
- [ ] Decide on StaticGenerator fate
  - Option A: Keep as internal utility for tests
  - Option B: Deprecate and migrate all usage
  - Option C: Keep as `--mode=basic` CLI option
- [ ] Implement chosen strategy
- [ ] Update tests accordingly

**Time Estimate**: 1 hour
**Actual Time**: TBD
**Status**: 🔲 TODO

---

### 5. Integration Testing 🔲 TODO
**Goal**: Verify all refactored components work together end-to-end

#### 5.1 Unit Test Updates
- [ ] Run all existing tests
  - [ ] Fix any broken tests from refactoring
  - [ ] Update test expectations if needed
- [ ] Add new tests for CLI options
- [ ] Add tests for configuration validation

#### 5.2 Integration Testing
- [ ] Test full generation pipeline
  - [ ] Run CLI with default options
  - [ ] Run CLI with custom options
  - [ ] Verify output file quality
- [ ] Test with OpenAI disabled (test mode)
  - [ ] Verify fallback to static generation
  - [ ] Verify no API calls made
- [ ] Test error scenarios
  - [ ] Missing OPENAI_API_KEY
  - [ ] Invalid configuration values
  - [ ] Network errors (if possible to simulate)

#### 5.3 Manual Testing
- [ ] Run generation on full civics questions dataset
- [ ] Inspect output for quality
- [ ] Verify distractors meet quality thresholds
- [ ] Check performance and timing

**Time Estimate**: 1 hour
**Actual Time**: TBD
**Status**: 🔲 TODO

---

## Summary of Changes

### Files Modified
1. ✅ `src/config/environment.ts` - Added missing configs, updated model default
2. ✅ `src/config.ts` - Removed duplicates, imported from environment
3. ✅ `src/services/OpenAIDistractorService.ts` - Removed all duplicate configs, updated imports
4. ⏳ `src/services/DistractorManager.ts` - Switch to EnhancedStaticGenerator
5. 🔲 `src/cli/index.ts` - Add service layers, options, configuration
6. 🔲 `test/services/DistractorManager.test.ts` - Update for new generator
7. 🔲 `PLAN.md` - Update documentation
8. 🔲 `README.md` - Document new features

### Tests Status
- Current: ✅ 72/72 tests passing
- Target: All tests passing after each phase

---

## Benefits of This Refactoring

✅ **Clean foundation** for Phase 2 OpenAI work
✅ **No confusion** about which generator/config to use
✅ **Testable** - proper service layers make testing easier
✅ **User-friendly** - CLI options exposed for all configuration
✅ **Maintainable** - no duplicate code or competing patterns

---

## Next Steps After Phase 0.5

Once this refactoring is complete, we'll be ready to begin **Phase 2: Core Service Implementation**, which includes:
- Real OpenAI API integration
- Sophisticated prompt engineering
- Effect-TS utilities integration (rate limiting, caching, retries)
- Enhanced generation logic with intelligent strategy selection
- Comprehensive testing

---

## Notes and Decisions

### Decision Log
- **2025-10-24**: Updated default OpenAI model to `gpt-5-mini` (latest as of Aug 2025)
- **2025-10-24**: Consolidated all OpenAI config to `environment.ts` as single source of truth
- **2025-10-24**: Decided to use `EnhancedStaticGenerator` as default in DistractorManager

### Issues Encountered
- None yet

### Questions for Review
- Should we deprecate `StaticGenerator` or keep it for basic testing?
- Should we add a `--mode` flag to CLI to choose between generators?
