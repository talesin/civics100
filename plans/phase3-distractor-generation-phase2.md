# Phase 3: Distractor Generation Phase 2 Completion

## Overview

This plan completes the remaining ~20% of Phase 2 for the distractor generation enhancement system. Phase 1 established the architecture; Phase 2 focuses on intelligent strategy selection, enhanced pool generation, and real quality metrics.

**Priority:** Medium
**Estimated Effort:** 2-4 hours
**Affected Workspace:** distractions

---

## Current State Assessment

### What's Already Implemented (80%)

| Component | Status | Notes |
|-----------|--------|-------|
| OpenAI API Integration | 95% | Full client, prompts, error handling |
| Rate Limiting | 100% | Effect RateLimiter with configurable RPM |
| Caching | 100% | Response cache with TTL and LRU eviction |
| Metrics Infrastructure | 100% | Counters, histograms, gauges defined |
| Retry Logic | 100% | Exponential backoff with error-type awareness |
| Error Handling | 100% | Tagged errors with severity classification |
| Quality Filtering | 100% | Multi-stage validation pipeline |
| Similarity Detection | 100% | Dual-metric scoring with thresholds |
| Batch Processing | 100% | Configurable concurrency |
| Configuration System | 100% | Environment-based with validation |

### What Needs Completion (20%)

| Component | Status | Effort |
|-----------|--------|--------|
| Intelligent Strategy Selection | 60% | 1-2 hours |
| Enhanced Static Pool Generation | 40% | 1 hour |
| Real Quality Metrics | 40% | 1-2 hours |
| Real-World Testing | 0% | 1 hour |

---

## Phase 2 Original Goals (from Phase 1 Plan)

From `distractor-generation-phase1-architecture.md`:

> **Next Steps (Phase 2 Preview)**
> After completing Phase 1, Phase 2 will focus on:
> - Implementing OpenAI API integration logic
> - Creating distractor generation strategies
> - Adding batch processing capabilities
> - Integrating metrics and observability

Most of these are now complete. The remaining work focuses on refinement.

---

## Task 1: Intelligent Strategy Selection

### Location

`packages/distractions/src/generators/EnhancedStaticGenerator.ts:154-160`

### Current State

Basic strategy selection exists but with TODO placeholders:

```typescript
// Lines 154-160 - TODOs
// TODO: Add question complexity analysis
// TODO: Add historical performance tracking
// TODO: Add cost optimization logic
// TODO: Implement quality-based fallback chains
```

**Current Selection Logic:**

```typescript
const selectStrategy = (question: Question): GenerationStrategy => {
  const answerType = question.answer._type

  if (answerType === 'text') {
    return openAIEnabled ? 'openai-text' : 'section-based'
  }

  if (['senator', 'representative', 'governor', 'capital'].includes(answerType)) {
    return 'static-pool'
  }

  return 'hybrid'
}
```

### Enhancement Requirements

**1. Question Complexity Analysis**

```typescript
interface QuestionComplexity {
  type: 'simple-fact' | 'conceptual' | 'analytical' | 'comparative'
  difficulty: 1 | 2 | 3 | 4 | 5
  cognitiveLevel: 'recall' | 'understand' | 'apply' | 'analyze'
}

const analyzeComplexity = (question: Question): QuestionComplexity => {
  // Analyze question text for complexity indicators
  const text = question.question.toLowerCase()

  // Simple facts: "What is...", "Who is...", "When did..."
  if (/^(what|who|when|where) (is|was|are|were)/.test(text)) {
    return { type: 'simple-fact', difficulty: 1, cognitiveLevel: 'recall' }
  }

  // Conceptual: "Why...", "How does...", "Explain..."
  if (/^(why|how does|explain)/.test(text)) {
    return { type: 'conceptual', difficulty: 3, cognitiveLevel: 'understand' }
  }

  // Comparative: "difference between", "compare", "contrast"
  if (/difference|compare|contrast|versus/.test(text)) {
    return { type: 'comparative', difficulty: 4, cognitiveLevel: 'analyze' }
  }

  return { type: 'analytical', difficulty: 2, cognitiveLevel: 'apply' }
}
```

**2. Cost Optimization Logic**

