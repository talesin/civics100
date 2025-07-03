# Fix StaticGenerator.ts Distractor Generation Plan

## Problem Analysis

The current StaticGenerator.ts implementation has several accuracy issues that prevent it from generating high-quality distractors:

### Current Issues

1. **Wrong Strategy**: Uses section-based approach instead of the planned static pool approach
   - Current: Pulls answers from other questions in the same section
   - Problem: Generates fragments like "sets up the government", "protects basic rights" instead of complete, plausible answers

2. **Poor Quality Distractors**: Generated distractors are often partial phrases from correct answers
   - Example: For "What is the supreme law of the land?" (answer: "the Constitution"), it generates distractors like "sets up the government", "protects basic rights"
   - These are not standalone plausible answers but fragments of other correct answers

3. **Missing Context Awareness**: Doesn't categorize questions by content type
   - No distinction between president questions, state questions, document questions, etc.
   - All questions treated uniformly regardless of content

4. **Unused Static Pools**: Rich static data pools are created but completely ignored
   - Pools contain high-quality distractors like presidents, senators, government branches, wars, etc.
   - Current implementation never uses these curated lists

### Root Cause Analysis

The implementation deviates from the original plan in PLAN.md which clearly states:
- "Static Distractor Pools: For questions where distractors can be drawn from a known, finite set of data"
- "Static Pools Created: branches-of-government.ts, geography.ts, government.ts, history.ts, etc."

Instead, the current code uses a naive section-based approach that doesn't leverage these carefully curated pools.

## Proposed Solution

### 1. Implement Question Classification System

Create a service that identifies question types based on content analysis:

```typescript
export class QuestionClassifierService extends Effect.Service<QuestionClassifierService>()('QuestionClassifierService', {
  effect: Effect.succeed({
    classifyQuestion: (question: Question) => {
      // Analyze question text and correct answers to determine type
      // Return: 'president' | 'state' | 'document' | 'government' | 'war' | 'senator' | etc.
    }
  })
})
```

**Question Type Categories:**
- **Presidents**: "Who was the first President?", "Name one President who..."
- **States**: "Name a state that borders...", "What is the capital of..."
- **Documents**: "What document...", "The Constitution..."
- **Government Branches**: "What are the three branches...", "What does the judicial branch..."
- **Wars**: "Name one war...", "What war..."
- **Senators**: Senator-related questions (already have dynamic data)
- **Representatives**: Representative-related questions (already have dynamic data)
- **Rights**: "What is freedom of...", "Name one right..."
- **Abstract/Conceptual**: Questions requiring section-based fallback

### 2. Create Pool Mapping Service

Map question types to appropriate static pools:

```typescript
export class PoolMappingService extends Effect.Service<PoolMappingService>()('PoolMappingService', {
  effect: Effect.succeed({
    getPoolsForQuestionType: (questionType: QuestionType) => {
      // Return array of pool names for each question type
      // e.g., 'president' -> ['presidents', 'vicePresidents']
    }
  })
})
```

**Pool Mapping Strategy:**
- **Presidents**: Use `history.ts` (usPresidents, usVicePresidents)
- **States**: Use `geography.ts` (states, territories)
- **Documents**: Use `rights-freedoms.ts` + conceptual terms
- **Government**: Use `government.ts` (cabinetLevels) + `branches-of-government.ts`
- **Wars**: Use `history.ts` (usWars)
- **Multi-Pool Strategy**: Some questions can draw from multiple pools

### 3. Replace Section-Based Logic with Pool-Based Logic

Completely refactor the generation algorithm:

**Current Flow:**
1. Filter questions by section
2. Extract answers from filtered questions
3. Remove correct answers
4. Apply similarity filtering

**New Flow:**
1. Classify question type
2. Get appropriate static pools
3. Combine pool data as distractor candidates
4. Apply enhanced quality filtering
5. Fall back to section-based for unclassified questions

### 4. Enhanced Quality Control

Improve the distractor selection algorithm:

```typescript
export class DistractorQualityService extends Effect.Service<DistractorQualityService>()('DistractorQualityService', {
  effect: Effect.gen(function* () {
    const similarityService = yield* SimilarityService
    
    return {
      filterQualityDistractors: (candidates: string[], correctAnswers: string[]) => {
        // 1. Remove exact matches
        // 2. Remove partial matches (improved similarity checking)
        // 3. Remove very short fragments (< 3 characters)
        // 4. Remove duplicates
        // 5. Ensure distractors are complete, standalone answers
        // 6. Apply semantic validation
      }
    }
  })
})
```

**Quality Filters:**
- **Length Filter**: Exclude very short fragments (< 3 characters)
- **Completeness Filter**: Ensure distractors are complete phrases/names
- **Semantic Validation**: Verify distractors are contextually appropriate
- **Duplicate Detection**: Remove duplicates across all pools
- **Enhanced Similarity**: Better algorithm to avoid partial matches

### 5. Implement Multi-Pool Strategy

Allow questions to draw from multiple relevant pools:

**Example: President Questions**
- Primary Pool: `usPresidents`
- Secondary Pool: `usVicePresidents`
- Tertiary Pool: Historical figures from other pools

**Pool Prioritization:**
- Use most relevant pool first
- Add diversity from secondary pools
- Maintain balance across different pool types

### 6. Add Fallback Strategy

Keep section-based approach for questions that don't fit static pools:

**Fallback Triggers:**
- Question type is 'abstract' or 'conceptual'
- No appropriate static pools available
- Static pools don't generate enough distractors
- Question is too unique/specific

**Improved Fallback:**
- Better similarity thresholds for section-based filtering
- Quality filters applied to section-based results
- Hybrid approach: combine pool-based + section-based results

## Implementation Steps

### Phase 1: Core Services
1. **Create QuestionClassifierService**: Implement question type detection
2. **Create PoolMappingService**: Map question types to static pools
3. **Create DistractorQualityService**: Implement enhanced quality filtering

### Phase 2: Generator Refactoring
4. **Refactor StaticGenerator.ts**: Replace section-based with pool-based logic
5. **Add Pool Integration**: Import and use all static pool data
6. **Implement Multi-Pool Logic**: Allow questions to use multiple pools

### Phase 3: Quality & Fallback
7. **Add Enhanced Quality Filters**: Implement all quality control measures
8. **Implement Fallback Strategy**: Keep section-based approach for edge cases
9. **Add Logging**: Improve debugging and monitoring

### Phase 4: Architecture Updates
10. **Update Service Architecture**: Follow Effect-TS patterns from style guide
11. **Add Comprehensive Testing**: Test all new services and logic
12. **Performance Optimization**: Optimize for large datasets

## Expected Outcomes

### Before (Current Issues)
```json
{
  "question": "What is the supreme law of the land?",
  "answers": { "choices": ["the Constitution"] },
  "distractors": [
    "sets up the government",
    "protects basic rights of Americans",
    "speech",
    "religion"
  ]
}
```

### After (Improved Quality)
```json
{
  "question": "What is the supreme law of the land?",
  "answers": { "choices": ["the Constitution"] },
  "distractors": [
    "the Bill of Rights",
    "the Declaration of Independence",
    "the Articles of Confederation",
    "the Federalist Papers"
  ]
}
```

## Success Metrics

1. **Relevance**: Distractors are contextually appropriate for each question type
2. **Completeness**: All distractors are complete, standalone answers
3. **Diversity**: Wide variety of distractors from appropriate pools
4. **Accuracy**: No partial matches or fragments from correct answers
5. **Coverage**: All question types properly classified and handled

## Architecture Alignment

This plan aligns with the original PLAN.md vision:
- Uses static pools as primary strategy (as originally intended)
- Implements AI-powered generation placeholder for future phases
- Maintains Effect-TS service architecture
- Preserves CLI and data processing pipeline structure
- Follows dependency injection patterns from style guide
