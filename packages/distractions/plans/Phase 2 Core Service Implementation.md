# Phase 2: Core Service Implementation Plan

## Overview

Phase 2 focuses on implementing the core functionality for the distractor generation system, replacing mock implementations with real OpenAI API integration and enhancing the generation pipeline with intelligent features.

## Current Status

✅ **Phase 1 Completed**: All architectural foundations are in place

- Type definitions, utility infrastructure, static data pools
- Service foundations with Effect-TS patterns
- Testing infrastructure with 72/72 tests passing
- Enhanced services with comprehensive TODO markers for Phase 2

## Implementation Tasks

### Task 1: OpenAI API Integration

**Priority: High** | **Dependencies: None**

1. **Replace mock OpenAI implementation** in `src/services/OpenAIDistractorService.ts`
   - Install and configure OpenAI client library
   - Replace `generateDistractorsWithOpenAI` mock response with real API calls
   - Implement proper JSON response parsing and validation

2. **Implement sophisticated prompt engineering**
   - Replace basic context generation in `createOpenAIRequest`
   - Create question-type-specific prompts (text, senator, representative, etc.)
   - Add examples of good/bad distractors for each question type
   - Include educational context about effective distractor characteristics

### Task 2: Effect-TS Utilities Integration  

**Priority: High** | **Dependencies: Task 1**

1. **Integrate RateLimiter with OpenAI service**
   - Apply rate limiting before OpenAI API calls
   - Handle rate limit errors with proper backoff

2. **Replace try/catch with Effect Schedule**
   - Remove basic try/catch in `EnhancedStaticGenerator`
   - Implement retry logic with exponential backoff for API failures
   - Add error-specific handling (auth, rate limits, network)

3. **Implement response caching**
   - Cache OpenAI responses to reduce API costs
   - Use semantic hashing for cache keys
   - Implement cache invalidation strategies

4. **Add metrics tracking**
   - Track API usage, success rates, response times
   - Monitor generation quality metrics
   - Implement performance dashboards

### Task 3: Enhanced Generation Logic

**Priority: Medium** | **Dependencies: Task 1**

1. **Implement intelligent strategy selection**
   - Replace basic strategy selection in `selectDistractorStrategy`
   - Add question complexity analysis
   - Implement historical performance tracking
   - Add cost optimization logic

2. **Enhance static pool generation**
   - Replace random selection with contextually-aware logic
   - Implement regional/temporal relevance filtering  
   - Add difficulty matching algorithms
   - Create thematic clustering for better distractors

3. **Calculate real quality metrics**
   - Replace placeholder scores with semantic similarity analysis
   - Implement difficulty assessment using readability metrics
   - Add educational value scoring based on learning objectives

### Task 4: Testing Enhancement

**Priority: Medium** | **Dependencies: Tasks 1-3**

1. **Add EnhancedStaticGenerator comprehensive tests**
   - Test new generation strategies with real data
   - Validate quality metrics calculations
   - Test error handling and fallback logic

2. **Create OpenAI integration tests**
   - Test actual API calls with proper key handling
   - Validate prompt engineering effectiveness
   - Test rate limiting and caching behavior

3. **Fix histogram metrics tests**
   - Resolve Effect library version issues with Metric.Boundaries
   - Re-enable currently skipped tests

## Success Criteria

- [ ] OpenAI API integration working with real responses
- [ ] Rate limiting and caching operational
- [ ] Enhanced quality metrics providing meaningful scores
- [ ] Intelligent strategy selection improving generation quality
- [ ] All tests passing (target: >80 total tests)
- [ ] Cost optimization reducing API usage by 30%+
- [ ] Generation quality improvement measurable through metrics

## Risk Mitigation

- **API Key Security**: Implement proper key validation and rotation
- **Cost Control**: Set usage limits and monitoring alerts
- **Quality Assurance**: Implement fallback to static generation if quality drops
- **Performance**: Cache aggressively and batch API calls where possible

## Deliverables

1. Fully functional OpenAI integration in `OpenAIDistractorService`
2. Enhanced `EnhancedStaticGenerator` with intelligent features
3. Comprehensive test suite covering all new functionality
4. Performance metrics dashboard and monitoring
5. Updated CLI integration supporting all new features