```typescript
interface CostEstimate {
  estimatedTokens: number
  estimatedCost: number  // USD
  shouldUseOpenAI: boolean
}

const estimateCost = (question: Question, strategy: GenerationStrategy): CostEstimate => {
  if (strategy !== 'openai-text') {
    return { estimatedTokens: 0, estimatedCost: 0, shouldUseOpenAI: false }
  }

  // Estimate based on question length + expected response
  const inputTokens = Math.ceil(question.question.length / 4)
  const outputTokens = 200  // Average response size

  // gpt-4o-mini pricing: $0.15/1M input, $0.60/1M output
  const cost = (inputTokens * 0.00000015) + (outputTokens * 0.0000006)

  return {
    estimatedTokens: inputTokens + outputTokens,
    estimatedCost: cost,
    shouldUseOpenAI: cost < 0.001  // Threshold: $0.001 per question
  }
}
```

**3. Quality-Based Fallback Chains**

```typescript
type FallbackChain = GenerationStrategy[]

const getFallbackChain = (question: Question): FallbackChain => {
  const complexity = analyzeComplexity(question)
  const answerType = question.answer._type

  // High-complexity conceptual questions
  if (complexity.type === 'conceptual' && complexity.difficulty >= 3) {
    return ['openai-text', 'section-based', 'hybrid']
  }

  // Structured data questions
  if (['senator', 'representative', 'governor'].includes(answerType)) {
    return ['static-pool', 'section-based']  // Never use OpenAI for these
  }

  // Default chain
  return ['openai-text', 'static-pool', 'section-based', 'hybrid']
}
```

### Implementation Steps

1. Add `QuestionComplexity` type to `src/types/index.ts`
2. Implement `analyzeComplexity()` in `EnhancedStaticGenerator.ts`
3. Add cost estimation logic
4. Implement fallback chain selection
5. Update `selectStrategy()` to use new analysis
6. Add metrics for strategy selection decisions

---

## Task 2: Enhanced Static Pool Generation

### Location

`packages/distractions/src/generators/EnhancedStaticGenerator.ts:191-199`

### Current State

Basic pool selection exists but with TODO placeholders:

```typescript
// Lines 191-199 - TODOs
// TODO: Smart pool selection based on context
// TODO: Regional relevance filtering
// TODO: Difficulty matching
// TODO: Thematic clustering
// TODO: Time period awareness
// TODO: Frequency balancing
```

### Enhancement Requirements

**1. Regional Relevance Filtering**

```typescript
const filterByRegion = (
  pool: string[],
  question: Question,
  correctAnswer: string
): string[] => {
  // For senator/representative questions, filter out same-state entries
  const statePattern = /\b([A-Z]{2})\b/  // Match state abbreviations
  const correctState = correctAnswer.match(statePattern)?.[1]

  if (!correctState) return pool

  // Remove entries from the same state (too obvious)
  // But keep some nearby states (plausible distractors)
  return pool.filter(entry => {
    const entryState = entry.match(statePattern)?.[1]
    return entryState !== correctState
  })
}
```

**2. Difficulty Matching**

```typescript
const matchDifficulty = (
  pool: string[],
  correctAnswer: string,
  targetDifficulty: number
): string[] => {
  // Sort pool by similarity to correct answer length/complexity
  const targetLength = correctAnswer.length

  return pool
    .map(entry => ({
      entry,
      lengthDiff: Math.abs(entry.length - targetLength),
      wordCountDiff: Math.abs(
        entry.split(' ').length - correctAnswer.split(' ').length
      )
    }))
    .sort((a, b) => {
      // Prefer similar length/complexity
      const aScore = a.lengthDiff + a.wordCountDiff * 2
      const bScore = b.lengthDiff + b.wordCountDiff * 2
      return aScore - bScore
    })
    .slice(0, pool.length * 0.7)  // Keep top 70%
    .map(item => item.entry)
}
```

**3. Time Period Awareness**

