import * as Cache from 'effect/Cache'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Option from 'effect/Option'
import type { Question } from 'civics2json'
import type { OpenAIRequest, OpenAIResponse } from '../types/index'

// Cache key generation functions
export const generateQuestionCacheKey = (question: Question): string =>
  `${question.questionNumber}-${question.question.slice(0, 50).replace(/\s+/g, '-')}`

export const generateOpenAICacheKey = (request: OpenAIRequest): string =>
  `openai-${request.answerType}-${request.question.slice(0, 30).replace(/\s+/g, '-')}-${request.targetCount}`

// Create cache for OpenAI responses
export const createOpenAIResponseCache = (maxSize: number = 1000, ttlHours: number = 24) =>
  Cache.make({
    capacity: maxSize,
    timeToLive: Duration.hours(ttlHours),
    lookup: (key: string) =>
      Effect.succeed({
        distractors: [`Cache miss for ${key}`],
        confidence: 0.0,
        tokensUsed: 0
      } as OpenAIResponse)
  })

// Create cache for distractor validation results
export const createValidationCache = (maxSize: number = 500, ttlMinutes: number = 30) =>
  Cache.make({
    capacity: maxSize,
    timeToLive: Duration.minutes(ttlMinutes),
    lookup: (_key: string) => Effect.succeed(false)
  })

// Wrapper for cached operations
export const withCache = <K, A, E>(cache: Cache.Cache<K, A, E>, key: K): Effect.Effect<A, E> =>
  cache.get(key)

// Cache management helpers
export const clearCache = <K, A>(cache: Cache.Cache<K, A>, key: K) => cache.refresh(key)

export const getCacheStats = <K, A, E>(cache: Cache.Cache<K, A, E>) =>
  Effect.gen(function* () {
    const stats = yield* cache.cacheStats
    return {
      hits: stats.hits,
      misses: stats.misses,
      size: stats.hits + stats.misses // CacheStats doesn't have entryCount property
    }
  })

// Specialized caching functions for different data types
// Note: These check for cache hits (confidence > 0 for OpenAI responses)
// and execute the actual operation on cache miss
export const cacheOpenAIResponse = <E>(
  cache: Cache.Cache<string, OpenAIResponse>,
  request: OpenAIRequest,
  operation: Effect.Effect<OpenAIResponse, E>
): Effect.Effect<OpenAIResponse, E> =>
  Effect.gen(function* () {
    const key = generateOpenAICacheKey(request)
    const cached = yield* cache.get(key).pipe(Effect.option)

    // Check if we have a real cached value (confidence > 0 indicates real data)
    if (Option.isSome(cached) && cached.value.confidence > 0) {
      return cached.value
    }

    // Execute the actual operation on cache miss
    return yield* operation
  })

/**
 * Cache validation result - currently passes through to operation.
 * Note: For boolean caches, we can't distinguish a cache miss from a cached 'false' value,
 * so we always execute the operation. The cache and key parameters are kept for API
 * compatibility and potential future use with Option-based caching.
 */
export const cacheValidationResult = <E>(
  _cache: Cache.Cache<string, boolean>,
  _distractor: string,
  _question: Question,
  operation: Effect.Effect<boolean, E>
): Effect.Effect<boolean, E> => operation
