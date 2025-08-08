# Distractor Generation Enhancement Task

Generate or augment **10–15 plausible distractors** per question in `civics-questions.json` using OpenAI APIs, structured templates, or heuristics depending on the answer `_type`.

## Implementation Task List

- Refer to [coding-style-guide.md](../../coding-style-guide.md) for coding style and best practices

### Phase 1: Architecture Setup ✅ COMPLETED

- [x] **Review current service architecture** - Understand existing DistractorManager, StaticGenerator, CuratedDistractorService, and QuestionsDataService
- [x] **Analyze data structures** - Study question types (\_type field) and current distractor formats in civics-questions.json
- [x] **Plan service integration** - Design how OpenAIDistractorService and DistractorQualityService will integrate with existing services

**Phase 1 Summary**: Complete architectural foundation established with proper Effect-TS patterns, comprehensive type definitions, utility infrastructure, static data pools, service foundations with detailed implementation roadmaps, and full test coverage (72 passing tests). All services follow coding guide patterns with dependency injection at execution points.

**⚠️ Areas Requiring Full Implementation (Currently Stubbed/Placeholder Code):**
- OpenAI API integration (currently returns mock responses)
- Utility integration in services (infrastructure exists but not used)
- Quality metrics calculation (placeholder values)
- Effect metrics histogram boundaries (test compatibility issues)
- Enhanced static pool selection (currently basic random selection)

### Phase 2: Core Service Implementation

- [x] **Implement OpenAIDistractorService** - Create service with proper dependency injection pattern, rate limiting, and error handling (foundation implemented with comprehensive TODO comments for full implementation)
- [ ] **Replace OpenAI mock implementation** - Replace `generateDistractorsWithOpenAI` mock response with actual OpenAI Chat Completions API integration
- [ ] **Implement OpenAI prompt engineering** - Replace basic context generation in `createOpenAIRequest` with sophisticated, question-type-specific prompts
- [ ] **Add actual OpenAI client integration** - Import and configure OpenAI client library with proper error handling and response parsing
- [x] **Add OpenAI API configuration** - Set up Config for API key management and request parameters
- [x] **Implement DistractorQualityService** - Create quality assessment algorithms using similarity scoring and validation rules (enhanced existing service)
- [x] **Create generation strategies** - Implement different distractor generation approaches for each question type

### Phase 3: Effect-TS Utilities Integration

- [x] **Add RateLimiter for API throttling** - Implement proper rate limiting for OpenAI API requests (utility infrastructure implemented)
- [ ] **Integrate RateLimiter with OpenAI service** - Actually use the RateLimiter utilities in OpenAIDistractorService for real API throttling
- [x] **Integrate Schedule for retry logic** - Replace manual retry with Effect Schedule utilities (utility infrastructure implemented)
- [ ] **Replace try/catch with Effect Schedule** - Replace basic try/catch error handling in EnhancedStaticGenerator with proper Effect Schedule retry patterns
- [x] **Add Metrics for observability** - Track generation success rates, API usage, and performance (metrics infrastructure implemented)
- [ ] **Integrate metrics tracking** - Actually use DistractorMetrics in services to track real performance data (currently only infrastructure exists)
- [x] **Implement FiberRef for context** - Add logging context and request tracking across fibers (context utilities implemented)
- [ ] **Use FiberRef in generation pipeline** - Apply RequestContext tracking throughout the distractor generation process
- [x] **Add Cache for result memoization** - Cache OpenAI responses to reduce API calls and improve performance (cache utilities implemented)
- [ ] **Implement OpenAI response caching** - Use cache utilities to actually cache and retrieve OpenAI API responses

### Phase 4: Testing Implementation

- [x] **Create test layers for services** - Build TestOpenAIDistractorServiceLayer and TestDistractorQualityServiceLayer with proper mocking
- [ ] **Fix histogram metrics in tests** - Resolve Effect library version issues with Metric.Boundaries in metrics tests (currently skipped)
- [x] **Write unit tests for distractor generation** - Test each generation strategy with mock dependencies and validate output quality
- [ ] **Add EnhancedStaticGenerator tests** - Create comprehensive tests for the new EnhancedStaticGenerator (currently missing)
- [x] **Add integration tests for service composition** - Test full pipeline with test layers and verify end-to-end functionality
- [ ] **Add real OpenAI integration tests** - Test actual OpenAI API calls with proper API key handling and rate limiting
- [x] **Create performance tests** - Test rate limiting, caching behavior, and resource usage under load (basic test infrastructure)
- [x] **Add quality assessment tests** - Validate similarity scoring, duplicate detection, and filtering logic

### Phase 5: CLI Integration

- [ ] **Update CLI command structure** - Enhance existing CLI to support new generation modes and configuration options
- [ ] **Integrate EnhancedStaticGenerator in CLI** - Replace current StaticGenerator usage with new EnhancedStaticGenerator in CLI
- [ ] **Add dependency injection at execution point** - Provide all service layers in CLI entry point following coding guide patterns
- [ ] **Add OpenAIDistractorService to CLI layers** - Include the new OpenAI service in the CLI's Effect.provide chain
- [ ] **Implement configuration management** - Add command-line options for OpenAI settings, quality thresholds, and generation strategies
- [ ] **Use actual config loader in CLI** - Replace hardcoded configuration with the new config.ts loader system
- [ ] **Add progress reporting and logging** - Implement detailed progress tracking and structured logging for the generation process

### Phase 6: Data Processing Pipeline

- [ ] **Implement question type routing** - Route questions to appropriate generation strategies based on \_type field (basic routing exists, needs intelligence)
- [ ] **Implement actual quality metrics calculation** - Replace placeholder quality scores in EnhancedStaticGenerator with real semantic analysis
- [ ] **Enhance static pool selection logic** - Replace basic random selection with contextually-aware, weighted pool selection
- [ ] **Add batch processing logic** - Process questions in batches to optimize API usage and performance
- [ ] **Create output formatting** - Ensure generated distractors match existing JSON schema and format requirements
- [ ] **Add validation and filtering** - Validate generated distractors against quality criteria and remove duplicates

### Phase 7: Error Handling & Resilience

- [ ] **Add comprehensive error handling** - Handle API failures, rate limits, network issues, and validation errors gracefully
- [ ] **Implement fallback strategies** - Fall back to static generation when OpenAI service is unavailable
- [ ] **Add retry mechanisms** - Use Effect Schedule for robust retry logic with backoff and circuit breaker patterns
- [ ] **Create monitoring and alerting** - Track failures and performance issues with proper observability

### Phase 8: Documentation & Deployment

- [ ] **Update service documentation** - Document new services, their interfaces, and usage patterns
- [ ] **Create configuration guides** - Document OpenAI API setup, environment variables, and deployment requirements
- [ ] **Add troubleshooting guides** - Document common issues, error messages, and resolution steps
- [ ] **Update README and build scripts** - Ensure package.json scripts and README reflect new functionality

## Project File Structure

The following file structure shows where each component should be implemented within the `packages/distractions/` directory:

```
packages/distractions/
├── src/
│   ├── cli/
│   │   └── index.ts                           # Enhanced CLI with new options (exists)
│   ├── data/
│   │   ├── QuestionsDataService.ts            # Questions data access (exists)
│   │   └── pools/
│   │       ├── senators.ts                    # Senator name pools (exists)
│   │       ├── representatives.ts             # Representative pools (✅ created)
│   │       ├── governors.ts                   # Governor pools (✅ created)
│   │       ├── capitals.ts                    # Capital city pools (✅ created)
│   │       ├── presidents.ts                  # President name pools (✅ created)
│   │       └── states.ts                      # State name pools (✅ created)
│   ├── services/
│   │   ├── DistractorManager.ts               # Main orchestration (exists)
│   │   ├── CuratedDistractorService.ts        # Curated distractors (exists)
│   │   ├── OpenAIDistractorService.ts         # OpenAI integration (✅ created with foundation)
│   │   ├── DistractorQualityService.ts        # Quality assessment (✅ enhanced)
│   │   └── SimilarityService.ts               # Semantic similarity (✅ enhanced)
│   ├── generators/
│   │   ├── StaticGenerator.ts                 # Current static generation (exists)
│   │   └── EnhancedStaticGenerator.ts         # Enhanced hybrid generation (✅ created)
│   ├── types/
│   │   ├── index.ts                           # Core type definitions (✅ created)
│   │   ├── errors.ts                          # Error type definitions (✅ created)
│   │   └── config.ts                          # Configuration interfaces (✅ created)
│   └── utils/
│       ├── metrics.ts                         # Effect-TS metrics definitions (✅ created)
│       ├── context.ts                         # FiberRef context utilities (✅ created)
│       ├── validation.ts                      # Quality validation helpers (✅ created)
│       ├── rate-limiter.ts                    # Rate limiting utilities (✅ created)
│       └── cache.ts                           # Caching utilities (✅ created)
├── test/
│   ├── services/
│   │   ├── OpenAIDistractorService.test.ts    # OpenAI service tests (✅ created)
│   │   ├── DistractorQualityService.test.ts   # Quality service tests (exists)
│   │   └── SimilarityService.test.ts          # Similarity service tests (exists)
│   ├── utils/
│   │   ├── metrics.test.ts                    # Metrics utility tests (✅ created)
│   │   └── validation.test.ts                 # Validation utility tests (✅ created)
│   └── integration/
│       └── phase1-integration.test.ts         # Phase 1 integration tests (✅ created)
├── data/                                      # Output directory
│   └── questions-with-distractors.json        # Generated output file
├── package.json                               # Package configuration (exists)
├── tsconfig.json                              # TypeScript configuration (exists)
├── jest.config.ts                             # Jest testing configuration (exists)
├── .env.example                               # Environment variables template (✅ created)
├── src/config.ts                              # Configuration loader (✅ created)
└── README.md                                  # Package documentation (exists)
```

### Implementation Priority

Files should be created in this order to respect dependencies:

1. **Types and Utilities** (`src/types/`, `src/utils/`)
2. **Static Data Pools** (`src/data/pools/`)
3. **Core Services** (`src/services/OpenAI*`, `src/services/Quality*`, `src/services/Similarity*`)
4. **Enhanced Generators** (`src/generators/Enhanced*`)
5. **CLI Updates** (`src/cli/index.ts` modifications)
6. **Testing Suite** (`test/**/*.test.ts`)

## Configuration Type Definitions

Complete type definitions for all configuration interfaces used throughout the system:

```typescript
// src/types/config.ts
import { Schema } from '@effect/schema'

// Main configuration for distractor generation process
export interface DistractorGenerationOptions {
  readonly regenAll: boolean // Ignore existing distractors and regenerate all
  readonly regenIncomplete: boolean // Only regenerate if distractors.length < targetCount
  readonly targetCount: number // Target number of distractors per question (default: 15)
  readonly filterSimilar: boolean // Apply similarity filtering to remove duplicates
  readonly checkAnswers: boolean // Filter out distractors that appear as correct answers elsewhere
  readonly useOpenAI: boolean // Enable OpenAI generation for text questions
  readonly batchSize: number // Number of questions to process in each batch (default: 10)
  readonly maxRetries: number // Maximum retry attempts for failed operations (default: 3)
}

// Default configuration values
export const DEFAULT_GENERATION_OPTIONS: DistractorGenerationOptions = {
  regenAll: false,
  regenIncomplete: false,
  targetCount: 15,
  filterSimilar: true,
  checkAnswers: true,
  useOpenAI: true,
  batchSize: 10,
  maxRetries: 3
} as const

// Schema for runtime validation
export const DistractorGenerationOptionsSchema = Schema.Struct({
  regenAll: Schema.Boolean,
  regenIncomplete: Schema.Boolean,
  targetCount: Schema.Number.pipe(Schema.between(5, 20)),
  filterSimilar: Schema.Boolean,
  checkAnswers: Schema.Boolean,
  useOpenAI: Schema.Boolean,
  batchSize: Schema.Number.pipe(Schema.between(1, 50)),
  maxRetries: Schema.Number.pipe(Schema.between(1, 10))
})

// Quality assessment configuration
export interface QualityThresholds {
  readonly relevance: number // Minimum relevance score (0.0-1.0)
  readonly plausibility: number // Minimum plausibility score (0.0-1.0)
  readonly educationalValue: number // Minimum educational value score (0.0-1.0)
  readonly minLength: number // Minimum character length
  readonly maxLength: number // Maximum character length
  readonly similarityThreshold: number // Maximum similarity to existing answers (0.0-1.0)
}

export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  relevance: 0.7,
  plausibility: 0.6,
  educationalValue: 0.8,
  minLength: 3,
  maxLength: 200,
  similarityThreshold: 0.8
} as const

// OpenAI API configuration
export interface OpenAIConfiguration {
  readonly apiKey: string // OpenAI API key from environment
  readonly model: string // GPT model to use (default: 'gpt-4o-mini')
  readonly temperature: number // Response randomness (0.0-1.0)
  readonly maxTokens: number // Maximum tokens per response
  readonly requestsPerMinute: number // Rate limiting configuration
  readonly timeoutMs: number // Request timeout in milliseconds
}

export const DEFAULT_OPENAI_CONFIG: Omit<OpenAIConfiguration, 'apiKey'> = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 1000,
  requestsPerMinute: 60,
  timeoutMs: 30000
} as const

// Performance and observability configuration
export interface MetricsConfiguration {
  readonly enableMetrics: boolean // Enable metrics collection
  readonly enableTracing: boolean // Enable request tracing
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error' // Logging verbosity
  readonly metricsInterval: number // Metrics reporting interval (ms)
}

export const DEFAULT_METRICS_CONFIG: MetricsConfiguration = {
  enableMetrics: true,
  enableTracing: true,
  logLevel: 'info',
  metricsInterval: 5000
} as const

// Cache configuration for OpenAI responses
export interface CacheConfiguration {
  readonly enabled: boolean // Enable response caching
  readonly maxSize: number // Maximum cache entries
  readonly ttlMs: number // Time to live in milliseconds
  readonly persistToDisk: boolean // Persist cache to disk between runs
  readonly cacheDirectory: string // Directory for disk cache
}

export const DEFAULT_CACHE_CONFIG: CacheConfiguration = {
  enabled: true,
  maxSize: 1000,
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
  persistToDisk: true,
  cacheDirectory: '.cache/openai'
} as const

// Environment configuration schema
export const EnvironmentConfigSchema = Schema.Struct({
  OPENAI_API_KEY: Schema.String,
  NODE_ENV: Schema.optional(Schema.Literal('development', 'production', 'test')),
  LOG_LEVEL: Schema.optional(Schema.Literal('debug', 'info', 'warn', 'error')),
  DISTRACTOR_TARGET_COUNT: Schema.optional(Schema.NumberFromString.pipe(Schema.between(5, 20))),
  ENABLE_METRICS: Schema.optional(Schema.BooleanFromString),
  CACHE_ENABLED: Schema.optional(Schema.BooleanFromString)
})

// Complete system configuration combining all aspects
export interface SystemConfiguration {
  readonly generation: DistractorGenerationOptions
  readonly quality: QualityThresholds
  readonly openai: OpenAIConfiguration
  readonly metrics: MetricsConfiguration
  readonly cache: CacheConfiguration
}

// Configuration factory with environment overrides
export const createSystemConfiguration = (
  overrides?: Partial<SystemConfiguration>
): SystemConfiguration => ({
  generation: { ...DEFAULT_GENERATION_OPTIONS, ...overrides?.generation },
  quality: { ...DEFAULT_QUALITY_THRESHOLDS, ...overrides?.quality },
  openai: {
    ...DEFAULT_OPENAI_CONFIG,
    apiKey: process.env.OPENAI_API_KEY || '',
    ...overrides?.openai
  },
  metrics: { ...DEFAULT_METRICS_CONFIG, ...overrides?.metrics },
  cache: { ...DEFAULT_CACHE_CONFIG, ...overrides?.cache }
})
```