```typescript
interface TemporalContext {
  era: 'historical' | 'modern' | 'current'
  relevantYears?: [number, number]
}

const getTemporalContext = (question: Question): TemporalContext => {
  const text = question.question.toLowerCase()

  if (/founding|constitution|1700s|1800s|revolutionary/.test(text)) {
    return { era: 'historical', relevantYears: [1776, 1865] }
  }

  if (/current|today|now|president is/.test(text)) {
    return { era: 'current' }
  }

  return { era: 'modern', relevantYears: [1900, 2024] }
}

const filterByTimePeriod = (
  pool: string[],
  context: TemporalContext
): string[] => {
  // For president questions, only include presidents from relevant era
  // For current events, exclude historical figures
  // etc.
  return pool  // Implement based on pool type
}
```

**4. Frequency Balancing**

```typescript
// Track which distractors have been used across questions
const usageTracker = new Map<string, number>()

const balanceFrequency = (
  pool: string[],
  targetCount: number
): string[] => {
  // Prefer less-frequently-used distractors
  return pool
    .map(entry => ({
      entry,
      usageCount: usageTracker.get(entry) ?? 0
    }))
    .sort((a, b) => a.usageCount - b.usageCount)
    .slice(0, targetCount * 2)
    .map(item => item.entry)
}
```

### Implementation Steps

1. Add regional filtering to static pool selection
2. Implement difficulty matching algorithm
3. Add temporal context analysis
4. Implement frequency balancing with usage tracking
5. Integrate all filters into pool selection pipeline

---

## Task 3: Real Quality Metrics

### Location

`packages/distractions/src/generators/EnhancedStaticGenerator.ts:527-535`

### Current State

Quality metrics are hardcoded placeholders:

```typescript
// Lines 527-535 - Placeholder values
{
  relevanceScore: 0.8,        // Will be calculated from semantic analysis
  plausibilityScore: 0.7,     // Will be derived from context matching
  educationalValue: 0.8,      // Will be based on learning objective alignment
}
```

### Enhancement Requirements

**1. Semantic Relevance Score**

```typescript
const calculateRelevanceScore = (
  distractor: string,
  question: Question,
  correctAnswer: string
): Effect.Effect<number, never, SimilarityService> =>
  Effect.gen(function* () {
    const similarityService = yield* SimilarityService

    // Score based on semantic distance from correct answer
    // Too similar = bad (could be confused)
    // Too different = bad (obviously wrong)
    // Sweet spot = 0.3-0.6 similarity

    const similarity = yield* similarityService.calculateSimilarity(
      distractor,
      correctAnswer
    )

    // Optimal range: 0.3-0.6
    if (similarity >= 0.3 && similarity <= 0.6) {
      return 0.9  // Perfect range
    } else if (similarity < 0.3) {
      return 0.5 + (similarity / 0.3) * 0.3  // Too different
    } else {
      return 0.9 - ((similarity - 0.6) / 0.4) * 0.5  // Too similar
    }
  })
```

**2. Plausibility Score**

```typescript
const calculatePlausibilityScore = (
  distractor: string,
  question: Question,
  correctAnswer: string
): number => {
  let score = 0.5  // Base score

  // Same format as correct answer
  if (isNameFormat(distractor) === isNameFormat(correctAnswer)) {
    score += 0.2
  }

  // Similar length
  const lengthRatio = Math.min(distractor.length, correctAnswer.length) /
                      Math.max(distractor.length, correctAnswer.length)
  score += lengthRatio * 0.2

  // Contains expected category keywords
  const categoryKeywords = getCategoryKeywords(question)
  const hasKeywords = categoryKeywords.some(kw =>
    distractor.toLowerCase().includes(kw)
  )
  if (hasKeywords) score += 0.1

  return Math.min(1, score)
}
```

**3. Educational Value Score**

```typescript
const calculateEducationalValue = (
  distractor: string,
  question: Question
): number => {
  // Higher value if distractor teaches something when revealed as wrong

  let score = 0.5

  // Related to correct topic (teaches related content)
  const isRelated = isTopicallyRelated(distractor, question)
  if (isRelated) score += 0.3

  // Not a common misconception (or IS a common misconception = higher value)
  const isCommonMisconception = checkCommonMisconceptions(distractor, question)
  if (isCommonMisconception) score += 0.2  // Good to address misconceptions

  return score
}
```

### Implementation Steps

1. Implement `calculateRelevanceScore()` using SimilarityService
2. Implement `calculatePlausibilityScore()` with format/length analysis
3. Implement `calculateEducationalValue()` with topic analysis
4. Replace placeholder values with real calculations
5. Add metrics tracking for quality score distributions
6. Update tests to verify quality calculations

