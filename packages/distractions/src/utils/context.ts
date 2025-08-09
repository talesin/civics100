import * as FiberRef from 'effect/FiberRef'
import * as Effect from 'effect/Effect'

// Request context for tracking and logging
export interface RequestContext {
  readonly questionId: number
  readonly questionType: string
  readonly attemptNumber: number
  readonly startTime: number
  readonly batchId?: string
}

// Default request context
export const DEFAULT_REQUEST_CONTEXT: RequestContext = {
  questionId: 0,
  questionType: 'unknown',
  attemptNumber: 1,
  startTime: Date.now()
}

// Global fiber reference for request context
export const RequestContextRef = FiberRef.unsafeMake<RequestContext>(DEFAULT_REQUEST_CONTEXT)

// Helper to run operations with context
export const withRequestContext = <A, E>(
  context: Partial<RequestContext>,
  operation: Effect.Effect<A, E>
): Effect.Effect<A, E> => 
  Effect.locallyWith(operation, RequestContextRef, (current: RequestContext) => ({
    ...current,
    ...context
  }))

// Helper to get current context
export const getCurrentContext = Effect.flatMap(
  FiberRef.get(RequestContextRef),
  (context) => Effect.succeed(context)
)

// Enhanced logging with context
export const logWithContext = (message: string) =>
  Effect.gen(function* () {
    const context = yield* FiberRef.get(RequestContextRef)
    yield* Effect.log(`[Q${context.questionId}:${context.questionType}:${context.attemptNumber}] ${message}`)
  })

// Helper to update context within an effect
export const updateContext = (updates: Partial<RequestContext>) =>
  FiberRef.update(RequestContextRef, (current) => ({
    ...current,
    ...updates
  }))

// Helper to increment attempt number
export const incrementAttempt = () =>
  FiberRef.update(RequestContextRef, (current) => ({
    ...current,
    attemptNumber: current.attemptNumber + 1
  }))