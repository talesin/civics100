# OpenAI API Guide

Patterns for integrating OpenAI API with Effect-TS in this project.

## Table of Contents

- [Overview](#overview)
- [Client Setup](#client-setup)
- [Chat Completions](#chat-completions)
- [Structured Outputs](#structured-outputs)
- [Error Handling](#error-handling)
- [Configuration](#configuration)
- [Rate Limiting](#rate-limiting)
- [Caching](#caching)
- [Testing](#testing)
- [Anti-Patterns](#anti-patterns)
- [Quick Reference](#quick-reference)

---

## Overview

This project uses the official `openai` npm package wrapped with Effect-TS patterns for:

- **Type-safe error handling** via tagged errors
- **Dependency injection** through Effect services
- **Rate limiting** using Effect's RateLimiter
- **Response caching** using Effect's Ref
- **Configuration** via Effect Config

---

## Client Setup

### Creating the OpenAI Client

Use a curried function to inject configuration at runtime:

```typescript
import { Effect } from 'effect'
import OpenAI from 'openai'
import { openaiApiKeyConfig, openaiTimeoutConfig } from '@src/config/environment'

const createOpenAIClient = () =>
  Effect.fn(function* () {
    const apiKey = yield* openaiApiKeyConfig
    const timeout = yield* openaiTimeoutConfig

    return new OpenAI({
      apiKey,
      timeout
    })
  })
```

### Configuration Validation

Validate API key format before making requests:

```typescript
import { ConfigurationError } from '@src/types/errors'

export const validateOpenAIConfig = () =>
  Effect.fn(function* () {
    const apiKey = yield* openaiApiKeyConfig

    if (apiKey === undefined || apiKey === null || apiKey.trim().length === 0) {
      return yield* Effect.fail(
        new ConfigurationError({
          cause: new Error('Missing API key'),
          setting: 'OPENAI_API_KEY',
          value: apiKey,
          reason: 'API key is required for OpenAI integration'
        })
      )
    }

    if (apiKey.startsWith('sk-') === false) {
      return yield* Effect.fail(
        new ConfigurationError({
          cause: new Error('Invalid API key format'),
          setting: 'OPENAI_API_KEY',
          value: '[REDACTED]',
          reason: 'OpenAI API keys should start with "sk-"'
        })
      )
    }

    return yield* Effect.succeed(undefined)
  })
```

---

## Chat Completions

### Basic API Call Pattern

Wrap OpenAI API calls with `Effect.tryPromise` and map errors:

```typescript
const completion = yield* Effect.tryPromise({
  try: () =>
    client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert assistant.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' }
    }),
  catch: (error) => mapOpenAIError(error)
})
```

### Building Prompts

Use helper functions to construct prompts based on context:

```typescript
const buildPrompt = (request: OpenAIRequest): string => {
  const baseInstructions = `Your task is to generate...

IMPORTANT REQUIREMENTS:
- Requirement 1
- Requirement 2

Question: ${request.question}
Context: ${request.context}`

  // Add type-specific guidance
  switch (request.answerType) {
    case 'text':
      return `${baseInstructions}\n\nFor text-based questions:\n- Guidance 1`
    case 'number':
      return `${baseInstructions}\n\nFor numeric questions:\n- Guidance 2`
    default:
      return baseInstructions
  }
}
```

---

## Structured Outputs

### Using JSON Schema (Recommended)

Use `json_schema` response format for **guaranteed** structured responses. This ensures responses match the exact schema with no markdown wrapping:

```typescript
const completion = yield* Effect.tryPromise({
  try: () =>
    client.chat.completions.create({
      model,
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'my_response',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['items'],
            additionalProperties: false
          }
        }
      }
    }),
  catch: (error) => mapOpenAIError(error)
})
```

**Benefits of `json_schema` over `json_object`:**
- Guarantees response matches schema exactly
- No markdown code block wrapping (` ```json ... ``` `)
- Type-safe parsing with known structure
- Works reliably with `gpt-4o-mini`

### Parsing Schema-Guaranteed Responses

With `json_schema`, parsing is simplified since structure is guaranteed:

```typescript
// Extract content from response
const content = completion.choices[0]?.message?.content
if (content === undefined || content === null || content === '') {
  return yield* Effect.fail(
    new OpenAIError({ cause: new Error('Empty response from OpenAI') })
  )
}

// Schema guarantees structure - direct type assertion is safe
const parsedResponse = yield* Effect.tryPromise({
  try: () => Promise.resolve(JSON.parse(content) as { items: string[] }),
  catch: () => new OpenAIError({ cause: new Error('Invalid JSON response') })
})

// Access guaranteed fields directly
const items = parsedResponse.items

// Filter and validate items
const validItems = items
  .filter((item): item is string => typeof item === 'string')
  .map((item) => item.trim())
  .filter((item) => item.length > 0)

if (validItems.length === 0) {
  return yield* Effect.fail(
    new OpenAIError({
      cause: new Error('No valid items found in response')
    })
  )
}
```

### Legacy: JSON Object Format

For simple JSON without strict schema validation (not recommended for production):

```typescript
const completion = yield* Effect.tryPromise({
  try: () =>
    client.chat.completions.create({
      model,
      messages,
      response_format: { type: 'json_object' }  // Less strict, may wrap in markdown
    }),
  catch: (error) => mapOpenAIError(error)
})
```

---

## Error Handling

### Tagged Error Definitions

Define specific error types for different failure modes:

```typescript
import { Data } from 'effect'

// General API error
export class OpenAIError extends Data.TaggedError('OpenAIError')<{
  readonly cause: unknown
  readonly requestId?: string
}> {}

// Rate limit exceeded (429)
export class OpenAIRateLimitError extends Data.TaggedError('OpenAIRateLimitError')<{
  readonly cause: unknown
  readonly retryAfter?: number
  readonly requestsRemaining?: number
}> {}

// Authentication failed (401)
export class OpenAIAuthError extends Data.TaggedError('OpenAIAuthError')<{
  readonly cause: unknown
  readonly message: string
}> {}

// Request timeout
export class OpenAITimeoutError extends Data.TaggedError('OpenAITimeoutError')<{
  readonly cause: unknown
  readonly timeoutMs: number
}> {}
```

### Error Mapping Pattern

Map OpenAI SDK errors to tagged errors:

```typescript
const completion = yield* Effect.tryPromise({
  try: () => client.chat.completions.create({...}),
  catch: (error) => {
    if (error instanceof Error) {
      // Rate limit error
      if (error.message.includes('rate limit')) {
        return new OpenAIRateLimitError({ cause: error })
      }
      // Authentication error
      if (error.message.includes('authentication') ||
          error.message.includes('invalid_api_key')) {
        return new OpenAIAuthError({
          cause: error,
          message: error.message ?? 'OpenAI authentication failed'
        })
      }
      // Timeout error
      if (error.message.includes('timeout')) {
        return new OpenAITimeoutError({ cause: error, timeoutMs: 30000 })
      }
    }
    // Default to general error
    return new OpenAIError({
      cause: error instanceof Error ? error : new Error(String(error))
    })
  }
})
```

### Error Recovery

Handle specific errors with `catchTag`:

```typescript
const result = yield* generateResponse(request).pipe(
  Effect.catchTag('OpenAIRateLimitError', (error) =>
    Effect.gen(function* () {
      yield* Effect.log(`Rate limited, retry after ${error.retryAfter}ms`)
      yield* Effect.sleep(Duration.millis(error.retryAfter ?? 1000))
      return yield* generateResponse(request)
    })
  ),
  Effect.catchTag('OpenAITimeoutError', () =>
    Effect.succeed({ items: [], confidence: 0, tokensUsed: 0 })
  )
)
```

### Error Classification Helpers

Categorize errors for retry logic:

```typescript
export const isRetryableError = (error: DistractorGenerationError): boolean => {
  switch (error._tag) {
    case 'OpenAIRateLimitError':
    case 'OpenAITimeoutError':
      return true
    case 'OpenAIAuthError':
    case 'ConfigurationError':
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
    case 'ConfigurationError':
      return 'critical'
    case 'OpenAIRateLimitError':
      return 'medium'
    default:
      return 'low'
  }
}
```

---

## Configuration

### Environment Variable Declarations

Use Effect Config for type-safe configuration:

```typescript
import { Config } from 'effect'

// Required
export const openaiApiKeyConfig = Config.string('OPENAI_API_KEY')

// Optional with defaults
export const openaiModelConfig = Config.string('OPENAI_MODEL').pipe(
  Config.withDefault('gpt-4o-mini')
)
export const openaiTemperatureConfig = Config.number('OPENAI_TEMPERATURE').pipe(
  Config.withDefault(0.7)
)
export const openaiMaxTokensConfig = Config.integer('OPENAI_MAX_TOKENS').pipe(
  Config.withDefault(1000)
)
export const openaiTimeoutConfig = Config.number('OPENAI_TIMEOUT_MS').pipe(
  Config.withDefault(30000)
)
export const openaiMaxRetriesConfig = Config.integer('OPENAI_MAX_RETRIES').pipe(
  Config.withDefault(3)
)
```

### Combined Configuration Object

Group related configuration:

```typescript
export const environmentConfig = Config.all({
  openaiApiKey: openaiApiKeyConfig,
  openaiModel: openaiModelConfig,
  openaiTemperature: openaiTemperatureConfig,
  openaiMaxTokens: openaiMaxTokensConfig,
  openaiTimeoutMs: openaiTimeoutConfig,
  openaiMaxRetries: openaiMaxRetriesConfig,
  openaiRateLimitRpm: openaiRateLimitRpmConfig,
  openaiCacheSize: openaiCacheSizeConfig,
  openaiCacheTTLHours: openaiCacheTTLHoursConfig
})

export type EnvironmentConfig = Config.Config.Success<typeof environmentConfig>
```

### Available Environment Variables

| Variable                 | Type    | Default       | Description                     |
| ------------------------ | ------- | ------------- | ------------------------------- |
| `OPENAI_API_KEY`         | string  | required      | API key (must start with `sk-`) |
| `OPENAI_MODEL`           | string  | `gpt-4o-mini` | Model to use                    |
| `OPENAI_TEMPERATURE`     | number  | `0.7`         | Response randomness (0-1)       |
| `OPENAI_MAX_TOKENS`      | integer | `1000`        | Max tokens in response          |
| `OPENAI_TIMEOUT_MS`      | number  | `30000`       | Request timeout in ms           |
| `OPENAI_MAX_RETRIES`     | integer | `3`           | Max retry attempts              |
| `OPENAI_RATE_LIMIT_RPM`  | number  | `60`          | Requests per minute             |
| `OPENAI_CACHE_SIZE`      | integer | `1000`        | Max cached responses            |
| `OPENAI_CACHE_TTL_HOURS` | number  | `24`          | Cache entry lifetime            |

---

## Rate Limiting

### Creating a Rate Limiter

Use Effect's RateLimiter module:

```typescript
import * as RateLimiter from 'effect/RateLimiter'
import * as Duration from 'effect/Duration'

export const createOpenAIRateLimiter = (requestsPerMinute: number = 60) =>
  RateLimiter.make({
    limit: requestsPerMinute,
    interval: Duration.minutes(1)
  })
```

### Wrapping Operations with Rate Limiting

```typescript
export const withRateLimit = <A, E, R>(
  limiter: RateLimiter.RateLimiter,
  operation: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> => limiter(operation)

// Usage
const rateLimiter = yield* createOpenAIRateLimiter(requestsPerMinute)
const rateLimitedAPICall = withRateLimit(
  rateLimiter,
  Effect.gen(function* () {
    const completion = yield* Effect.tryPromise({...})
    return completion
  })
)
return yield* rateLimitedAPICall
```

### Batch Processing with Rate Limiting

Process items sequentially to respect rate limits:

```typescript
export const rateLimitedBatch = <A, B, E>(
  limiter: RateLimiter.RateLimiter,
  items: readonly A[],
  operation: (item: A) => Effect.Effect<B, E>
): Effect.Effect<readonly B[], E> =>
  Effect.forEach(
    items,
    (item) => withRateLimit(limiter, operation(item)),
    { concurrency: 1 }  // Sequential to respect rate limits
  )
```

---

## Caching

### Cache Types

```typescript
interface CacheEntry<A> {
  value: A
  timestamp: number
}

export interface OpenAIResponseCache {
  readonly _tag: 'OpenAIResponseCache'
  readonly ref: Ref.Ref<Map<string, CacheEntry<OpenAIResponse>>>
  readonly maxSize: number
  readonly ttlMs: number
}
```

### Creating a Response Cache

```typescript
import * as Ref from 'effect/Ref'

export const createOpenAIResponseCache = (
  maxSize: number = 1000,
  ttlHours: number = 24
): Effect.Effect<OpenAIResponseCache> =>
  Effect.gen(function* () {
    const ref = yield* Ref.make(new Map<string, CacheEntry<OpenAIResponse>>())
    return {
      _tag: 'OpenAIResponseCache' as const,
      ref,
      maxSize,
      ttlMs: ttlHours * 60 * 60 * 1000
    }
  })
```

### Cache Key Generation

```typescript
export const generateOpenAICacheKey = (request: OpenAIRequest): string =>
  `openai-${request.answerType}-${request.question.slice(0, 30).replace(/\s+/g, '-')}-${request.targetCount}`
```

### Caching Responses

Cache-on-miss pattern with TTL and size eviction:

```typescript
export const cacheOpenAIResponse = <E>(
  cache: OpenAIResponseCache,
  request: OpenAIRequest,
  operation: Effect.Effect<OpenAIResponse, E>
): Effect.Effect<OpenAIResponse, E> =>
  Effect.gen(function* () {
    const key = generateOpenAICacheKey(request)
    const now = Date.now()
    const map = yield* Ref.get(cache.ref)
    const cached = map.get(key)

    // Return cached value if valid
    if (cached !== undefined &&
        now - cached.timestamp < cache.ttlMs &&
        cached.value.confidence > 0) {
      return cached.value
    }

    // Execute operation on cache miss
    const result = yield* operation

    // Store result with eviction logic
    yield* Ref.update(cache.ref, (currentMap) => {
      const newMap = new Map(currentMap)

      // Evict expired entries
      if (newMap.size >= cache.maxSize) {
        let oldestKey: string | undefined
        let oldestTime = Infinity
        for (const [k, v] of newMap) {
          if (now - v.timestamp >= cache.ttlMs) {
            newMap.delete(k)
          } else if (v.timestamp < oldestTime) {
            oldestTime = v.timestamp
            oldestKey = k
          }
        }
        if (newMap.size >= cache.maxSize && oldestKey !== undefined) {
          newMap.delete(oldestKey)
        }
      }

      newMap.set(key, { value: result, timestamp: now })
      return newMap
    })

    return result
  })
```

### Using Cache in Service

```typescript
export const generateDistractorsWithOpenAI = (cache?: OpenAIResponseCache) =>
  Effect.fn(function* (request: OpenAIRequest) {
    if (cache !== undefined) {
      yield* Effect.log(`Checking cache for: ${generateOpenAICacheKey(request)}`)
      return yield* cacheOpenAIResponse(
        cache,
        request,
        generateDistractorsUncached(request)
      )
    }
    return yield* generateDistractorsUncached(request)
  })
```

---

## Testing

### Test Layer Pattern

Create mock layers for testing without real API calls:

```typescript
export const TestOpenAIDistractorServiceLayer = (overrides?: {
  generateDistractors?: OpenAIDistractorService['generateDistractors']
  createRequest?: OpenAIDistractorService['createRequest']
  validateConfig?: OpenAIDistractorService['validateConfig']
  cache?: OpenAIResponseCache
}) =>
  Layer.effect(
    OpenAIDistractorService,
    Effect.gen(function* () {
      const defaultCache = yield* createOpenAIResponseCache()
      return OpenAIDistractorService.of({
        _tag: 'OpenAIDistractorService',
        generateDistractors:
          overrides?.generateDistractors ??
          (() =>
            Effect.succeed({
              distractors: ['Test distractor 1', 'Test distractor 2'],
              confidence: 0.9,
              tokensUsed: 100
            })),
        createRequest:
          overrides?.createRequest ??
          (() =>
            Effect.succeed({
              question: 'Test question',
              answerType: 'text',
              context: 'Test context',
              targetCount: 10
            })),
        validateConfig: overrides?.validateConfig ?? (() => Effect.succeed(undefined)),
        cache: overrides?.cache ?? defaultCache
      })
    })
  )
```

### Using Test Layers

```typescript
describe('OpenAI Service', () => {
  it('should generate distractors', async () => {
    const program = Effect.gen(function* () {
      const service = yield* OpenAIDistractorService
      const result = yield* service.generateDistractors({
        question: 'What is the capital?',
        answerType: 'capital',
        context: 'State capitals',
        targetCount: 5
      })
      return result
    })

    const result = await program.pipe(
      Effect.provide(TestOpenAIDistractorServiceLayer()),
      Effect.runPromise
    )

    expect(result.distractors).toHaveLength(2)
    expect(result.confidence).toBe(0.9)
  })

  it('should handle custom mock responses', async () => {
    const customLayer = TestOpenAIDistractorServiceLayer({
      generateDistractors: () =>
        Effect.succeed({
          distractors: ['Custom 1', 'Custom 2', 'Custom 3'],
          confidence: 0.95,
          tokensUsed: 200
        })
    })

    const program = Effect.gen(function* () {
      const service = yield* OpenAIDistractorService
      return yield* service.generateDistractors({...})
    })

    const result = await program.pipe(
      Effect.provide(customLayer),
      Effect.runPromise
    )

    expect(result.distractors).toHaveLength(3)
  })
})
```

---

## Anti-Patterns

### Don't Use Promise-based APIs Directly

```typescript
// Bad - loses Effect benefits
const fetchData = async () => {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const result = await client.chat.completions.create({...})
  return result
}

// Good - wrapped in Effect
const fetchData = () =>
  Effect.gen(function* () {
    const client = yield* createOpenAIClient()()
    return yield* Effect.tryPromise({
      try: () => client.chat.completions.create({...}),
      catch: (error) => mapOpenAIError(error)
    })
  })
```

### Don't Use Generic Error Types

```typescript
// Bad - loses error information
Effect.Effect<Response, Error>

// Good - specific tagged errors
Effect.Effect<Response, OpenAIError | OpenAIRateLimitError | OpenAIAuthError>
```

### Don't Hardcode Configuration

```typescript
// Bad - hardcoded values
const client = new OpenAI({
  apiKey: 'sk-...',
  timeout: 30000
})

// Good - use Config
const client = yield* createOpenAIClient()()  // Reads from environment
```

### Don't Skip Response Validation

```typescript
// Bad - assumes response format
const items = JSON.parse(content)

// Good - validate structure
const parsedResponse = yield* Effect.tryPromise({
  try: () => Promise.resolve(JSON.parse(content)),
  catch: () => new OpenAIError({ cause: new Error('Invalid JSON') })
})

if (Array.isArray(parsedResponse) === false) {
  return yield* Effect.fail(new OpenAIError({...}))
}
```

### Don't Ignore Rate Limits

```typescript
// Bad - no rate limiting
const results = yield* Effect.all(
  items.map((item) => callOpenAI(item)),
  { concurrency: 'unbounded' }  // Will hit rate limits
)

// Good - use rate limiter
const rateLimiter = yield* createOpenAIRateLimiter(60)
const results = yield* rateLimitedBatch(rateLimiter, items, callOpenAI)
```

---

## Quick Reference

### Common Tasks

| Task              | Pattern                 | Example                                       |
| ----------------- | ----------------------- | --------------------------------------------- |
| Create client     | Curried function        | `createOpenAIClient()()`                      |
| Make API call     | `Effect.tryPromise`     | See [Chat Completions](#chat-completions)     |
| Map errors        | Tagged errors in catch  | See [Error Mapping](#error-mapping-pattern)   |
| Validate response | Parse + type guards     | See [Structured Outputs](#structured-outputs) |
| Rate limit        | `withRateLimit()`       | See [Rate Limiting](#rate-limiting)           |
| Cache responses   | `cacheOpenAIResponse()` | See [Caching](#caching)                       |
| Test service      | `TestServiceLayer()`    | See [Testing](#testing)                       |

### Error Types

| Error                  | HTTP Status | When                     |
| ---------------------- | ----------- | ------------------------ |
| `OpenAIError`          | Various     | General API failures     |
| `OpenAIRateLimitError` | 429         | Too many requests        |
| `OpenAIAuthError`      | 401         | Invalid/missing API key  |
| `OpenAITimeoutError`   | -           | Request exceeded timeout |
| `ConfigurationError`   | -           | Invalid configuration    |

### File Locations

| File                                                            | Purpose                     |
| --------------------------------------------------------------- | --------------------------- |
| `packages/distractions/src/services/OpenAIDistractorService.ts` | Main service implementation |
| `packages/distractions/src/types/errors.ts`                     | Tagged error definitions    |
| `packages/distractions/src/config/environment.ts`               | Environment configuration   |
| `packages/distractions/src/utils/rate-limiter.ts`               | Rate limiting utilities     |
| `packages/distractions/src/utils/cache.ts`                      | Caching utilities           |