---

## Task 4: Real-World Testing

### Prerequisites

- OpenAI API key configured in `.env`
- Questions data loaded from civics2json

### Test Plan

**1. Single Question Test**

```bash
cd packages/distractions
OPENAI_API_KEY=your-key npx tsx src/cli/index.ts generate \
  --question-id 1 \
  --distractors 3 \
  --verbose
```

**2. Batch Test (10 questions)**

```bash
npx tsx src/cli/index.ts generate \
  --questions 10 \
  --distractors 3 \
  --batch-size 5
```

**3. Quality Validation**

- Review generated distractors manually
- Check semantic similarity scores
- Verify no obviously wrong answers
- Confirm format consistency with correct answers

**4. Performance Benchmarking**

```bash
# With metrics enabled
LOG_LEVEL=debug npx tsx src/cli/index.ts generate \
  --questions 50 \
  --distractors 3 \
  --metrics
```

Metrics to capture:

- Average response time per question
- Cache hit rate
- Rate limit utilization
- Quality score distributions
- OpenAI token usage and costs

---

## Configuration Reference

From `packages/distractions/src/config/environment.ts`:

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | required | OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | Model to use |
| `OPENAI_TEMPERATURE` | `0.7` | Generation temperature |
| `OPENAI_MAX_TOKENS` | `1000` | Max response tokens |
| `OPENAI_TIMEOUT_MS` | `30000` | Request timeout |
| `OPENAI_RATE_LIMIT_RPM` | `60` | Requests per minute |
| `OPENAI_CACHE_SIZE` | `1000` | Cache entry limit |
| `OPENAI_CACHE_TTL_HOURS` | `24` | Cache TTL |
| `NODE_ENV` | `development` | Environment |
| `LOG_LEVEL` | `info` | Logging verbosity |

---

## Implementation Order

1. **Strategy Selection Enhancements** (1-2 hours)
   - Question complexity analysis
   - Cost optimization
   - Fallback chains

2. **Pool Generation Enhancements** (1 hour)
   - Regional filtering
   - Difficulty matching
   - Frequency balancing

3. **Quality Metrics** (1-2 hours)
   - Real relevance scoring
   - Plausibility calculation
   - Educational value assessment

4. **Real-World Testing** (1 hour)
   - API integration validation
   - Performance benchmarking
   - Quality review

---

## Verification Checklist

- [ ] Strategy selection uses complexity analysis
- [ ] Cost estimation prevents excessive API usage
- [ ] Fallback chains work when primary strategy fails
- [ ] Regional filtering removes same-state distractors
- [ ] Difficulty matching produces similar-complexity options
- [ ] Quality scores are calculated (not placeholders)
- [ ] Real-world testing passes with OpenAI API
- [ ] Performance meets benchmarks (<2s per question)
- [ ] Cache hit rate improves with repeated questions
- [ ] All existing tests pass
- [ ] New functionality has test coverage

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `QuestionComplexity`, `CostEstimate` types |
| `src/generators/EnhancedStaticGenerator.ts` | Strategy selection, pool generation, quality metrics |
| `src/services/SimilarityService.ts` | May need new methods for quality scoring |
| `src/utils/metrics.ts` | Add strategy selection metrics |
| `test/generators/EnhancedStaticGenerator.test.ts` | Test new functionality |

---

## Success Criteria

From Phase 1 Architecture Plan:

> **Success Criteria**
> Phase 1 will be considered complete when:
> 1. All type definitions and utilities are implemented ✅
> 2. OpenAIDistractorService skeleton is functional ✅
> 3. Static data pools are populated ✅
> 4. Enhanced services follow Effect-TS patterns ✅
> 5. Basic tests are passing ✅
> 6. Configuration management is operational ✅

**Phase 2 Success Criteria:**

1. Strategy selection is intelligent (complexity-aware, cost-optimized)
2. Pool generation is context-aware (regional, difficulty, temporal)
3. Quality metrics are real calculations (not placeholders)
4. Real-world testing validates end-to-end functionality
5. Performance meets targets (<2s/question, >50% cache hit rate)
