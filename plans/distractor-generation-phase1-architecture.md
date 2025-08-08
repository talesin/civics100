# Distractor Generation Enhancement - Phase 1: Architecture Setup

## Overview
This plan outlines the implementation steps for Phase 1 of enhancing the distractor generation system in the civics100 monorepo. The goal is to establish the architectural foundation needed to integrate OpenAI-based distractor generation while maintaining the existing Effect-TS service patterns.

## Current State Analysis

### Existing Architecture
- **DistractorManager**: Main orchestration service using Effect-TS patterns
- **StaticGenerator**: Creates distractors from curated pools or section-based fallbacks
- **CuratedDistractorService**: Provides manually curated high-quality distractors
- **QuestionsDataService**: Loads questions from civics2json package
- **DistractorQualityService**: Already exists with filtering and validation logic
- **SimilarityService**: Already exists with similarity scoring functionality

### Key Observations
1. Services follow Effect-TS dependency injection patterns correctly
2. Test layers are already set up for most services
3. CLI integration point is properly structured with layer provision
4. Quality and Similarity services already exist but need enhancement
5. TypeScript config is strict and well-configured
6. Project uses ESM modules with proper Jest configuration

## Phase 1 Implementation Steps

### Step 1: Create Core Type Definitions
**Files to create:**
- `src/types/index.ts` - Core type definitions
- `src/types/errors.ts` - Error type definitions
- `src/types/config.ts` - Configuration interfaces

**Actions:**
1. Define configuration interfaces for:
   - DistractorGenerationOptions
   - QualityThresholds
   - OpenAIConfiguration
   - MetricsConfiguration
   - CacheConfiguration
2. Create comprehensive error types using Data.TaggedError
3. Add helper functions for error categorization

### Step 2: Set Up Utility Infrastructure
**Files to create:**
- `src/utils/metrics.ts` - Effect-TS metrics definitions
- `src/utils/context.ts` - FiberRef context utilities
- `src/utils/validation.ts` - Quality validation helpers
- `src/utils/rate-limiter.ts` - RateLimiter utilities
- `src/utils/cache.ts` - Cache utilities

**Actions:**
1. Implement RateLimiter for OpenAI API throttling
2. Set up FiberRef for request context tracking
3. Define metrics for observability
4. Create cache infrastructure for memoization
5. Add validation helpers for distractor quality

### Step 3: Create Static Data Pools
**Files to create:**
- `src/data/pools/representatives.ts`
- `src/data/pools/governors.ts`
- `src/data/pools/capitals.ts`
- `src/data/pools/presidents.ts`
- `src/data/pools/states.ts`

**Actions:**
1. Extract data from existing civics2json package
2. Format as TypeScript arrays similar to `senators.ts`
3. Ensure proper typing and exports

### Step 4: Implement OpenAI Service Foundation
**File to create:**
- `src/services/OpenAIDistractorService.ts`

**Actions:**
1. Create service skeleton following Effect-TS patterns
2. Implement configuration loading from environment
3. Add proper error handling for API failures
4. Set up currying pattern for dependency injection
5. Create test layer with mock implementations

### Step 5: Enhance Existing Services
**Files to modify:**
- `src/services/SimilarityService.ts`
- `src/services/DistractorQualityService.ts`

**Actions:**
1. Update SimilarityService to match DISTRACTOR-UPDATE.md spec
2. Add deduplication and batch processing methods
3. Enhance quality filtering with configurable thresholds
4. Ensure services follow coding guide patterns

### Step 6: Create Enhanced Generator
**File to create:**
- `src/generators/EnhancedStaticGenerator.ts`

**Actions:**
1. Extend StaticGenerator with OpenAI integration points
2. Implement question type routing logic
3. Add strategy selection based on answer._type
4. Create fallback chains for resilience

### Step 7: Update Configuration Management
**Files to create/modify:**
- `src/config.ts` - Main configuration loader
- Update `.env.example` with required variables

**Actions:**
1. Implement Config-based environment loading
2. Add validation for required variables
3. Create configuration factory functions
4. Document all configuration options

### Step 8: Set Up Testing Infrastructure
**Files to create:**
- `test/services/OpenAIDistractorService.test.ts`
- `test/utils/metrics.test.ts`
- `test/utils/cache.test.ts`

**Actions:**
1. Create unit tests for new services
2. Set up mock layers for testing
3. Add integration test scaffolding
4. Ensure tests follow Effect-TS testing patterns

## Dependencies and Prerequisites

### Required npm packages
- Already installed: effect, @effect/cli, @effect/platform, openai
- May need updates: sentence-similarity, similarity-score

### Environment Variables
- `OPENAI_API_KEY` - Required for OpenAI integration
- `NODE_ENV` - For environment-specific configuration
- `LOG_LEVEL` - For logging verbosity control

## Risk Mitigation

### Potential Issues
1. **OpenAI API Rate Limits**: Mitigated by RateLimiter implementation
2. **Service Integration Conflicts**: Mitigated by following existing patterns
3. **Type Safety**: Ensured by strict TypeScript configuration
4. **Testing Complexity**: Addressed by proper test layer setup

## Success Criteria

Phase 1 will be considered complete when:
1. All type definitions and utilities are implemented
2. OpenAIDistractorService skeleton is functional
3. Static data pools are populated
4. Enhanced services follow Effect-TS patterns
5. Basic tests are passing
6. Configuration management is operational

## Next Steps (Phase 2 Preview)

After completing Phase 1, Phase 2 will focus on:
- Implementing OpenAI API integration logic
- Creating distractor generation strategies
- Adding batch processing capabilities
- Integrating metrics and observability

## Implementation Order

1. **Day 1**: Type definitions and configuration (Steps 1-2)
2. **Day 2**: Static data pools and utilities (Step 3)
3. **Day 3**: OpenAI service foundation (Step 4)
4. **Day 4**: Service enhancements (Steps 5-6)
5. **Day 5**: Configuration and testing setup (Steps 7-8)

## Notes

- All implementations must follow the coding-style-guide.md
- Services use currying pattern for dependency injection
- Dependencies are provided at CLI execution point, not in service definitions
- Test layers should match actual service method signatures
- Prefer Effect.gen and Effect.fn over Effect.flatMap
- Use Effect patterns for error handling, not try/catch