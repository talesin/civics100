import * as Metric from 'effect/Metric'
import * as MetricBoundaries from 'effect/MetricBoundaries'
import * as Effect from 'effect/Effect'
import * as Clock from 'effect/Clock'

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

  distractorsGenerated: Metric.counter('distractors_generated_total', {
    description: 'Total number of distractors generated'
  }),

  distractorsFiltered: Metric.counter('distractors_filtered_total', {
    description: 'Total number of distractors filtered out for quality'
  }),

  // Histogram metrics (using simple boundaries for now)
  openaiResponseTime: Metric.histogram(
    'openai_response_time_ms',
    MetricBoundaries.exponential({ start: 1, factor: 2, count: 10 })
  ),

  distractorQualityScore: Metric.histogram(
    'distractor_quality_score',
    MetricBoundaries.linear({ start: 0, width: 0.1, count: 10 })
  ),

  questionProcessingTime: Metric.histogram(
    'question_processing_time_ms',
    MetricBoundaries.exponential({ start: 10, factor: 2, count: 12 })
  ),

  // Gauge metrics
  questionsProcessed: Metric.gauge('questions_processed', {
    description: 'Number of questions processed'
  }),

  cacheHitRate: Metric.gauge('cache_hit_rate', {
    description: 'Cache hit rate percentage'
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
    yield* Metric.update(metric, end - start)
    return result
  })

// Helper to track success/failure rates
export const trackOperation = <A, E>(
  successMetric: Metric.Metric.Counter<number>,
  failureMetric: Metric.Metric.Counter<number>,
  operation: Effect.Effect<A, E>
): Effect.Effect<A, E> =>
  Effect.gen(function* () {
    const result = yield* Effect.either(operation)

    if (result._tag === 'Right') {
      yield* Metric.increment(successMetric)
      return result.right
    } else {
      yield* Metric.increment(failureMetric)
      return yield* Effect.fail(result.left)
    }
  })

// Helper to measure and track an operation with timing and success/failure
export const measureAndTrack = <A, E>(
  successMetric: Metric.Metric.Counter<number>,
  failureMetric: Metric.Metric.Counter<number>,
  durationMetric: Metric.Metric.Histogram<number>,
  operation: Effect.Effect<A, E>
): Effect.Effect<A, E> =>
  measureDuration(durationMetric, trackOperation(successMetric, failureMetric, operation))