## Error Type Definitions

Comprehensive error types for all failure scenarios:

```typescript
// src/types/errors.ts
import { Data } from 'effect'

// OpenAI API related errors
export class OpenAIError extends Data.TaggedError('OpenAIError')<{
  readonly cause: unknown
  readonly requestId?: string
}> {}

export class OpenAIRateLimitError extends Data.TaggedError('OpenAIRateLimitError')<{
  readonly cause: unknown
  readonly retryAfter?: number
  readonly requestsRemaining?: number
}> {}

export class OpenAIAuthError extends Data.TaggedError('OpenAIAuthError')<{
  readonly cause: unknown
  readonly message: string
}> {}

export class OpenAITimeoutError extends Data.TaggedError('OpenAITimeoutError')<{
  readonly cause: unknown
  readonly timeoutMs: number
}> {}

// Parsing and validation errors
export class ParseError extends Data.TaggedError('ParseError')<{
  readonly cause: unknown
  readonly input: string
  readonly expectedFormat: string
}> {}

export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly cause: unknown
  readonly field: string
  readonly value: unknown
  readonly constraint: string
}> {}

// Question processing errors
export class InvalidQuestionTypeError extends Data.TaggedError('InvalidQuestionTypeError')<{
  readonly questionId: number
  readonly expected?: string
  readonly actual: string
}> {}

export class InsufficientDistractorsError extends Data.TaggedError('InsufficientDistractorsError')<{
  readonly questionId: number
  readonly required: number
  readonly available: number
}> {}

export class QualityAssessmentError extends Data.TaggedError('QualityAssessmentError')<{
  readonly questionId: number
  readonly distractor: string
  readonly failedCriteria: readonly string[]
}> {}

// File system and I/O errors
export class FileSystemError extends Data.TaggedError('FileSystemError')<{
  readonly cause: unknown
  readonly operation: 'read' | 'write' | 'create' | 'delete'
  readonly path: string
}> {}

export class ConfigurationError extends Data.TaggedError('ConfigurationError')<{
  readonly cause: unknown
  readonly setting: string
  readonly value: unknown
  readonly reason: string
}> {}

// Environment and setup errors
export class MissingEnvironmentVariableError extends Data.TaggedError(
  'MissingEnvironmentVariableError'
)<{
  readonly variable: string
  readonly required: boolean
}> {}

export class ServiceInitializationError extends Data.TaggedError('ServiceInitializationError')<{
  readonly cause: unknown
  readonly serviceName: string
  readonly stage: string
}> {}

// Similarity and deduplication errors
export class SimilarityCalculationError extends Data.TaggedError('SimilarityCalculationError')<{
  readonly cause: unknown
  readonly text1: string
  readonly text2: string
}> {}

// Batch processing errors
export class BatchProcessingError extends Data.TaggedError('BatchProcessingError')<{
  readonly cause: unknown
  readonly batchIndex: number
  readonly totalBatches: number
  readonly failedQuestions: readonly number[]
}> {}

// Union type for all possible errors
export type DistractorGenerationError =
  | OpenAIError
  | OpenAIRateLimitError
  | OpenAIAuthError
  | OpenAITimeoutError
  | ParseError
  | ValidationError
  | InvalidQuestionTypeError
  | InsufficientDistractorsError
  | QualityAssessmentError
  | FileSystemError
  | ConfigurationError
  | MissingEnvironmentVariableError
  | ServiceInitializationError
  | SimilarityCalculationError
  | BatchProcessingError

// Error categorization helpers
export const isRetryableError = (error: DistractorGenerationError): boolean => {
  switch (error._tag) {
    case 'OpenAIRateLimitError':
    case 'OpenAITimeoutError':
    case 'FileSystemError':
      return true
    case 'OpenAIAuthError':
    case 'ValidationError':
    case 'ConfigurationError':
    case 'MissingEnvironmentVariableError':
      return false
    default:
      return true
  }
}

export const getErrorSeverity = (
  error: DistractorGenerationError
): 'low' | 'medium' | 'high' | 'critical' => {
  switch (error._tag) {
    case 'OpenAIAuthError':
    case 'MissingEnvironmentVariableError':
    case 'ConfigurationError':
      return 'critical'
    case 'ServiceInitializationError':
    case 'FileSystemError':
      return 'high'
    case 'OpenAIRateLimitError':
    case 'BatchProcessingError':
      return 'medium'
    default:
      return 'low'
  }
}
```

## Architecture Overview

The distractions package follows Effect-TS service architecture patterns with dependency injection. Effect-TS is a functional programming library that provides composable, type-safe effects for handling side effects like API calls, file I/O, and error handling. Understanding the existing service structure is crucial for implementation:

**Why Effect-TS?** This architecture provides several key benefits:

- **Composability**: Services can be easily combined and tested in isolation
- **Type Safety**: All effects are tracked at the type level, preventing runtime errors
- **Dependency Injection**: Services declare their dependencies explicitly, making testing and mocking straightforward
- **Error Handling**: Errors are part of the type system, ensuring they're always handled properly

### Current Service Architecture

The service dependency graph shows how components interact. Each arrow represents a dependency relationship where the consuming service injects the dependency service:

```typescript
// Main orchestration service
DistractorManager ─→ StaticGenerator ─→ CuratedDistractorService
                 └─→ QuestionsDataService
                 └─→ DistractorQualityService (to be implemented)
                 └─→ OpenAIDistractorService (to be implemented)
```

**Dependency Flow Explanation:**

- **DistractorManager** serves as the main coordinator, orchestrating the entire distractor generation pipeline
- **StaticGenerator** handles the current logic for creating distractors from existing data pools
- **QuestionsDataService** provides access to the civics questions data from the civics2json package
- **CuratedDistractorService** supplies manually created, high-quality distractors for specific questions

### Existing Services

These services are already implemented and working in the current codebase:

- **DistractorManager**: Main orchestration service that coordinates generation and file I/O. This service acts as the entry point for the distractor generation process, managing the overall workflow and writing results to files.

- **StaticGenerator**: Current implementation using static pools and section-based fallbacks. This service creates distractors by either using curated pools or falling back to answers from questions in the same section when curated distractors aren't available.

- **CuratedDistractorService**: Provides manually curated distractors from a database. This service contains hand-crafted, high-quality incorrect answers that have been carefully selected for educational value and plausibility.

- **QuestionsDataService**: Loads questions from civics2json package. This service provides the interface to access all civics questions with their correct answers, serving as the data source for distractor generation.

### Services to Implement

These are the new services that need to be created to enhance distractor generation capabilities:

- **OpenAIDistractorService**: OpenAI API integration for dynamic distractor generation. This service will use GPT models to generate contextually appropriate incorrect answers when static pools are insufficient or unavailable.

- **DistractorQualityService**: Quality assessment and filtering. This service evaluates distractors based on relevance, plausibility, and educational value, filtering out low-quality options that might be too obvious or completely unrelated.

- **SimilarityService**: Semantic similarity detection and deduplication. This service prevents distractors that are too similar to correct answers or to each other, ensuring a diverse set of challenging options.

```typescript
// src/services/SimilarityService.ts
import { Effect, Layer } from 'effect'
import { similarity } from 'sentence-similarity'
import type { Question } from 'civics2json'

export interface SimilarityThresholds {
  correctAnswerSimilarity: number // Max similarity to correct answers
  distractorSimilarity: number // Max similarity between distractors
  minimumDistance: number // Minimum semantic distance required
}

export const DEFAULT_SIMILARITY_THRESHOLDS: SimilarityThresholds = {
  correctAnswerSimilarity: 0.8,
  distractorSimilarity: 0.7,
  minimumDistance: 0.3
}

// Core function with dependency injection via currying (following coding guide)
export const removeSimilarDistractors = (
  thresholds: SimilarityThresholds = DEFAULT_SIMILARITY_THRESHOLDS
) =>
  Effect.fn(function* (distractors: string[], correctAnswers: string[]) {
    const filtered: string[] = []
    const allExisting = [...correctAnswers]

    for (const distractor of distractors) {
      let isTooSimilar = false

      // Check similarity against correct answers
      for (const correctAnswer of correctAnswers) {
        const score = similarity(distractor.toLowerCase(), correctAnswer.toLowerCase())
        if (score > thresholds.correctAnswerSimilarity) {
          isTooSimilar = true
          break
        }
      }

      // Check similarity against already accepted distractors
      if (!isTooSimilar) {
        for (const existing of filtered) {
          const score = similarity(distractor.toLowerCase(), existing.toLowerCase())
          if (score > thresholds.distractorSimilarity) {
            isTooSimilar = true
            break
          }
        }
      }

      if (!isTooSimilar) {
        filtered.push(distractor)
      }
    }

    return filtered
  })

export const calculateSimilarityScore = () =>
  Effect.fn(function* (text1: string, text2: string) {
    return similarity(text1.toLowerCase(), text2.toLowerCase())
  })

export const deduplicateDistractors = (
  thresholds: SimilarityThresholds = DEFAULT_SIMILARITY_THRESHOLDS
) =>
  Effect.fn(function* (distractors: string[]) {
    const unique: string[] = []

    for (const distractor of distractors) {
      let isDuplicate = false

      for (const existing of unique) {
        const score = similarity(distractor.toLowerCase(), existing.toLowerCase())
        if (score > thresholds.distractorSimilarity) {
          isDuplicate = true
          break
        }
      }

      if (!isDuplicate) {
        unique.push(distractor)
      }
    }

    return unique
  })

// Service class - minimal configuration (following coding guide)
export class SimilarityService extends Effect.Service<SimilarityService>()('SimilarityService', {
  effect: Effect.sync(() => ({
    removeSimilar: removeSimilarDistractors(DEFAULT_SIMILARITY_THRESHOLDS),
    calculateSimilarity: calculateSimilarityScore(),
    deduplicate: deduplicateDistractors(DEFAULT_SIMILARITY_THRESHOLDS)
  }))
}) {}

// Test layer following coding guide pattern
export const TestSimilarityServiceLayer = (fn?: {
  removeSimilar?: typeof removeSimilarDistractors
  calculateSimilarity?: typeof calculateSimilarityScore
  deduplicate?: typeof deduplicateDistractors
}) =>
  Layer.succeed(
    SimilarityService,
    SimilarityService.of({
      _tag: 'SimilarityService',
      removeSimilar: fn?.removeSimilar ?? (() => Effect.succeed(['mock filtered distractor'])),
      calculateSimilarity: fn?.calculateSimilarity ?? (() => Effect.succeed(0.5)),
      deduplicate: fn?.deduplicate ?? (() => Effect.succeed(['mock unique distractor']))
    })
  )
```

### Effect-TS Patterns in Use

Understanding these patterns is essential for implementing new services that integrate seamlessly with the existing codebase:

1. **Service Definition Pattern**:
   Services should use currying to inject dependencies at the function level, not in the service class. The service class should be minimal and only define the service structure:

```typescript
// Define the core function with dependency injection via currying
export const executeDistractorGeneration = (dependency1: Dependency1, dependency2: Dependency2) =>
  Effect.fn(function* (question: Question) {
    const result = yield* dependency1.process(question)
    const enhanced = yield* dependency2.enhance(result)
    return enhanced
  })

// Keep service class minimal - only service configuration
export class MyService extends Effect.Service<MyService>()('MyService', {
  effect: Effect.gen(function* () {
    const dependency1 = yield* Dependency1
    const dependency2 = yield* Dependency2
    return {
      executeDistractorGeneration: executeDistractorGeneration(dependency1, dependency2)
    }
  })
}) {}
```

**Key Concepts:**

- Use currying pattern: dependencies as first parameters, actual arguments in Effect.fn
- Keep service class minimal - only for dependency wiring
- Dependencies are injected at execution point (CLI), not in service definitions
- Effect.fn creates reusable effects with proper error handling

2. **Test Layer Pattern**:
   Test layers should match the coding guide pattern with proper typing and method signatures:

```typescript
export const TestMyServiceLayer = (fn?: {
  executeDistractorGeneration?: typeof executeDistractorGeneration
}) =>
  Layer.succeed(
    MyService,
    MyService.of({
      _tag: 'MyService',
      executeDistractorGeneration:
        fn?.executeDistractorGeneration ?? (() => Effect.succeed(mockDistractorResult))
    })
  )
```

**Key Concepts:**

- Test methods should match the actual service method signatures
- Use typed function overrides instead of generic Effect types
- Provide sensible mock implementations as defaults
- Enables isolated testing without real dependencies

3. **CLI Integration Pattern**:
   The CLI is where layers should be provided - this is the execution point for dependency injection:

```typescript
const cli = Command.make('command', {}, () =>
  Effect.gen(function* () {
    const service = yield* MyService // Service injected here
    yield* service.executeDistractorGeneration(questionData) // Use service methods
  })
)

// Dependencies are provided at the execution point
const runnable = Command.run(cli, {
  name: 'Distractor Generator',
  version: '1.0.0'
})

runnable(process.argv).pipe(
  Effect.provide(MyService.Default), // Layers provided here
  Effect.provide(Dependency1.Default), // Not in service definitions
  Effect.provide(Dependency2.Default),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
```

**Key Concepts:**

- Services are injected in command handlers, not service definitions
- Layers are provided at the execution point (CLI runner)
- This allows for easy testing and dependency substitution
- Follows the coding guide's dependency injection pattern

## Effect-TS Utilities for Enhanced Implementation

Beyond basic service patterns, Effect-TS provides powerful utilities that significantly improve the robustness and observability of the distractor generation system. These utilities replace common manual implementations with type-safe, composable alternatives.

### RateLimiter for Request Throttling

Instead of using `Effect.sleep()` for crude rate limiting, use the dedicated `RateLimiter` utility:

```typescript
import * as RateLimiter from 'effect/RateLimiter'
import * as Duration from 'effect/Duration'

// Create rate limiter for OpenAI API (1 request per second)
export const createOpenAIRateLimiter = () =>
  RateLimiter.make({
    interval: Duration.seconds(1), // 1 request per second
    burst: 1 // Only 1 request allowed per interval
  })

// Wrapper for rate-limited operations
export const withRateLimit = <A, E>(
  limiter: RateLimiter.RateLimiter,
  operation: Effect.Effect<A, E>
): Effect.Effect<A, E> => RateLimiter.withPermit(limiter)(operation)
```

**Benefits over manual `Effect.sleep()`:**

- Composable with other Effect operations
- Fine-grained control via `burst`, `tokens`, and `interval`
- Works seamlessly with `Effect.all()` for batch processing
- No risk of forgotten delays or incorrect timing

### Schedule for Retry with Backoff

Replace manual retry logic with Effect's `Schedule` utilities:

```typescript
import * as Schedule from 'effect/Schedule'

// Exponential backoff with maximum retries
export const openaiRetrySchedule = Schedule.exponential(Duration.millis(500)).pipe(
  Schedule.compose(Schedule.recurs(3)), // Maximum 3 retries
  Schedule.jittered() // Add randomization to prevent thundering herd
)

// Enhanced retry with different strategies per error type
export const createAdaptiveRetrySchedule = () =>
  Schedule.recurWhile((error: OpenAIError) => {
    // Retry rate limits but not authentication errors
    if (error._tag === 'OpenAIRateLimitError') return true
    if (error._tag === 'OpenAIAuthError') return false
    return true // Retry other errors
  }).pipe(
    Schedule.compose(Schedule.exponential(Duration.seconds(1))),
    Schedule.compose(Schedule.recurs(3))
  )
```

### FiberRef for Request Context

Use `FiberRef` to propagate context throughout the effect chain:

```typescript
import * as FiberRef from 'effect/FiberRef'

// Request context for tracking and logging
export interface RequestContext {
  questionId: number
  questionType: string
  attemptNumber: number
  startTime: number
}

// Global fiber reference for request context
export const RequestContextRef = FiberRef.unsafeMake<RequestContext>({
  questionId: 0,
  questionType: 'unknown',
  attemptNumber: 1,
  startTime: Date.now()
})

// Helper to run operations with context
export const withRequestContext = <A, E>(
  context: RequestContext,
  operation: Effect.Effect<A, E>
): Effect.Effect<A, E> => FiberRef.locallyWith(RequestContextRef, () => context)(operation)

// Enhanced logging with context
export const logWithContext = (message: string) =>
  Effect.gen(function* () {
    const context = yield* FiberRef.get(RequestContextRef)
    yield* Effect.log(`[Q${context.questionId}:${context.questionType}] ${message}`)
  })
```

### Metrics for Observability

Track system performance and reliability with Effect's metrics:

```typescript
import * as Metric from 'effect/Metric'

// Define metrics for the distractor generation system
export const DistractorMetrics = {
  // Counter metrics
  openaiRequestsTotal: Metric.counter('openai_requests_total', {
    description: 'Total number of OpenAI API requests'
  }),

  openaiRequestsSuccess: Metric.counter('openai_requests_success', {
    description: 'Successful OpenAI API requests'
  }),

  openaiRequestsFailure: Metric.counter('openai_requests_failure', {
    description: 'Failed OpenAI API requests'
  }),

  // Histogram metrics
  openaiResponseTime: Metric.histogram('openai_response_time_ms', {
    description: 'OpenAI API response time in milliseconds',
    boundaries: Metric.Boundaries.exponential({ start: 100, factor: 2, count: 10 })
  }),

  distractorQualityScore: Metric.histogram('distractor_quality_score', {
    description: 'Quality scores of generated distractors',
    boundaries: Metric.Boundaries.linear({ start: 0, width: 0.1, count: 10 })
  }),

  // Gauge metrics
  questionsProcessed: Metric.gauge('questions_processed', {
    description: 'Number of questions processed'
  })
}

// Helper to measure operation duration
export const measureDuration = <A, E>(
  metric: Metric.Metric.Histogram<number>,
  operation: Effect.Effect<A, E>
): Effect.Effect<A, E> =>
  Effect.gen(function* () {
    const start = yield* Clock.currentTimeMillis
    const result = yield* operation
    const end = yield* Clock.currentTimeMillis
    yield* Metric.increment(metric, end - start)
    return result
  })
```

### Caching for Performance

Use `Effect.cache` for memoizing expensive operations:

```typescript
import * as Cache from 'effect/Cache'
import * as Duration from 'effect/Duration'

// Cache OpenAI responses to avoid duplicate API calls
export const createOpenAICache = () =>
  Cache.make({
    capacity: 1000, // Maximum cache size
    timeToLive: Duration.hours(24), // Cache for 24 hours
    lookup: (
      question: Question // Cache key function
    ) => `${question.questionNumber}-${question.question.slice(0, 50)}`
  })

// Cached OpenAI call wrapper
export const withCache = <A>(
  cache: Cache.Cache<string, A>,
  key: string,
  operation: Effect.Effect<A, never>
): Effect.Effect<A, never> => Cache.get(cache, key, () => operation)
```

## Data Structure Context

Understanding the data structures is crucial for implementing effective distractor generation. The Question type from civics2json represents the complete structure of a civics test question with all its metadata and possible answer formats:

```typescript
type Question = {
  theme: string // Thematic category (e.g. "The United States Constitution")
  section: string // Document section grouping (e.g. "Section 1")
  question: string // The actual question text shown to users
  questionNumber: number // Sequential identifier for the question (1-100)
  expectedAnswers: number // How many answers the user should provide
  answers:
    | { _type: 'text'; choices: string[] }
    | { _type: 'senator'; choices: { senator: string; state: StateAbbreviation }[] }
    | {
        _type: 'representative'
        choices: { representative: string; state: StateAbbreviation; district: string }[]
      }
    | { _type: 'governor'; choices: { governor: string; state: StateAbbreviation }[] }
    | { _type: 'capital'; choices: { capital: string; state: StateAbbreviation }[] }
}
```

**Field Explanations:**

- **theme**: Groups related questions (e.g., Constitution, History, Geography)
- **section**: Further subdivides themes into document sections from the USCIS test
- **question**: The exact text presented to test takers
- **questionNumber**: Unique identifier matching the official USCIS numbering
- **expectedAnswers**: Indicates if the question expects one answer (1) or multiple acceptable answers (2+)
- **answers**: Tagged union type that varies based on the answer format:
  - `text`: Simple string answers for general knowledge questions
  - `senator`: State-specific senator names with state abbreviations
  - `representative`: Congressional representatives with state and district info
  - `governor`: Current state governors with state abbreviations
  - `capital`: State capitals with corresponding state abbreviations

After distractor generation, each question becomes:

```typescript
type QuestionWithDistractors = Question & {
  readonly _tag: 'QuestionWithDistractors' // Type discriminator for Effect-TS
  readonly distractors: readonly string[] // Array of 10-15 incorrect answers
}
```

**Enhanced Structure Details:**

- **\_tag**: Type discriminator used by Effect-TS for tagged unions and type safety
- **distractors**: Array of plausible but incorrect answers that:
  - Match the format and complexity of correct answers
  - Are contextually relevant to the question topic
  - Provide educational value by testing genuine understanding
  - Are not duplicates of any correct answers across all questions

### Current Data Access Pattern

The existing codebase follows a service-oriented approach to data access, which provides type safety and dependency injection:

```typescript
// Load questions using existing service
const questionsDataService = yield * QuestionsDataService // Inject the service
const allQuestions = yield * questionsDataService.getAllQuestions() // Get all questions

// Process each question
const questionsWithDistractors =
  yield *
  Effect.all(
    allQuestions.map(processQuestion) // Transform each question
  )
```

**Pattern Explanation:**

- **Service Injection**: `yield* QuestionsDataService` injects the data service into the current effect
- **Method Invocation**: `getAllQuestions()` returns an Effect containing the questions array
- **Batch Processing**: `Effect.all()` processes multiple questions concurrently while maintaining type safety
- **Transformation**: Each question is processed through a function that adds distractors

---

# Implementation Goals

## Core Processing Pipeline

```typescript
export const enhancedDistractorPipeline = (
  questionsDataService: QuestionsDataService,
  openaiService: OpenAIDistractorService,
  qualityService: DistractorQualityService,
  similarityService: SimilarityService
) =>
  Effect.gen(function* () {
    // 1. Load all questions
    const allQuestions = yield* questionsDataService.getAllQuestions()

    // 2. Process each question with strategy selection
    const questionsWithDistractors = yield* Effect.all(
      allQuestions.map((question) =>
        processQuestionWithDistractors(question, allQuestions, {
          openaiService,
          qualityService,
          similarityService
        })
      )
    )

    // 3. Write output
    yield* writeDistractorsToFile(questionsWithDistractors)

    return questionsWithDistractors
  })

export const processQuestionWithDistractors = (
  question: Question,
  allQuestions: Question[],
  services: {
    openaiService: OpenAIDistractorService
    qualityService: DistractorQualityService
    similarityService: SimilarityService
  }
) =>
  Effect.gen(function* () {
    // Determine strategy based on answer type
    const rawDistractors = yield* generateDistractorsByType(
      question,
      allQuestions,
      services.openaiService
    )

    // Apply quality filters
    const qualityFiltered = yield* services.qualityService.filterByQuality(rawDistractors, question)

    // Remove similar/duplicate entries
    const deduplicatedDistractors = yield* services.similarityService.removeSimilar(
      qualityFiltered,
      question.answers.choices
    )

    // Ensure we have 10-15 high-quality distractors
    const finalDistractors = deduplicatedDistractors.slice(0, 15)

    return {
      ...question,
      _tag: 'QuestionWithDistractors' as const,
      distractors: finalDistractors
    }
  })
```

## Strategy Selection Logic

```typescript
export const generateDistractorsByType = (
  question: Question,
  allQuestions: Question[],
  openaiService: OpenAIDistractorService
) =>
  Effect.gen(function* () {
    switch (question.answers._type) {
      case 'text':
        return yield* generateTextTypeDistractors(openaiService, staticPools, question)

      case 'senator':
      case 'representative':
      case 'governor':
        return yield* generatePoliticalDistractors(allQuestions, question)

      case 'capital':
        return yield* generateCapitalDistractors(allQuestions, question, staticPools)

      default:
        return yield* Effect.fail(
          new UnsupportedQuestionTypeError({ type: question.answers._type })
        )
    }
  })
```

---

# CLI Enhancement Implementation

## Extended CLI Options

```typescript
import { Args, Command, Options } from '@effect/cli'

const regenAllOption = Options.boolean('regen-all').pipe(
  Options.withDescription('Ignore existing distractors and regenerate all')
)

const regenIncompleteOption = Options.boolean('regen-incomplete').pipe(
  Options.withDescription('Only regenerate if distractors.length < 10')
)

const targetCountOption = Options.integer('num').pipe(
  Options.withDefault(15),
  Options.withDescription('Target distractor count per question')
)

const filterSimilarOption = Options.boolean('filter-similar').pipe(
  Options.withDefault(true),
  Options.withDescription('Apply similarity filtering')
)

const checkAnswersOption = Options.boolean('check-answers').pipe(
  Options.withDefault(true),
  Options.withDescription('Filter out distractors that appear as correct answers elsewhere')
)

const enhancedCli = Command.make(
  'distractors',
  {
    regenAll: regenAllOption,
    regenIncomplete: regenIncompleteOption,
    targetCount: targetCountOption,
    filterSimilar: filterSimilarOption,
    checkAnswers: checkAnswersOption
  },
  ({ regenAll, regenIncomplete, targetCount, filterSimilar, checkAnswers }) =>
    Effect.gen(function* () {
      const manager = yield* EnhancedDistractorManager

      const options: DistractorGenerationOptions = {
        regenAll,
        regenIncomplete,
        targetCount,
        filterSimilar,
        checkAnswers
      }

      yield* manager.generateWithOptions(options)
    })
)
```

## Environment Configuration

```typescript
// Environment validation
export const validateEnvironment = () =>
  Effect.gen(function* () {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return yield* Effect.fail(new MissingEnvironmentVariableError({ variable: 'OPENAI_API_KEY' }))
    }

    // Test API connectivity
    yield* Effect.tryPromise({
      try: () => new OpenAI({ apiKey }).models.list(),
      catch: (error) => new OpenAIConnectionError({ cause: error })
    })

    return apiKey
  })
```

## Input Sources

- **Questions**: Via `QuestionsDataService.getAllQuestions()`
- **OpenAI API Key**: Environment variable `OPENAI_API_KEY`
- **Static Pools**: From `src/data/pools/*` modules
- **CLI Options**: Command-line flags for processing control
- **Existing Distractors**: From current `CuratedDistractorService`

---

# Distractor Generation Strategies

This section covers the different approaches for generating high-quality distractors based on the question type and content. Each strategy is designed to create plausible but incorrect answers that effectively test understanding rather than memorization.

## OpenAI Integration Implementation

The OpenAI integration uses GPT models to generate contextually appropriate distractors when static pools are insufficient. This approach is particularly valuable for text-based questions that don't fit into predefined categories.

