import * as RateLimiter from 'effect/RateLimiter'
import * as Duration from 'effect/Duration'
import * as Effect from 'effect/Effect'

// Create rate limiter for OpenAI API
export const createOpenAIRateLimiter = (requestsPerMinute: number = 60) =>
  RateLimiter.make({
    interval: Duration.seconds(60 / requestsPerMinute),
    burst: 1 // Only 1 request allowed per interval
  })

// Create rate limiter with more permissive settings for development
export const createDevelopmentRateLimiter = () =>
  RateLimiter.make({
    interval: Duration.millis(100), // 10 requests per second
    burst: 5 // Allow bursts of 5 requests
  })

// Create strict rate limiter for production
export const createProductionRateLimiter = () =>
  RateLimiter.make({
    interval: Duration.seconds(1), // 1 request per second
    burst: 1 // No bursting
  })

// Wrapper for rate-limited operations
export const withRateLimit = <A, E>(
  limiter: RateLimiter.RateLimiter,
  operation: Effect.Effect<A, E>
): Effect.Effect<A, E> => 
  RateLimiter.withPermit(limiter)(operation)

// Helper to create environment-appropriate rate limiter
export const createEnvironmentRateLimiter = (nodeEnv: string = 'development') =>
  nodeEnv === 'production' 
    ? createProductionRateLimiter()
    : createDevelopmentRateLimiter()

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