import * as Cache from 'effect/Cache'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'
import type { Question } from 'civics2json'
import type { OpenAIRequest, OpenAIResponse } from '../types/index'

// Cache key generation functions
export const generateQuestionCacheKey = (question: Question): string =>
  `${question.questionNumber}-${question.question.slice(0, 50).replace(/\s+/g, '-')}`

export const generateOpenAICacheKey = (request: OpenAIRequest): string =>
  `openai-${request.answerType}-${request.question.slice(0, 30).replace(/\s+/g, '-')}-${request.targetCount}`

// Create cache for OpenAI responses
export const createOpenAIResponseCache = (
  maxSize: number = 1000,
  ttlHours: number = 24
) =>
  Cache.make({
    capacity: maxSize,
    timeToLive: Duration.hours(ttlHours),
    lookup: (key: string) => Effect.succeed(`cache-miss-${key}`)
  })

// Create cache for distractor validation results
export const createValidationCache = (
  maxSize: number = 500,
  ttlMinutes: number = 30
) =>
  Cache.make({
    capacity: maxSize,
    timeToLive: Duration.minutes(ttlMinutes),
    lookup: (key: string) => Effect.succeed(false)
  })

// Wrapper for cached operations
export const withCache = <K, A>(
  cache: Cache.Cache<K, A>,
  key: K,
  operation: Effect.Effect<A, never>
): Effect.Effect<A, never> => 
  Cache.get(cache, key, () => operation)

// Cache management helpers
export const clearCache = <K, A>(cache: Cache.Cache<K, A>) =>
  Cache.refresh(cache)

export const getCacheStats = <K, A>(cache: Cache.Cache<K, A>) =>
  Effect.gen(function* () {
    const size = yield* Cache.size(cache)
    return {
      size,
      capacity: cache.capacity
    }
  })

// Specialized caching functions for different data types
export const cacheOpenAIResponse = <E>(
  cache: Cache.Cache<string, OpenAIResponse>,
  request: OpenAIRequest,
  operation: Effect.Effect<OpenAIResponse, E>
): Effect.Effect<OpenAIResponse, E> => {
  const key = generateOpenAICacheKey(request)
  return Cache.get(cache, key, () => operation)
}

export const cacheValidationResult = <E>(
  cache: Cache.Cache<string, boolean>,
  distractor: string,
  question: Question,
  operation: Effect.Effect<boolean, E>
): Effect.Effect<boolean, E> => {
  const key = `${question.questionNumber}-${distractor.slice(0, 20).replace(/\s+/g, '-')}`
  return Cache.get(cache, key, () => operation)
}