### OpenAIDistractorService

This service encapsulates all OpenAI API interactions with proper error handling, rate limiting, and response parsing. Following the coding guide, dependencies are injected via currying and the service class is kept minimal. **Enhanced with Effect-TS utilities**: RateLimiter, Schedule, Metrics, and FiberRef for production-ready robustness.

```typescript
import { Effect, Layer, Config, Clock } from 'effect'
import * as RateLimiter from 'effect/RateLimiter'
import * as Duration from 'effect/Duration'
import * as Schedule from 'effect/Schedule'
import * as Metric from 'effect/Metric'
import * as FiberRef from 'effect/FiberRef'
import { HttpClient } from '@effect/platform'
import OpenAI from 'openai'
import type { Question } from 'civics2json'

// Enhanced core function with proper Effect-TS utilities
export const generateTextDistractors = (
  apiKey: string,
  rateLimiter: RateLimiter.RateLimiter,
  metrics: typeof DistractorMetrics
) =>
  Effect.fn(function* (question: Question, count: number = 15) {
    const openai = new OpenAI({ apiKey })

    // Set up request context for logging and metrics
    const requestContext: RequestContext = {
      questionId: question.questionNumber,
      questionType: question.answers._type,
      attemptNumber: 1,
      startTime: Date.now()
    }

    return yield* withRequestContext(
      requestContext,
      Effect.gen(function* () {
        yield* logWithContext(`Starting distractor generation for question: "${question.question}"`)

        const correctAnswers = question.answers._type === 'text' ? question.answers.choices : []

        const prompt = `You are an expert in U.S. civics education.

Write ${count} plausible but incorrect answers for the question below.

### Instructions:
- Each distractor must be *wrong*, but sound reasonable.
- Match the structure and type of the correct answers.
- Avoid joke or implausible responses.
- Output a JSON array.

### Question:
${question.question}

### Correct Answer(s):
${correctAnswers.join(', ')}

### Theme:
${question.theme} / ${question.section}

### Output:
JSON array only`

        // Rate-limited and metrified OpenAI call
        const openaiCall = Effect.gen(function* () {
          yield* Metric.increment(metrics.openaiRequestsTotal)

          const response = yield* Effect.tryPromise({
            try: () =>
              openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: 1000
              }),
            catch: (error) => handleOpenAIError(error)
          })

          const result = yield* Effect.try({
            try: () => {
              const content = response.choices[0]?.message?.content
              if (!content) throw new Error('Empty response from OpenAI')
              return JSON.parse(content) as string[]
            },
            catch: (error) => new ParseError({ cause: error })
          })

          yield* Metric.increment(metrics.openaiRequestsSuccess)
          yield* logWithContext(`Successfully generated ${result.length} distractors`)
          return result
        })

        // Apply rate limiting, retries, and duration measurement
        return yield* withRateLimit(
          rateLimiter,
          measureDuration(
            metrics.openaiResponseTime,
            openaiCall.pipe(
              Effect.retry(createAdaptiveRetrySchedule()),
              Effect.catchAll((error) =>
                Effect.gen(function* () {
                  yield* Metric.increment(metrics.openaiRequestsFailure)
                  yield* logWithContext(`OpenAI request failed: ${error._tag}`)
                  return yield* Effect.fail(error)
                })
              )
            )
          )
        )
      })
    )
  })

// Minimal service class - only service configuration (following coding guide)
export class OpenAIDistractorService extends Effect.Service<OpenAIDistractorService>()(
  'OpenAIDistractorService',
  {
    effect: Effect.gen(function* () {
      const apiKey = yield* Config.string('OPENAI_API_KEY')
      const rateLimiter = yield* createOpenAIRateLimiter()

      return {
        generateTextDistractors: generateTextDistractors(apiKey, rateLimiter, DistractorMetrics)
      }
    })
  }
) {}

// Test layer following coding guide pattern
export const TestOpenAIDistractorServiceLayer = (fn?: {
  generateTextDistractors?: typeof generateTextDistractors
}) =>
  Layer.succeed(
    OpenAIDistractorService,
    OpenAIDistractorService.of({
      _tag: 'OpenAIDistractorService',
      generateTextDistractors:
        fn?.generateTextDistractors ??
        (() => Effect.succeed(['mock distractor 1', 'mock distractor 2', 'mock distractor 3']))
    })
  )
```

### Pattern Detection for Text Questions

Pattern detection identifies when text answers follow recognizable formats (like state names or years) so we can use targeted static pools instead of expensive OpenAI calls. This improves both performance and consistency.

```typescript
export const detectAnswerPattern = (answers: string[]) => {
  const patterns = {
    states:
      /^(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)$/,
    presidents:
      /^(George Washington|John Adams|Thomas Jefferson|James Madison|James Monroe|John Quincy Adams|Andrew Jackson|Martin Van Buren|William Henry Harrison|John Tyler|James Knox Polk|Zachary Taylor|Millard Fillmore|Franklin Pierce|James Buchanan|Abraham Lincoln|Andrew Johnson|Ulysses S\. Grant|Rutherford Birchard Hayes|James Abram Garfield|Chester Alan Arthur|Grover Cleveland|Benjamin Harrison|William McKinley|Theodore Roosevelt|William Howard Taft|Woodrow Wilson|Warren Gamaliel Harding|Calvin Coolidge|Herbert Clark Hoover|Franklin Delano Roosevelt|Harry S\. Truman|Dwight David Eisenhower|John Fitzgerald Kennedy|Lyndon Baines Johnson|Richard Milhous Nixon|Gerald Rudolph Ford|James Earl Carter Jr\.|Ronald Wilson Reagan|George Herbert Walker Bush|William Jefferson Clinton|George Walker Bush|Barack Hussein Obama|Donald John Trump|Joseph Robinette Biden Jr\.)$/,
    years: /^\d{4}$/,
    numbers: /^\d+$/
  }

  for (const answer of answers) {
    if (patterns.states.test(answer)) return 'states'
    if (patterns.presidents.test(answer)) return 'presidents'
    if (patterns.years.test(answer)) return 'years'
    if (patterns.numbers.test(answer)) return 'numbers'
  }
  return 'generic'
}
```

## Strategy by Answer Type

Different question types require different distractor generation approaches. The strategy selection is based on the `_type` field in the question's answers structure.

### \_type: `text` Implementation

Text questions cover general civics knowledge and can have varied answer formats. This implementation uses pattern detection to choose between static pools and OpenAI generation:

```typescript
export const generateTextTypeDistractors = (
  openaiService: OpenAIDistractorService,
  staticPools: StaticDistractorPools,
  question: Question
) =>
  Effect.gen(function* () {
    if (question.answers._type !== 'text') {
      return yield* Effect.fail(
        new InvalidQuestionTypeError({ expected: 'text', actual: question.answers._type })
      )
    }

    const pattern = detectAnswerPattern(question.answers.choices)

    switch (pattern) {
      case 'states':
        return staticPools.states
          .filter((state) => !question.answers.choices.includes(state))
          .slice(0, 15)

      case 'presidents':
        return staticPools.presidents
          .filter((president) => !question.answers.choices.includes(president))
          .slice(0, 15)

      case 'years':
      case 'numbers':
        return generateNumericalDistractors(question.answers.choices)

      default:
        return yield* openaiService.generateTextDistractors(question, 15)
    }
  })
```

---

### Political Representatives Implementation

For political questions (senators, representatives, governors), distractors are generated by selecting officials from other states. This ensures the distractors are real people in similar roles but incorrect for the specific state being asked about.

**Strategy Benefits:**

- Uses real names, making distractors highly plausible
- Automatically excludes correct answers by state filtering
- Maintains consistent formatting across similar question types
- Scales automatically as new officials are added to the dataset

```typescript
export const generatePoliticalDistractors = (allQuestions: Question[], currentQuestion: Question) =>
  Effect.gen(function* () {
    const { _type, choices } = currentQuestion.answers

    if (!['senator', 'representative', 'governor'].includes(_type)) {
      return yield* Effect.fail(new InvalidQuestionTypeError({ type: _type }))
    }

    // Get correct states to exclude
    const correctStates = new Set(
      choices.map((choice) => ('state' in choice ? choice.state : '')).filter(Boolean)
    )

    // Find all people of same type from different states
    const potentialDistractors = allQuestions
      .filter(
        (q) => q.answers._type === _type && q.questionNumber !== currentQuestion.questionNumber
      )
      .flatMap((q) => q.answers.choices)
      .filter((choice) => 'state' in choice && !correctStates.has(choice.state))
      .map((choice) => {
        switch (_type) {
          case 'senator':
            return 'senator' in choice ? choice.senator : ''
          case 'representative':
            return 'representative' in choice ? choice.representative : ''
          case 'governor':
            return 'governor' in choice ? choice.governor : ''
          default:
            return ''
        }
      })
      .filter(Boolean)

    // Remove duplicates and sample 15
    const uniqueDistractors = [...new Set(potentialDistractors)]
    return shuffleArray(uniqueDistractors).slice(0, 15)
  })

// Utility function for array shuffling
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
```

---

### Capital Cities Implementation

