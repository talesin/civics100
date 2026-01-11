import * as Cache from 'effect/Cache'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import * as Ref from 'effect/Ref'
import type { Question } from 'civics2json'
import type { OpenAIRequest, OpenAIResponse } from '../types/index'

// Cache key generation functions
export const generateQuestionCacheKey = (question: Question): string =>
  `${question.questionNumber}-${question.question.slice(0, 50).replace(/\s+/g, '-')}`

export const generateOpenAICacheKey = (request: OpenAIRequest): string =>
  `openai-${request.answerType}-${request.question.slice(0, 30).replace(/\s+/g, '-')}-${request.targetCount}`

// Cache entry with timestamp for TTL management
interface CacheEntry<A> {
  value: A
  timestamp: number
}

// OpenAI Response Cache using Ref for proper cache-on-miss behavior
export interface OpenAIResponseCache {
  readonly _tag: 'OpenAIResponseCache'
  readonly ref: Ref.Ref<Map<string, CacheEntry<OpenAIResponse>>>
  readonly maxSize: number
  readonly ttlMs: number
}

// Create cache for OpenAI responses using Ref-based approach
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

// Create cache for distractor validation results
export const createValidationCache = (maxSize: number = 500, ttlMinutes: number = 30) =>
  Cache.make({
    capacity: maxSize,
    timeToLive: Duration.minutes(ttlMinutes),
    lookup: (_key: string) => Effect.succeed(false)
  })

// Wrapper for cached operations (legacy API for validation cache)
export const withCache = <K, A, E>(cache: Cache.Cache<K, A, E>, key: K): Effect.Effect<A, E> =>
  cache.get(key)

// Cache management helpers
export const clearCache = <K, A>(cache: Cache.Cache<K, A>, key: K) => cache.refresh(key)

export const getCacheStats = (cache: OpenAIResponseCache) =>
  Effect.gen(function* () {
    const map = yield* Ref.get(cache.ref)
    const now = Date.now()
    let validEntries = 0
    for (const entry of map.values()) {
      if (now - entry.timestamp < cache.ttlMs) {
        validEntries++
      }
    }
    return {
      hits: 0, // Not tracked in Ref-based cache
      misses: 0, // Not tracked in Ref-based cache
      size: validEntries
    }
  })

// Specialized caching function for OpenAI responses
// Properly caches results after executing operation on miss
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

    // Check if we have a valid cached value (not expired and confidence > 0)
    if (
      cached !== undefined &&
      now - cached.timestamp < cache.ttlMs &&
      cached.value.confidence > 0
    ) {
      return cached.value
    }

    // Execute the actual operation on cache miss
    const result = yield* operation

    // Store the result in the cache
    yield* Ref.update(cache.ref, (currentMap) => {
      const newMap = new Map(currentMap)

      // Evict expired entries and oldest if at capacity
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
        // If still at capacity after evicting expired, remove oldest
        if (newMap.size >= cache.maxSize && oldestKey !== undefined) {
          newMap.delete(oldestKey)
        }
      }

      newMap.set(key, { value: result, timestamp: now })
      return newMap
    })

    return result
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
