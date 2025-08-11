import * as RateLimiter from 'effect/RateLimiter'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'

// Create rate limiter for OpenAI API
export const createOpenAIRateLimiter = (requestsPerMinute: number = 60) =>
  RateLimiter.make({
    limit: requestsPerMinute,
    interval: Duration.minutes(1)
  })

// Create rate limiter with more permissive settings for development
export const createDevelopmentRateLimiter = () =>
  RateLimiter.make({
    limit: 600, // 10 requests per second * 60 seconds
    interval: Duration.minutes(1)
  })

// Create strict rate limiter for production
export const createProductionRateLimiter = () =>
  RateLimiter.make({
    limit: 60, // 1 request per second * 60 seconds
    interval: Duration.minutes(1)
  })

// Wrapper for rate-limited operations
export const withRateLimit = <A, E, R>(
  limiter: RateLimiter.RateLimiter,
  operation: Effect.Effect<A, E, R>
): Effect.Effect<A, E, R> => limiter(operation)

// Helper to create environment-appropriate rate limiter
export const createEnvironmentRateLimiter = (nodeEnv: string = 'development') =>
  nodeEnv === 'production' ? createProductionRateLimiter() : createDevelopmentRateLimiter()

// Batch processing with rate limiting
export const rateLimitedBatch = <A, B, E>(
  limiter: RateLimiter.RateLimiter,
  items: readonly A[],
  operation: (item: A) => Effect.Effect<B, E>
): Effect.Effect<readonly B[], E> =>
  Effect.forEach(
    items,
    (item) => withRateLimit(limiter, operation(item)),
    { concurrency: 1 } // Process sequentially to respect rate limits
  )