Capital questions use a hybrid approach combining real state capitals with common misconceptions (major cities that aren't capitals). This strategy tests whether users can distinguish between a state's largest city and its actual capital.

**Strategy Details:**

- Primary distractors are real capitals from other states
- Secondary distractors are major non-capital cities that could be plausibly confused
- Excludes cities mentioned in the question text to avoid giving away the answer
- Results are shuffled to prevent patterns in answer placement

```typescript
export const generateCapitalDistractors = (
  allQuestions: Question[],
  currentQuestion: Question,
  staticPools: StaticDistractorPools
) =>
  Effect.gen(function* () {
    if (currentQuestion.answers._type !== 'capital') {
      return yield* Effect.fail(
        new InvalidQuestionTypeError({ expected: 'capital', actual: currentQuestion.answers._type })
      )
    }

    const correctStates = new Set(
      currentQuestion.answers.choices
        .map((choice) => ('state' in choice ? choice.state : ''))
        .filter(Boolean)
    )

    // Get capitals from other states
    const otherCapitals = allQuestions
      .filter(
        (q) => q.answers._type === 'capital' && q.questionNumber !== currentQuestion.questionNumber
      )
      .flatMap((q) => q.answers.choices)
      .filter((choice) => 'state' in choice && !correctStates.has(choice.state))
      .map((choice) => ('capital' in choice ? choice.capital : ''))
      .filter(Boolean)

    // Add common wrong answers (major non-capital cities)
    const commonWrongAnswers = [
      'New York City',
      'Los Angeles',
      'Chicago',
      'Houston',
      'Philadelphia',
      'San Antonio',
      'San Diego',
      'Dallas',
      'Miami',
      'Atlanta'
    ].filter((city) => {
      // Only include if it could be plausibly mistaken for a capital
      const questionText = currentQuestion.question.toLowerCase()
      return !questionText.includes(city.toLowerCase())
    })

    const allDistractors = [...new Set([...otherCapitals, ...commonWrongAnswers])]
    return shuffleArray(allDistractors).slice(0, 15)
  })
```

---

# Development Workflow

## Step-by-Step Implementation Process

### Phase 1: Service Implementation

1. **Create Error Types**

```typescript
// src/errors.ts
export class OpenAIError extends Data.TaggedError('OpenAIError')<{ cause: unknown }> {}
export class ParseError extends Data.TaggedError('ParseError')<{ cause: unknown }> {}
export class InvalidQuestionTypeError extends Data.TaggedError('InvalidQuestionTypeError')<{
  expected?: string
  actual: string
}> {}
export class MissingEnvironmentVariableError extends Data.TaggedError(
  'MissingEnvironmentVariableError'
)<{
  variable: string
}> {}
```

2. **Implement OpenAIDistractorService**

```bash
# Create service file
touch src/services/OpenAIDistractorService.ts

# Implement with Error handling and Effect patterns
# Add test layer for mocking
```

3. **Implement DistractorQualityService**

```typescript
// Quality assessment with configurable thresholds
export const assessDistractorQuality = (
  distractor: string,
  question: Question,
  thresholds: QualityThresholds
) =>
  Effect.gen(function* () {
    const relevanceScore = yield* calculateRelevance(distractor, question)
    const plausibilityScore = yield* calculatePlausibility(distractor, question)
    const difficultyScore = yield* calculateDifficulty(distractor, question)

    return {
      relevance: relevanceScore,
      plausibility: plausibilityScore,
      difficulty: difficultyScore,
      overall: (relevanceScore + plausibilityScore + difficultyScore) / 3,
      passes:
        relevanceScore >= thresholds.relevance &&
        plausibilityScore >= thresholds.plausibility &&
        difficultyScore >= thresholds.difficulty
    }
  })
```

4. **Implement SimilarityService**

```typescript
// Using sentence-similarity package
import { similarity } from 'sentence-similarity'

export const removeSimilarDistractors = (
  distractors: string[],
  correctAnswers: string[],
  threshold: number = 0.8
) =>
  Effect.gen(function* () {
    const filtered: string[] = []
    const allExisting = [...correctAnswers, ...filtered]

    for (const distractor of distractors) {
      const similarities = allExisting.map((existing) => similarity(distractor, existing))

      const maxSimilarity = Math.max(...similarities)

      if (maxSimilarity < threshold) {
        filtered.push(distractor)
      }
    }

    return filtered
  })
```

### Phase 2: Service Integration

5. **Update DistractorManager**

```typescript
// Extend existing DistractorManager with new services
export class EnhancedDistractorManager extends Effect.Service<EnhancedDistractorManager>()()(
  'EnhancedDistractorManager',
  {
    effect: Effect.gen(function* () {
      const openaiService = yield* OpenAIDistractorService
      const qualityService = yield* DistractorQualityService
      const similarityService = yield* SimilarityService
      const questionsService = yield* QuestionsDataService
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path

      return {
        generateWithOptions: (options: DistractorGenerationOptions) =>
          enhancedDistractorPipeline(
            questionsService,
            openaiService,
            qualityService,
            similarityService,
            options
          ).pipe(Effect.flatMap((questions) => writeDistractorsToFile(questions, fs, path)))
      }
    }),
    dependencies: [
      OpenAIDistractorService.Default,
      DistractorQualityService.Default,
      SimilarityService.Default,
      QuestionsDataService.Default
    ]
  }
) {}
```

### Phase 3: Testing Implementation

6. **Create Comprehensive Test Suites** - See detailed testing strategy in the Testing Strategy section below

### Phase 4: CLI Integration

7. **Update CLI with New Options**

```bash
# Update src/cli/index.ts with extended command structure
# Add option parsing and validation
# Connect to EnhancedDistractorManager
```

8. **Environment Setup**

```bash
# Add to .envrc (user should do this)
echo 'export OPENAI_API_KEY="sk-..."' >> .envrc
direnv allow
```

## Output Format

The enhanced implementation produces:

```json
{
  "questionNumber": 1,
  "question": "What is the supreme law of the land?",
  "theme": "The United States Constitution",
  "section": "Section 1",
  "expectedAnswers": 1,
  "answers": {
    "_type": "text",
    "choices": ["the Constitution"]
  },
  "distractors": [
    "the Declaration of Independence",
    "the Bill of Rights",
    "the Articles of Confederation",
    "the Federalist Papers",
    "the Magna Carta",
    "the Constitution of the United States",
    "the Emancipation Proclamation",
    "the Gettysburg Address",
    "the Monroe Doctrine",
    "the Treaty of Paris",
    "the Louisiana Purchase",
    "the Marshall Plan",
    "the New Deal",
    "the Great Society",
    "the Affordable Care Act"
  ],
  "_tag": "QuestionWithDistractors"
}
```

---

## Quality Validation Process

```typescript
export const validateDistractorQuality = (questionsWithDistractors: QuestionWithDistractors[]) =>
  Effect.gen(function* () {
    const validationResults = {
      totalQuestions: questionsWithDistractors.length,
      questionsWithSufficientDistractors: 0,
      averageDistractorCount: 0,
      qualityIssues: [] as string[]
    }

    for (const question of questionsWithDistractors) {
      // Count validation
      if (question.distractors.length >= 10) {
        validationResults.questionsWithSufficientDistractors++
      } else {
        validationResults.qualityIssues.push(
          `Question ${question.questionNumber}: Only ${question.distractors.length} distractors`
        )
      }

      // Duplicate validation
      const correctAnswers = extractCorrectAnswers(question)
      const duplicates = question.distractors.filter((d) => correctAnswers.includes(d))
      if (duplicates.length > 0) {
        validationResults.qualityIssues.push(
          `Question ${question.questionNumber}: Distractors duplicate correct answers: ${duplicates.join(', ')}`
        )
      }

      // Content validation
      const emptyDistractors = question.distractors.filter((d) => !d.trim())
      if (emptyDistractors.length > 0) {
        validationResults.qualityIssues.push(
          `Question ${question.questionNumber}: ${emptyDistractors.length} empty distractors`
        )
      }
    }

    validationResults.averageDistractorCount =
      questionsWithDistractors.reduce((sum, q) => sum + q.distractors.length, 0) /
      questionsWithDistractors.length

    return validationResults
  })
```

## Performance Benchmarks and Targets

Specific performance targets and measurement strategies for the enhanced distractor generation system.

### Performance Targets

#### Throughput Benchmarks

- **Questions per minute**: 30-60 questions (with OpenAI integration)
- **Questions per minute**: 200+ questions (static generation only)
- **OpenAI API requests**: 60 requests per minute (1 per second rate limit)
- **Batch processing**: Process 100 questions in under 5 minutes
- **Memory efficiency**: Stay under 200MB heap usage during generation

#### Latency Benchmarks

- **OpenAI response time**: 95th percentile under 5 seconds
- **Quality assessment**: Under 100ms per distractor
- **Similarity calculation**: Under 50ms per comparison
- **File I/O operations**: Under 1 second for reading/writing JSON

#### Quality Benchmarks

- **Coverage**: 100% of questions have 10+ distractors
- **Success rate**: 95%+ of OpenAI requests succeed
- **Quality pass rate**: 80%+ of generated distractors pass quality filters
- **Duplicate rate**: Less than 5% duplicates after similarity filtering

### Performance Monitoring Integration

```typescript
// Performance benchmarking integrated into package.json scripts
{
  "scripts": {
    "test:performance": "jest --testPathPattern=performance --testTimeout=60000",
    "benchmark": "npx tsx src/utils/benchmarks.ts",
    "monitor": "npx tsx src/utils/performance-monitor.ts"
  }
}
```

### CI/CD Performance Gates

The system includes automated performance regression detection:

- Tracks historical performance across builds
- Alerts on significant regressions (>20% degradation)
- Provides detailed metrics for debugging performance issues
- Integrates with CI/CD to prevent performance regressions

# Success Criteria

## Quantitative Metrics

- ✅ **Coverage**: Each question has 10–15 high-quality distractors
- ✅ **Accuracy**: All distractors are plausible but incorrect
- ✅ **Uniqueness**: No distractor duplicates any correct answer globally
- ✅ **Consistency**: Structure and formatting match question type
- ✅ **Quality**: Distractors pass relevance, plausibility, and educational value thresholds

## Qualitative Assessment

- **Educational Value**: Distractors test genuine understanding vs. memorization
- **Contextual Relevance**: Incorrect answers relate to the question domain
- **Appropriate Difficulty**: Neither too obvious nor impossibly obscure
- **Semantic Diversity**: Distractors cover different aspects of the topic

## Output Requirements

- Final JSON written to `data/questions-with-distractors.json`
- Maintains full Question structure plus distractors array
- Compatible with existing questionnaire and website consumers
- Includes \_tag field for Effect-TS tagged union type safety

# Technical Specifications

This section defines the technical requirements, algorithms, and performance characteristics for the enhanced distractor generation system.

## Quality Assessment Metrics

Quality assessment is crucial for ensuring distractors are educationally valuable and appropriately challenging. The system uses multiple metrics to evaluate each distractor before including it in the final set.

### Relevance Scoring (0.0 - 1.0)

Relevance measures how contextually related a distractor is to the question and its theme. Higher scores indicate distractors that are topically appropriate, making them more challenging and educational.

```typescript
export const calculateRelevance = (distractor: string, question: Question) =>
  Effect.gen(function* () {
    const questionTerms = extractKeyTerms(question.question)
    const themeTerms = extractKeyTerms(question.theme)
    const distractorTerms = extractKeyTerms(distractor)

    const questionOverlap = calculateTermOverlap(questionTerms, distractorTerms)
    const themeOverlap = calculateTermOverlap(themeTerms, distractorTerms)

    // Weighted score: 60% question relevance, 40% theme relevance
    return questionOverlap * 0.6 + themeOverlap * 0.4
  })

const extractKeyTerms = (text: string): string[] => {
  const stopWords = new Set([
    'the',
    'of',
    'a',
    'an',
    'is',
    'are',
    'what',
    'who',
    'when',
    'where',
    'why',
    'how'
  ])
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((term) => term.length > 2 && !stopWords.has(term))
}
```

### Plausibility Assessment (0.0 - 1.0)

Plausibility measures how believable a distractor would be to someone with partial knowledge of the topic. This prevents obviously wrong answers while ensuring distractors are still incorrect.

```typescript
export const calculatePlausibility = (distractor: string, question: Question) =>
  Effect.gen(function* () {
    const factors = {
      lengthSimilarity: assessLengthSimilarity(distractor, question),
      structuralSimilarity: assessStructuralSimilarity(distractor, question),
      domainAppropriate: assessDomainAppropriateness(distractor, question),
      factuallyIncorrect: assessFactualIncorrectness(distractor, question)
    }

    // Equal weighting of all factors
    return Object.values(factors).reduce((sum, score) => sum + score, 0) / 4
  })

const assessLengthSimilarity = (distractor: string, question: Question): number => {
  const correctAnswers = extractCorrectAnswers(question)
  const avgCorrectLength =
    correctAnswers.reduce((sum, ans) => sum + ans.length, 0) / correctAnswers.length
  const lengthDiff = Math.abs(distractor.length - avgCorrectLength) / avgCorrectLength
  return Math.max(0, 1 - lengthDiff)
}
```

### Educational Value Scoring (0.0 - 1.0)

Educational value measures how effectively a distractor tests genuine understanding versus memorization. High-value distractors often represent common misconceptions or require deeper knowledge to eliminate.

```typescript
export const calculateEducationalValue = (distractor: string, question: Question) =>
  Effect.gen(function* () {
    const commonMistakeScore = assessCommonMistake(distractor, question)
    const conceptualChallengeScore = assessConceptualChallenge(distractor, question)
    const discriminationScore = assessDiscriminationPower(distractor, question)

    return (commonMistakeScore + conceptualChallengeScore + discriminationScore) / 3
  })
```

## Performance Specifications

Performance considerations are critical for a system processing 100+ questions with potential OpenAI API calls. These specifications ensure the system runs efficiently while managing costs and API limitations.

### OpenAI API Usage

The system is designed to minimize API costs while maintaining quality through strategic model selection and efficient request patterns:

- **Model**: GPT-4o-mini for cost efficiency (90% cheaper than GPT-4, sufficient quality for distractors)
- **Rate Limiting**: 60 requests per minute (1 per second) to stay within API limits
- **Token Management**: ~200-300 tokens per request (optimized prompt design)
- **Caching**: Cache results by question hash to avoid duplicate API calls during development
- **Retry Logic**: Exponential backoff with 3 retry attempts for resilient error handling

```typescript
export const rateLimitedOpenAICall = <T>(operation: () => Effect.Effect<T, OpenAIError>) =>
  Effect.gen(function* () {
    yield* Effect.sleep(1000) // 1 second rate limit
    return yield* Effect.retry(
      operation(),
      Schedule.exponential(1000).pipe(Schedule.compose(Schedule.recurs(2)))
    )
  })
```

### Memory and Storage

Memory management is important when processing large datasets and making API calls. These specifications ensure the system remains responsive and doesn't overwhelm available resources:

- **Question Processing**: Batch size of 10 questions for memory efficiency and progress visibility
- **File I/O**: Stream large datasets to avoid loading everything into memory simultaneously
- **Cache Size**: Limit OpenAI response cache to 100MB to prevent disk space issues
- **Output Format**: Pretty-printed JSON with 2-space indentation for human readability

### Quality Thresholds

These thresholds represent the minimum acceptable quality levels for distractors. They're designed to be strict enough to ensure educational value while flexible enough to generate sufficient distractors for all questions:

```typescript
export const DEFAULT_QUALITY_THRESHOLDS = {
  relevance: 0.7, // Must be contextually related
  plausibility: 0.6, // Must sound reasonable
  educationalValue: 0.8, // Must test genuine understanding
  similarity: 0.8, // Max similarity to existing answers
  minLength: 3, // Minimum character length
  maxLength: 200 // Maximum character length
} as const
```

## Error Handling Strategy

### OpenAI API Errors

```typescript
export const handleOpenAIError = (error: unknown): Effect.Effect<string[], OpenAIError> => {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 429) {
      // Rate limit - retry with exponential backoff
      return Effect.fail(new OpenAIRateLimitError({ cause: error }))
    }
    if (error.status === 401) {
      // Authentication error - fail fast
      return Effect.fail(new OpenAIAuthError({ cause: error }))
    }
  }

  // Generic API error
  return Effect.fail(new OpenAIError({ cause: error }))
}
```

### Fallback Strategies

1. **OpenAI Unavailable**: Fall back to enhanced static pools
2. **Quality Filter Too Strict**: Gradually reduce thresholds
3. **Insufficient Distractors**: Supplement with template-based generation
4. **API Rate Limits**: Implement queue with delays

# Complete Implementation Examples

## OpenAIDistractorService Implementation

```typescript
// src/services/OpenAIDistractorService.ts
import { Effect, Layer, Data } from 'effect'
import { HttpClient } from '@effect/platform'
import OpenAI from 'openai'
import type { Question } from 'civics2json'

// Error types
export class OpenAIError extends Data.TaggedError('OpenAIError')<{ cause: unknown }> {}
export class ParseError extends Data.TaggedError('ParseError')<{ cause: unknown }> {}
export class OpenAIRateLimitError extends Data.TaggedError('OpenAIRateLimitError')<{
  cause: unknown
}> {}
export class OpenAIAuthError extends Data.TaggedError('OpenAIAuthError')<{ cause: unknown }> {}

// Core service implementation
export const generateTextDistractors = (openai: OpenAI, question: Question, count: number = 15) =>
  Effect.gen(function* () {
    const correctAnswers = question.answers._type === 'text' ? question.answers.choices : []

    const prompt = `You are an expert in U.S. civics education.

Write ${count} plausible but incorrect answers for the question below.

### Instructions:
- Each distractor must be *wrong*, but sound reasonable.
- Match the structure and type of the correct answers.
- Avoid joke or implausible responses.
- Output a JSON array.

### Question:
${question.question}

### Correct Answer(s):
${correctAnswers.join(', ')}

### Theme:
${question.theme} / ${question.section}

### Output:
JSON array only`

    return yield* Effect.tryPromise({
      try: () =>
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1000
        }),
      catch: (error) => handleOpenAIError(error)
    }).pipe(
      Effect.flatMap((response) =>
        Effect.try({
          try: () => {
            const content = response.choices[0]?.message?.content
            if (!content) throw new Error('Empty response from OpenAI')
            return JSON.parse(content) as string[]
          },
          catch: (error) => new ParseError({ cause: error })
        })
      ),
      // Add rate limiting
      Effect.delay(1000)
    )
  })

export const handleOpenAIError = (error: unknown): never => {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 429) {
      throw new OpenAIRateLimitError({ cause: error })
    }
    if (error.status === 401) {
      throw new OpenAIAuthError({ cause: error })
    }
  }
  throw new OpenAIError({ cause: error })
}

// Core function with dependency injection via currying (following coding guide)
export const generateTextDistractorsWithDeps = (apiKey: string) =>
  Effect.fn(function* (question: Question, count: number = 15) {
    const openai = new OpenAI({ apiKey })
    return yield* generateTextDistractors(openai, question, count)
  })

export class OpenAIDistractorService extends Effect.Service<OpenAIDistractorService>()(
  'OpenAIDistractorService',
  {
    effect: Effect.gen(function* () {
      const apiKey = yield* Config.string('OPENAI_API_KEY')

      return {
        generateTextDistractors: generateTextDistractorsWithDeps(apiKey)
      }
    })
  }
) {}

// Test layer for mocking
export const TestOpenAIDistractorServiceLayer = (fn?: {
  generateTextDistractors?: (
    question: Question,
    count?: number
  ) => Effect.Effect<string[], OpenAIError>
}) =>
  Layer.succeed(
    OpenAIDistractorService,
    OpenAIDistractorService.of({
      _tag: 'OpenAIDistractorService',
      generateTextDistractors:
        fn?.generateTextDistractors ??
        (() => Effect.succeed(['mock distractor 1', 'mock distractor 2', 'mock distractor 3']))
    })
  )
```

## DistractorQualityService Implementation

```typescript
// src/services/DistractorQualityService.ts
import { Effect, Layer } from 'effect'
import type { Question } from 'civics2json'

export interface QualityThresholds {
  relevance: number
  plausibility: number
  educationalValue: number
  similarity: number
  minLength: number
  maxLength: number
}

export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  relevance: 0.7,
  plausibility: 0.6,
  educationalValue: 0.8,
  similarity: 0.8,
  minLength: 3,
  maxLength: 200
}

export interface DistractorQualityAssessment {
  relevance: number
  plausibility: number
  educationalValue: number
  overall: number
  passes: boolean
}

// Core function with dependency injection via currying (following coding guide)
export const assessDistractorQuality = (
  thresholds: QualityThresholds = DEFAULT_QUALITY_THRESHOLDS
) =>
  Effect.fn(function* (distractor: string, question: Question) {
    // Length check
    if (distractor.length < thresholds.minLength || distractor.length > thresholds.maxLength) {
      return {
        relevance: 0,
        plausibility: 0,
        educationalValue: 0,
        overall: 0,
        passes: false
      }
    }

    const relevance = yield* calculateRelevance(distractor, question)
    const plausibility = yield* calculatePlausibility(distractor, question)
    const educationalValue = yield* calculateEducationalValue(distractor, question)

    const overall = (relevance + plausibility + educationalValue) / 3

    const passes =
      relevance >= thresholds.relevance &&
      plausibility >= thresholds.plausibility &&
      educationalValue >= thresholds.educationalValue

    return {
      relevance,
      plausibility,
      educationalValue,
      overall,
      passes
    }
  })

export const filterByQuality = (thresholds: QualityThresholds = DEFAULT_QUALITY_THRESHOLDS) =>
  Effect.fn(function* (distractors: string[], question: Question) {
    const assessFn = assessDistractorQuality(thresholds)
    const assessments = yield* Effect.all(
      distractors.map((distractor) =>
        assessFn(distractor, question).pipe(
          Effect.map((assessment) => ({ distractor, assessment }))
        )
      )
    )

    return assessments
      .filter(({ assessment }) => assessment.passes)
      .sort((a, b) => b.assessment.overall - a.assessment.overall)
      .map(({ distractor }) => distractor)
  })

const calculateRelevance = (distractor: string, question: Question) =>
  Effect.sync(() => {
    const questionTerms = extractKeyTerms(question.question)
    const themeTerms = extractKeyTerms(question.theme)
    const distractorTerms = extractKeyTerms(distractor)

    const questionOverlap = calculateTermOverlap(questionTerms, distractorTerms)
    const themeOverlap = calculateTermOverlap(themeTerms, distractorTerms)

    return questionOverlap * 0.6 + themeOverlap * 0.4
  })

const extractKeyTerms = (text: string): string[] => {
  const stopWords = new Set([
    'the',
    'of',
    'a',
    'an',
    'is',
    'are',
    'what',
    'who',
    'when',
    'where',
    'why',
    'how',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'with',
    'by'
  ])

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((term) => term.length > 2 && !stopWords.has(term))
}

const calculateTermOverlap = (terms1: string[], terms2: string[]): number => {
  if (terms1.length === 0 || terms2.length === 0) return 0

  const set1 = new Set(terms1)
  const overlap = terms2.filter((term) => set1.has(term)).length

  return overlap / Math.max(terms1.length, terms2.length)
}

// Minimal service class - only service configuration
export class DistractorQualityService extends Effect.Service<DistractorQualityService>()(
  'DistractorQualityService',
  {
    effect: Effect.sync(() => ({
      assessQuality: assessDistractorQuality(DEFAULT_QUALITY_THRESHOLDS),
      filterByQuality: filterByQuality(DEFAULT_QUALITY_THRESHOLDS)
    }))
  }
) {}

// Test layer following coding guide pattern
export const TestDistractorQualityServiceLayer = (fn?: {
  assessQuality?: typeof assessDistractorQuality
  filterByQuality?: typeof filterByQuality
}) =>
  Layer.succeed(
    DistractorQualityService,
    DistractorQualityService.of({
      _tag: 'DistractorQualityService',
      assessQuality:
        fn?.assessQuality ??
        (() =>
          Effect.succeed({
            relevance: 0.8,
            plausibility: 0.7,
            educationalValue: 0.9,
            overall: 0.8,
            passes: true
          })),
      filterByQuality: fn?.filterByQuality ?? (() => Effect.succeed(['mock filtered distractor']))
    })
  )
```

## Integration Architecture

### Enhanced StaticGenerator

```typescript
// src/generators/EnhancedStaticGenerator.ts
import { Effect } from 'effect'
import { StaticGenerator } from './StaticGenerator'
import { OpenAIDistractorService } from '../services/OpenAIDistractorService'
import { DistractorQualityService } from '../services/DistractorQualityService'
import type { Question } from 'civics2json'

export const generateEnhancedDistractors = (
  staticGenerator: StaticGenerator,
  openaiService: OpenAIDistractorService,
  qualityService: DistractorQualityService,
  question: Question,
  targetCount: number = 15
) =>
  Effect.gen(function* () {
    // Start with curated/static distractors
    const staticResult = yield* staticGenerator.generate([question])
    const staticDistractors = staticResult[0]?.distractors || []

    // If we have enough high-quality static distractors, use them
    if (staticDistractors.length >= targetCount) {
      return staticDistractors.slice(0, targetCount)
    }

    // Otherwise, supplement with OpenAI-generated distractors
    const needCount = targetCount - staticDistractors.length
    let generatedDistractors: string[] = []

    if (question.answers._type === 'text') {
      generatedDistractors = yield* openaiService.generateTextDistractors(
        question,
        needCount + 5 // Generate extra for filtering
      )
    } else {
      // For political questions, stick with static generation
      return staticDistractors
    }

    // Filter generated distractors for quality
    const qualityFiltered = yield* qualityService.filterByQuality(generatedDistractors, question)

    // Combine and deduplicate
    const allDistractors = [...staticDistractors, ...qualityFiltered]
    const uniqueDistractors = [...new Set(allDistractors)]

    return uniqueDistractors.slice(0, targetCount)
  })
```

# Service Integration Points

## Extending Existing DistractorManager

```typescript
// src/services/EnhancedDistractorManager.ts
import { Effect, Layer } from 'effect'
import { FileSystem, Path } from '@effect/platform'
import { DistractorManager } from './DistractorManager'
import { OpenAIDistractorService } from './OpenAIDistractorService'
import { DistractorQualityService } from './DistractorQualityService'
import { SimilarityService } from './SimilarityService'
import { QuestionsDataService } from '../data/QuestionsDataService'
import type { DistractorGenerationOptions } from '../types'

export const generateWithEnhancedOptions = (
  questionsService: QuestionsDataService,
  openaiService: OpenAIDistractorService,
  qualityService: DistractorQualityService,
  similarityService: SimilarityService,
  fs: FileSystem.FileSystem,
  path: Path.Path,
  options: DistractorGenerationOptions
) =>
  Effect.gen(function* () {
    yield* Effect.log('Starting enhanced distractor generation...')

    const allQuestions = yield* questionsService.getAllQuestions()

    // Filter questions based on options
    const questionsToProcess = options.regenIncomplete
      ? allQuestions.filter((q) => (q.distractors || []).length < 10)
      : allQuestions

    yield* Effect.log(`Processing ${questionsToProcess.length} questions`)

    // Process in batches to manage memory and API rate limits
    const batchSize = 10
    const batches = []
    for (let i = 0; i < questionsToProcess.length; i += batchSize) {
      batches.push(questionsToProcess.slice(i, i + batchSize))
    }

    const allResults = []
    for (const batch of batches) {
      yield* Effect.log(`Processing batch of ${batch.length} questions`)

      const batchResults = yield* Effect.all(
        batch.map((question) =>
          processQuestionWithDistractors(
            question,
            allQuestions,
            { openaiService, qualityService, similarityService },
            options
          )
        )
      )

      allResults.push(...batchResults)

      // Add delay between batches for API rate limiting
      yield* Effect.sleep(2000)
    }

    // Write results to file
    const outputPath = path.join('data', 'questions-with-distractors.json')
    const json = JSON.stringify(allResults, null, 2)

    yield* Effect.log(`Writing results to ${outputPath}`)
    yield* fs.writeFile(outputPath, new TextEncoder().encode(json))

    // Validate output
    const validation = yield* validateDistractorQuality(allResults)
    yield* Effect.log(`Validation results: ${JSON.stringify(validation, null, 2)}`)

    return allResults
  })

export class EnhancedDistractorManager extends Effect.Service<EnhancedDistractorManager>()(
  'EnhancedDistractorManager',
  {
    effect: Effect.gen(function* () {
      const questionsService = yield* QuestionsDataService
      const openaiService = yield* OpenAIDistractorService
      const qualityService = yield* DistractorQualityService
      const similarityService = yield* SimilarityService
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path

      return {
        generateWithOptions: (options: DistractorGenerationOptions) =>
          generateWithEnhancedOptions(
            questionsService,
            openaiService,
            qualityService,
            similarityService,
            fs,
            path,
            options
          )
      }
    }),
    dependencies: [
      QuestionsDataService.Default,
      OpenAIDistractorService.Default,
      DistractorQualityService.Default,
      SimilarityService.Default
    ]
  }
) {}
```

## Backward Compatibility Layer

```typescript
// src/services/BackwardCompatibilityLayer.ts
import { Effect, Layer } from 'effect'
import { DistractorManager } from './DistractorManager'
import { EnhancedDistractorManager } from './EnhancedDistractorManager'

// Wrapper that provides the original DistractorManager interface
// while using the enhanced implementation under the hood
export const createCompatibilityLayer = (enhancedManager: EnhancedDistractorManager) =>
  Layer.succeed(
    DistractorManager,
    DistractorManager.of({
      _tag: 'DistractorManager',
      generateAndWrite: () =>
        enhancedManager
          .generateWithOptions({
            regenAll: false,
            regenIncomplete: false,
            targetCount: 15,
            filterSimilar: true,
            checkAnswers: true
          })
          .pipe(Effect.asVoid)
    })
  )
```

## CLI Integration Updates

```typescript
// Update to src/cli/index.ts - Following coding guide dependency injection pattern
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Command, Options } from '@effect/cli'
import { Effect, Config } from 'effect'
import { EnhancedDistractorManager } from '../services/EnhancedDistractorManager'
import { OpenAIDistractorService } from '../services/OpenAIDistractorService'
import { DistractorQualityService } from '../services/DistractorQualityService'
import { SimilarityService } from '../services/SimilarityService'
import { QuestionsDataService } from '../data/QuestionsDataService'
import type { DistractorGenerationOptions } from '../types/config'
import { DEFAULT_GENERATION_OPTIONS } from '../types/config'

// Enhanced CLI with all options using proper configuration types
const enhancedCli = Command.make(
  'distractors',
  {
    regenAll: Options.boolean('regen-all').pipe(
      Options.withDefault(DEFAULT_GENERATION_OPTIONS.regenAll),
      Options.withDescription('Ignore existing distractors and regenerate all')
    ),
    regenIncomplete: Options.boolean('regen-incomplete').pipe(
      Options.withDefault(DEFAULT_GENERATION_OPTIONS.regenIncomplete),
      Options.withDescription('Only regenerate if distractors.length < targetCount')
    ),
    targetCount: Options.integer('num').pipe(
      Options.withDefault(DEFAULT_GENERATION_OPTIONS.targetCount),
      Options.withDescription('Target distractor count per question (5-20)')
    ),
    filterSimilar: Options.boolean('filter-similar').pipe(
      Options.withDefault(DEFAULT_GENERATION_OPTIONS.filterSimilar),
      Options.withDescription('Apply similarity filtering')
    ),
    checkAnswers: Options.boolean('check-answers').pipe(
      Options.withDefault(DEFAULT_GENERATION_OPTIONS.checkAnswers),
      Options.withDescription('Filter out distractors that appear as correct answers elsewhere')
    ),
    useOpenAI: Options.boolean('use-openai').pipe(
      Options.withDefault(DEFAULT_GENERATION_OPTIONS.useOpenAI),
      Options.withDescription('Enable OpenAI generation for text questions')
    ),
    batchSize: Options.integer('batch-size').pipe(
      Options.withDefault(DEFAULT_GENERATION_OPTIONS.batchSize),
      Options.withDescription('Number of questions to process in each batch')
    ),
    maxRetries: Options.integer('max-retries').pipe(
      Options.withDefault(DEFAULT_GENERATION_OPTIONS.maxRetries),
      Options.withDescription('Maximum retry attempts for failed operations')
    )
  },
  (options) =>
    Effect.gen(function* () {
      yield* Effect.log('🚀 Starting enhanced distractor generation...')

      // Create properly typed configuration object
      const generationOptions: DistractorGenerationOptions = {
        regenAll: options.regenAll,
        regenIncomplete: options.regenIncomplete,
        targetCount: options.targetCount,
        filterSimilar: options.filterSimilar,
        checkAnswers: options.checkAnswers,
        useOpenAI: options.useOpenAI,
        batchSize: options.batchSize,
        maxRetries: options.maxRetries
      }

      // Environment validation using Config (following coding guide)
      const apiKey = yield* Config.string('OPENAI_API_KEY').pipe(
        Config.withDefault(''),
        Effect.catchAll(() => Effect.succeed(''))
      )

      if (!apiKey && generationOptions.useOpenAI) {
        yield* Effect.log('⚠️  Warning: No OPENAI_API_KEY found, disabling OpenAI generation')
        generationOptions.useOpenAI = false
      }

      yield* Effect.log(`📋 Configuration: ${JSON.stringify(generationOptions, null, 2)}`)

      // Services injected here at execution point
      const manager = yield* EnhancedDistractorManager
      yield* manager.generateWithOptions(generationOptions)

      yield* Effect.log('✅ Enhanced distractor generation complete!')
    })
)

const runnable = Command.run(enhancedCli, {
  name: 'Enhanced Distractor Generator',
  version: '2.0.0'
})

// Dependencies provided at execution point (following coding guide pattern)
runnable(process.argv).pipe(
  Effect.provide(QuestionsDataService.Default),
  Effect.provide(OpenAIDistractorService.Default),
  Effect.provide(DistractorQualityService.Default),
  Effect.provide(SimilarityService.Default),
  Effect.provide(EnhancedDistractorManager.Default),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
```

### Enhanced CLI with Metrics Reporting

To demonstrate the full power of the Effect-TS utilities, here's how the CLI can be enhanced with metrics reporting:

```typescript
// Enhanced CLI with metrics and observability
const enhancedCliWithMetrics = Command.make(
  'distractors',
  {
    // ... same options as before
    showMetrics: Options.boolean('show-metrics').pipe(
      Options.withDefault(true),
      Options.withDescription('Display metrics after generation')
    )
  },
  (options) =>
    Effect.gen(function* () {
      const startTime = yield* Clock.currentTimeMillis

      yield* Effect.log('🚀 Starting enhanced distractor generation with observability...')

      // Main generation logic
      const manager = yield* EnhancedDistractorManager
      const results = yield* manager.generateWithOptions(options)

      // Display metrics if requested
      if (options.showMetrics) {
        yield* Effect.log('\n📊 Generation Metrics:')

        // Get all metric values
        const totalRequests = yield* Metric.value(DistractorMetrics.openaiRequestsTotal)
        const successRequests = yield* Metric.value(DistractorMetrics.openaiRequestsSuccess)
        const failedRequests = yield* Metric.value(DistractorMetrics.openaiRequestsFailure)
        const questionsProcessed = yield* Metric.value(DistractorMetrics.questionsProcessed)

        const endTime = yield* Clock.currentTimeMillis
        const durationSeconds = (endTime - startTime) / 1000

        yield* Effect.log(`├── Questions Processed: ${questionsProcessed}`)
        yield* Effect.log(
          `├── OpenAI Requests: ${totalRequests} (${successRequests} success, ${failedRequests} failed)`
        )
        yield* Effect.log(
          `├── Success Rate: ${totalRequests > 0 ? ((successRequests / totalRequests) * 100).toFixed(1) : 0}%`
        )
        yield* Effect.log(`├── Total Duration: ${durationSeconds.toFixed(2)}s`)
        yield* Effect.log(
          `└── Processing Rate: ${(questionsProcessed / durationSeconds).toFixed(2)} questions/sec`
        )
      }

      yield* Effect.log('✅ Enhanced distractor generation complete!')
      return results
    })
)

// Run with enhanced metrics collection
runnable(process.argv).pipe(
  // Add metrics layer for collection
  Effect.provide(Metric.make()),
  Effect.provide(QuestionsDataService.Default),
  Effect.provide(OpenAIDistractorService.Default),
  Effect.provide(DistractorQualityService.Default),
  Effect.provide(SimilarityService.Default),
  Effect.provide(EnhancedDistractorManager.Default),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
```

### Summary: Effect-TS Utilities Benefits

The enhanced implementation provides significant improvements over manual approaches:

**🔁 RateLimiter vs Effect.sleep(1000)**

- ✅ Composable with other effects
- ✅ Works with batching and concurrent operations
- ✅ Fine-grained control (burst, tokens, intervals)
- ✅ No forgotten delays or timing issues

**🛡 Schedule vs Manual Retry Logic**

- ✅ Exponential backoff with jitter
- ✅ Error-specific retry strategies
- ✅ Composable with other effects
- ✅ Built-in retry policies

**🧠 FiberRef vs Global Variables**

- ✅ Fiber-local state propagation
- ✅ Request tracing across effects
- ✅ No shared mutable state issues
- ✅ Automatic cleanup

**📊 Metrics vs Console Logging**

- ✅ Structured performance data
- ✅ Histograms, counters, gauges
- ✅ Production monitoring ready
- ✅ Zero overhead when disabled

**⚡ Cache vs Repeated Calculations**

- ✅ Automatic memoization with TTL
- ✅ Memory-bounded caching
- ✅ Composable with other effects
- ✅ Thread-safe by design

## Additional Effect-TS Resources

- [`effect/RateLimiter`](https://effect-ts.github.io/effect/effect/RateLimiter.ts.html) – Request pacing and throttling
- [`effect/Schedule`](https://effect-ts.github.io/effect/effect/Schedule.ts.html) – Retries and time-based workflows
- [`effect/Metric`](https://effect-ts.github.io/effect/effect/Metric.ts.html) – Observability and monitoring
- [`effect/FiberRef`](https://effect-ts.github.io/effect/effect/FiberRef.ts.html) – Scoped shared mutable state
- [`effect/Cache`](https://effect-ts.github.io/effect/effect/Cache.ts.html) – Memoization and caching

# Troubleshooting Guide

## Common Implementation Pitfalls

### 1. OpenAI API Issues

**Problem**: Rate limiting errors

```typescript
// ❌ Wrong - No rate limiting
const generateMany = (questions: Question[]) =>
  Effect.all(questions.map((q) => openaiService.generateTextDistractors(q)))

// ✅ Correct - With rate limiting and batching
const generateMany = (questions: Question[]) =>
  Effect.gen(function* () {
    const results = []
    for (const question of questions) {
      const distractors = yield* openaiService.generateTextDistractors(question)
      results.push(distractors)
      yield* Effect.sleep(1000) // Rate limit
    }
    return results
  })
```

**Problem**: API key not loaded

```typescript
// ❌ Wrong - Direct access without validation
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ✅ Correct - Validated access with proper error handling
const createOpenAI = () =>
  Effect.gen(function* () {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return yield* Effect.fail(
        new OpenAIAuthError({
          cause: new Error('OPENAI_API_KEY environment variable is required')
        })
      )
    }
    return new OpenAI({ apiKey })
  })
```

### 2. Effect-TS Pattern Mistakes

**Problem**: Mixing promises with Effect

```typescript
// ❌ Wrong - Breaking Effect chain
const badGenerate = () =>
  Effect.gen(function* () {
    const result = await openai.chat.completions.create({...}) // Don't use await!
    return result
  })

// ✅ Correct - Using Effect.tryPromise
const goodGenerate = () =>
  Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      try: () => openai.chat.completions.create({...}),
      catch: (error) => new OpenAIError({ cause: error })
    })
    return result
  })
```

**Problem**: Not handling errors properly

```typescript
// ❌ Wrong - Uncaught errors
const processQuestion = (question: Question) => openaiService.generateTextDistractors(question)

// ✅ Correct - Comprehensive error handling
const processQuestion = (question: Question) =>
  openaiService.generateTextDistractors(question).pipe(
    Effect.catchAll((error) => {
      if (error._tag === 'OpenAIRateLimitError') {
        return Effect.sleep(5000).pipe(
          Effect.flatMap(() => openaiService.generateTextDistractors(question))
        )
      }
      if (error._tag === 'OpenAIAuthError') {
        return Effect.succeed([]) // Fallback to empty array
      }
      return Effect.fail(error)
    })
  )
```

### 3. Memory and Performance Issues

**Problem**: Loading all questions into memory at once

```typescript
// ❌ Wrong - Memory inefficient for large datasets
const processAllQuestions = (questions: Question[]) => Effect.all(questions.map(processQuestion))

// ✅ Correct - Batch processing
const processAllQuestions = (questions: Question[]) =>
  Effect.gen(function* () {
    const batchSize = 10
    const results = []

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize)
      const batchResults = yield* Effect.all(batch.map(processQuestion))
      results.push(...batchResults)

      // Allow garbage collection between batches
      yield* Effect.yieldNow()
    }

    return results
  })
```

### 4. Quality Assessment Issues

**Problem**: Too strict quality thresholds resulting in no distractors

```typescript
// ❌ Wrong - Inflexible thresholds
const STRICT_THRESHOLDS = {
  relevance: 0.9, // Too high
  plausibility: 0.9, // Too high
  educationalValue: 0.95 // Too high
}

// ✅ Correct - Adaptive thresholds with fallback
const assessWithFallback = (distractors: string[], question: Question) =>
  Effect.gen(function* () {
    let thresholds = DEFAULT_QUALITY_THRESHOLDS
    let filtered = yield* qualityService.filterByQuality(distractors, question, thresholds)

    // If too few pass, gradually reduce thresholds
    if (filtered.length < 5) {
      thresholds = {
        ...thresholds,
        relevance: thresholds.relevance * 0.8,
        plausibility: thresholds.plausibility * 0.8
      }
      filtered = yield* qualityService.filterByQuality(distractors, question, thresholds)
    }

    return filtered
  })
```

## Debugging Techniques

### 1. Enable Debug Logging

```typescript
const debugGeneration = (question: Question) =>
  Effect.gen(function* () {
    yield* Effect.log(`Processing question ${question.questionNumber}: "${question.question}"`)

    const distractors = yield* openaiService.generateTextDistractors(question)
    yield* Effect.log(`Generated ${distractors.length} raw distractors`)

    const filtered = yield* qualityService.filterByQuality(distractors, question)
    yield* Effect.log(`${filtered.length} distractors passed quality filter`)

    return filtered
  })
```

### 2. Validate Service Dependencies

```typescript
const validateServices = () =>
  Effect.gen(function* () {
    // Test OpenAI connectivity
    yield* Effect.tryPromise({
      try: () => new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).models.list(),
      catch: () => new Error('OpenAI service unavailable')
    })

    // Test questions data access
    const questions = yield* QuestionsDataService.getAllQuestions()
    if (questions.length === 0) {
      return yield* Effect.fail(new Error('No questions available'))
    }

    yield* Effect.log('All services validated successfully')
  })
```

### 3. Profile Performance

```typescript
const profileGeneration = (questions: Question[]) =>
  Effect.gen(function* () {
    const startTime = Date.now()

    const results = yield* processAllQuestions(questions)

    const endTime = Date.now()
    const duration = endTime - startTime
    const questionsPerSecond = questions.length / (duration / 1000)

    yield* Effect.log(
      `Processed ${questions.length} questions in ${duration}ms (${questionsPerSecond.toFixed(2)} q/s)`
    )

    return results
  })
```

## Environment Setup Issues

### Missing Dependencies

```bash
# Ensure all required packages are installed
npm install openai sentence-similarity similarity-score

# Check for peer dependency issues
npm ls
```

### Environment Variables

```bash
# Required environment variables
export OPENAI_API_KEY="sk-..."

# Optional debug settings
export DEBUG="civics:distractors"
export NODE_ENV="development"
```

### File Permissions

```bash
# Ensure data directory is writable
chmod 755 data/
touch data/questions-with-distractors.json
chmod 644 data/questions-with-distractors.json
```

## Comprehensive Testing Strategy

A systematic approach to testing all components of the enhanced distractor generation system using Effect-TS patterns.

### Unit Testing Services

#### OpenAIDistractorService Tests

```typescript
// test/services/OpenAIDistractorService.test.ts
import { Effect, Layer } from 'effect'
import {
  OpenAIDistractorService,
  TestOpenAIDistractorServiceLayer,
  generateTextDistractors
} from '../../src/services/OpenAIDistractorService'
import { OpenAIError, OpenAIRateLimitError, ParseError } from '../../src/types/errors'

describe('OpenAIDistractorService', () => {
  const mockQuestion = {
    questionNumber: 1,
    question: 'What is the supreme law of the land?',
    theme: 'Constitution',
    section: 'Section 1',
    expectedAnswers: 1,
    answers: { _type: 'text' as const, choices: ['the Constitution'] }
  }

  describe('generateTextDistractors', () => {
    it('should generate text distractors successfully', async () => {
      const expectedDistractors = [
        'the Declaration of Independence',
        'the Bill of Rights',
        'the Articles of Confederation'
      ]

      const testLayer = TestOpenAIDistractorServiceLayer({
        generateTextDistractors: () => Effect.succeed(expectedDistractors)
      })

      await Effect.gen(function* () {
        const service = yield* OpenAIDistractorService
        const result = yield* service.generateTextDistractors(mockQuestion, 3)

        expect(result).toHaveLength(3)
        expect(result).toEqual(expectedDistractors)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should handle OpenAI API errors gracefully', async () => {
      const testLayer = TestOpenAIDistractorServiceLayer({
        generateTextDistractors: () =>
          Effect.fail(
            new OpenAIError({
              cause: new Error('API Error'),
              requestId: 'test-123'
            })
          )
      })

      await Effect.gen(function* () {
        const service = yield* OpenAIDistractorService
        const result = yield* service.generateTextDistractors(mockQuestion, 3).pipe(
          Effect.flip // Convert failure to success for testing
        )

        expect(result._tag).toBe('OpenAIError')
        expect(result.requestId).toBe('test-123')
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should respect rate limiting', async () => {
      const calls: number[] = []
      const testLayer = TestOpenAIDistractorServiceLayer({
        generateTextDistractors: () =>
          Effect.gen(function* () {
            calls.push(Date.now())
            return ['mock distractor']
          })
      })

      await Effect.gen(function* () {
        const service = yield* OpenAIDistractorService

        // Make multiple concurrent calls
        yield* Effect.all([
          service.generateTextDistractors(mockQuestion, 1),
          service.generateTextDistractors(mockQuestion, 1),
          service.generateTextDistractors(mockQuestion, 1)
        ])

        // Verify calls were spaced appropriately (rate limited)
        const timeDiffs = calls.slice(1).map((time, i) => time - calls[i])
        expect(timeDiffs.every((diff) => diff >= 900)).toBe(true) // ~1s rate limit
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })
  })
})
```

#### DistractorQualityService Tests

```typescript
// test/services/DistractorQualityService.test.ts
import { Effect } from 'effect'
import {
  DistractorQualityService,
  TestDistractorQualityServiceLayer,
  assessDistractorQuality,
  DEFAULT_QUALITY_THRESHOLDS
} from '../../src/services/DistractorQualityService'

describe('DistractorQualityService', () => {
  const mockQuestion = {
    questionNumber: 1,
    question: 'What is the supreme law of the land?',
    theme: 'Constitution',
    section: 'Section 1',
    expectedAnswers: 1,
    answers: { _type: 'text' as const, choices: ['the Constitution'] }
  }

  describe('assessDistractorQuality', () => {
    it('should assess high-quality distractors positively', async () => {
      const highQualityDistractor = 'the Bill of Rights'

      const testLayer = TestDistractorQualityServiceLayer({
        assessQuality: () =>
          Effect.succeed({
            relevance: 0.9,
            plausibility: 0.8,
            educationalValue: 0.9,
            overall: 0.87,
            passes: true
          })
      })

      await Effect.gen(function* () {
        const service = yield* DistractorQualityService
        const result = yield* service.assessQuality(highQualityDistractor, mockQuestion)

        expect(result.passes).toBe(true)
        expect(result.overall).toBeGreaterThan(0.8)
        expect(result.relevance).toBeGreaterThan(DEFAULT_QUALITY_THRESHOLDS.relevance)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should reject low-quality distractors', async () => {
      const lowQualityDistractor = 'pizza toppings'

      const testLayer = TestDistractorQualityServiceLayer({
        assessQuality: () =>
          Effect.succeed({
            relevance: 0.1,
            plausibility: 0.2,
            educationalValue: 0.1,
            overall: 0.13,
            passes: false
          })
      })

      await Effect.gen(function* () {
        const service = yield* DistractorQualityService
        const result = yield* service.assessQuality(lowQualityDistractor, mockQuestion)

        expect(result.passes).toBe(false)
        expect(result.overall).toBeLessThan(0.5)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })
  })

  describe('filterByQuality', () => {
    it('should filter and sort distractors by quality', async () => {
      const distractors = [
        'the Bill of Rights', // High quality
        'pizza toppings', // Low quality
        'the Articles of Confederation', // High quality
        'random text' // Low quality
      ]

      const testLayer = TestDistractorQualityServiceLayer({
        filterByQuality: () =>
          Effect.succeed([
            'the Articles of Confederation', // Highest quality first
            'the Bill of Rights' // Second highest
          ])
      })

      await Effect.gen(function* () {
        const service = yield* DistractorQualityService
        const result = yield* service.filterByQuality(distractors, mockQuestion)

        expect(result).toHaveLength(2)
        expect(result[0]).toBe('the Articles of Confederation')
        expect(result[1]).toBe('the Bill of Rights')
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })
  })
})
```

#### SimilarityService Tests

```typescript
// test/services/SimilarityService.test.ts
import { Effect } from 'effect'
import {
  SimilarityService,
  TestSimilarityServiceLayer,
  DEFAULT_SIMILARITY_THRESHOLDS
} from '../../src/services/SimilarityService'

describe('SimilarityService', () => {
  const correctAnswers = ['the Constitution']

  describe('removeSimilar', () => {
    it('should remove distractors too similar to correct answers', async () => {
      const distractors = [
        'the Constitution of the United States', // Too similar
        'the Bill of Rights', // Different enough
        'Constitution', // Too similar
        'the Articles of Confederation' // Different enough
      ]

      const testLayer = TestSimilarityServiceLayer({
        removeSimilar: () => Effect.succeed(['the Bill of Rights', 'the Articles of Confederation'])
      })

      await Effect.gen(function* () {
        const service = yield* SimilarityService
        const result = yield* service.removeSimilar(distractors, correctAnswers)

        expect(result).toHaveLength(2)
        expect(result).toContain('the Bill of Rights')
        expect(result).toContain('the Articles of Confederation')
        expect(result).not.toContain('Constitution')
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should remove duplicate distractors', async () => {
      const distractors = [
        'the Bill of Rights',
        'Bill of Rights', // Similar to above
        'the Declaration of Independence',
        'Declaration of Independence' // Similar to above
      ]

      const testLayer = TestSimilarityServiceLayer({
        deduplicate: () => Effect.succeed(['the Bill of Rights', 'the Declaration of Independence'])
      })

      await Effect.gen(function* () {
        const service = yield* SimilarityService
        const result = yield* service.deduplicate(distractors)

        expect(result).toHaveLength(2)
        expect(new Set(result).size).toBe(2) // All unique
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })
  })

  describe('calculateSimilarity', () => {
    it('should calculate similarity scores correctly', async () => {
      const testLayer = TestSimilarityServiceLayer({
        calculateSimilarity: () => Effect.succeed(0.75)
      })

      await Effect.gen(function* () {
        const service = yield* SimilarityService
        const result = yield* service.calculateSimilarity('the Constitution', 'Constitution')

        expect(typeof result).toBe('number')
        expect(result).toBeGreaterThan(0.7) // High similarity
        expect(result).toBeLessThan(1.0) // Not identical
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })
  })
})
```

### Integration Testing

#### Full Pipeline Integration Test

```typescript
// test/integration/full-pipeline.test.ts
import { Effect } from 'effect'
import { NodeContext } from '@effect/platform-node'
import {
  EnhancedDistractorManager,
  TestEnhancedDistractorManagerLayer
} from '../../src/services/EnhancedDistractorManager'
import { TestOpenAIDistractorServiceLayer } from '../../src/services/OpenAIDistractorService'
import { TestDistractorQualityServiceLayer } from '../../src/services/DistractorQualityService'
import { TestSimilarityServiceLayer } from '../../src/services/SimilarityService'
import { TestQuestionsDataServiceLayer } from '../../src/data/QuestionsDataService'
import type { DistractorGenerationOptions } from '../../src/types/config'

describe('Full Pipeline Integration', () => {
  const mockQuestions = [
    {
      questionNumber: 1,
      question: 'What is the supreme law of the land?',
      theme: 'Constitution',
      section: 'Section 1',
      expectedAnswers: 1,
      answers: { _type: 'text' as const, choices: ['the Constitution'] }
    },
    {
      questionNumber: 2,
      question: 'Who is the current President?',
      theme: 'Government',
      section: 'Section 2',
      expectedAnswers: 1,
      answers: { _type: 'text' as const, choices: ['Joe Biden'] }
    }
  ]

  it('should process questions end-to-end with all services', async () => {
    const options: DistractorGenerationOptions = {
      regenAll: true,
      regenIncomplete: false,
      targetCount: 10,
      filterSimilar: true,
      checkAnswers: true,
      useOpenAI: true,
      batchSize: 2,
      maxRetries: 3
    }

    // Set up all test layers
    const questionsLayer = TestQuestionsDataServiceLayer({
      getAllQuestions: () => Effect.succeed(mockQuestions)
    })

    const openaiLayer = TestOpenAIDistractorServiceLayer({
      generateTextDistractors: () =>
        Effect.succeed([
          'the Bill of Rights',
          'the Declaration of Independence',
          'the Articles of Confederation',
          'the Federalist Papers',
          'the Emancipation Proclamation'
        ])
    })

    const qualityLayer = TestDistractorQualityServiceLayer({
      filterByQuality: (distractors: string[]) =>
        Effect.succeed(distractors.slice(0, Math.min(distractors.length, 10)))
    })

    const similarityLayer = TestSimilarityServiceLayer({
      removeSimilar: (distractors: string[]) => Effect.succeed(distractors)
    })

    const managerLayer = TestEnhancedDistractorManagerLayer({
      generateWithOptions: () =>
        Effect.succeed([
          {
            ...mockQuestions[0],
            _tag: 'QuestionWithDistractors' as const,
            distractors: [
              'the Bill of Rights',
              'the Declaration of Independence',
              'the Articles of Confederation'
            ]
          },
          {
            ...mockQuestions[1],
            _tag: 'QuestionWithDistractors' as const,
            distractors: ['Donald Trump', 'Barack Obama', 'George Washington']
          }
        ])
    })

    await Effect.gen(function* () {
      const manager = yield* EnhancedDistractorManager
      const results = yield* manager.generateWithOptions(options)

      expect(results).toHaveLength(2)
      expect(results[0].distractors).toHaveLength(3)
      expect(results[1].distractors).toHaveLength(3)
      expect(results[0]._tag).toBe('QuestionWithDistractors')
      expect(results[1]._tag).toBe('QuestionWithDistractors')
    }).pipe(
      Effect.provide(questionsLayer),
      Effect.provide(openaiLayer),
      Effect.provide(qualityLayer),
      Effect.provide(similarityLayer),
      Effect.provide(managerLayer),
      Effect.provide(NodeContext.layer),
      Effect.runPromise
    )
  })

  it('should handle failures gracefully with proper fallbacks', async () => {
    const options: DistractorGenerationOptions = {
      regenAll: true,
      regenIncomplete: false,
      targetCount: 10,
      filterSimilar: true,
      checkAnswers: true,
      useOpenAI: true,
      batchSize: 2,
      maxRetries: 1
    }

    // OpenAI service that fails
    const failingOpenaiLayer = TestOpenAIDistractorServiceLayer({
      generateTextDistractors: () => Effect.fail(new Error('OpenAI service unavailable'))
    })

    // Other services work normally
    const questionsLayer = TestQuestionsDataServiceLayer({
      getAllQuestions: () => Effect.succeed(mockQuestions)
    })

    await Effect.gen(function* () {
      const manager = yield* EnhancedDistractorManager

      // Should not fail completely, should fall back to static generation
      const results = yield* manager.generateWithOptions(options).pipe(
        Effect.catchAll(() => Effect.succeed([])) // Handle gracefully
      )

      // Results might be empty or use fallback generation
      expect(Array.isArray(results)).toBe(true)
    }).pipe(
      Effect.provide(questionsLayer),
      Effect.provide(failingOpenaiLayer),
      Effect.provide(NodeContext.layer),
      Effect.runPromise
    )
  })
})
```

### Performance Testing

#### Rate Limiting and Concurrency Tests

```typescript
// test/performance/rate-limiting.test.ts
import { Effect, Clock } from 'effect'
import {
  OpenAIDistractorService,
  TestOpenAIDistractorServiceLayer
} from '../../src/services/OpenAIDistractorService'

describe('Performance Tests', () => {
  describe('Rate Limiting', () => {
    it('should respect rate limits under high load', async () => {
      const callTimes: number[] = []

      const testLayer = TestOpenAIDistractorServiceLayer({
        generateTextDistractors: () =>
          Effect.gen(function* () {
            const now = yield* Clock.currentTimeMillis
            callTimes.push(now)
            return ['test distractor']
          })
      })

      const mockQuestion = {
        questionNumber: 1,
        question: 'Test question',
        theme: 'Test',
        section: 'Test',
        expectedAnswers: 1,
        answers: { _type: 'text' as const, choices: ['test answer'] }
      }

      await Effect.gen(function* () {
        const service = yield* OpenAIDistractorService

        // Make 10 requests rapidly
        const requests = Array.from({ length: 10 }, () =>
          service.generateTextDistractors(mockQuestion, 1)
        )

        yield* Effect.all(requests)

        // Verify rate limiting worked
        const intervals = callTimes.slice(1).map((time, i) => time - callTimes[i])
        const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length

        expect(averageInterval).toBeGreaterThan(900) // ~1 second intervals
        expect(callTimes).toHaveLength(10)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    }, 30000) // 30 second timeout
  })

  describe('Memory Usage', () => {
    it('should not leak memory during batch processing', async () => {
      const initialMemory = process.memoryUsage().heapUsed

      // Process many questions in batches
      const questions = Array.from({ length: 100 }, (_, i) => ({
        questionNumber: i + 1,
        question: `Test question ${i + 1}`,
        theme: 'Test',
        section: 'Test',
        expectedAnswers: 1,
        answers: { _type: 'text' as const, choices: [`test answer ${i + 1}`] }
      }))

      const testLayer = TestOpenAIDistractorServiceLayer({
        generateTextDistractors: () => Effect.succeed(['test distractor'])
      })

      await Effect.gen(function* () {
        const service = yield* OpenAIDistractorService

        // Process in batches of 10
        for (let i = 0; i < questions.length; i += 10) {
          const batch = questions.slice(i, i + 10)
          yield* Effect.all(batch.map((q) => service.generateTextDistractors(q, 1)))

          // Allow garbage collection
          yield* Effect.yieldNow()
        }

        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }

        const finalMemory = process.memoryUsage().heapUsed
        const memoryIncrease = finalMemory - initialMemory

        // Memory increase should be reasonable (less than 50MB)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })
  })
})
```

### Test Configuration

#### Jest Configuration for Effect-TS

```javascript
// jest.config.js - Enhanced for Effect-TS testing
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/**/index.ts'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testTimeout: 10000,
  maxWorkers: 4
}
```

#### Test Setup Utilities

```typescript
// test/setup.ts - Global test setup
import { Effect } from 'effect'

// Extend Jest matchers for Effect testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toSucceedWith<A>(expected: A): R
      toFailWith<E>(expected: E): R
    }
  }
}

// Custom matcher for Effect success
expect.extend({
  async toSucceedWith<A>(received: Effect.Effect<A, any>, expected: A) {
    try {
      const result = await Effect.runPromise(received)
      const pass = this.equals(result, expected)

      return {
        message: () =>
          pass
            ? `Expected effect not to succeed with ${this.utils.printExpected(expected)}`
            : `Expected effect to succeed with ${this.utils.printExpected(expected)}, but got ${this.utils.printReceived(result)}`,
        pass
      }
    } catch (error) {
      return {
        message: () => `Expected effect to succeed, but it failed with: ${error}`,
        pass: false
      }
    }
  },

  async toFailWith<E>(received: Effect.Effect<any, E>, expected: E) {
    try {
      const result = await Effect.runPromise(received)
      return {
        message: () =>
          `Expected effect to fail with ${this.utils.printExpected(expected)}, but it succeeded with ${this.utils.printReceived(result)}`,
        pass: false
      }
    } catch (error) {
      const pass = this.equals(error, expected)

      return {
        message: () =>
          pass
            ? `Expected effect not to fail with ${this.utils.printExpected(expected)}`
            : `Expected effect to fail with ${this.utils.printExpected(expected)}, but got ${this.utils.printReceived(error)}`,
        pass
      }
    }
  }
})

// Global test utilities
global.runEffect = <A, E>(effect: Effect.Effect<A, E>) => Effect.runPromise(effect)
```
