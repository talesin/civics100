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

  // Strategy selection metrics
  strategyOpenAISelected: Metric.counter('strategy_openai_selected', {
    description: 'Times OpenAI text strategy was selected'
  }),

  strategyStaticPoolSelected: Metric.counter('strategy_static_pool_selected', {
    description: 'Times static pool strategy was selected'
  }),

  strategySectionBasedSelected: Metric.counter('strategy_section_based_selected', {
    description: 'Times section-based strategy was selected'
  }),

  strategyHybridSelected: Metric.counter('strategy_hybrid_selected', {
    description: 'Times hybrid strategy was selected'
  }),

  strategyCuratedSelected: Metric.counter('strategy_curated_selected', {
    description: 'Times curated strategy was selected'
  }),

  strategyFallbackUsed: Metric.counter('strategy_fallback_used', {
    description: 'Times a fallback strategy was used due to primary failure'
  }),

  // Complexity analysis metrics
  complexitySimpleFact: Metric.counter('complexity_simple_fact', {
    description: 'Questions classified as simple fact'
  }),

  complexityConceptual: Metric.counter('complexity_conceptual', {
    description: 'Questions classified as conceptual'
  }),

  complexityComparative: Metric.counter('complexity_comparative', {
    description: 'Questions classified as comparative'
  }),

  complexityAnalytical: Metric.counter('complexity_analytical', {
    description: 'Questions classified as analytical'
  }),

  // Cost tracking
  estimatedCostTotal: Metric.gauge('estimated_cost_total_usd', {
    description: 'Estimated total OpenAI cost in USD'
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

// Strategy type for metrics
type DistractorStrategy = 'curated' | 'section-based' | 'openai-text' | 'static-pool' | 'hybrid'

// Helper to track strategy selection
export const trackStrategySelection = (
  strategy: DistractorStrategy
): Effect.Effect<void, never> => {
  switch (strategy) {
    case 'openai-text':
      return Metric.increment(DistractorMetrics.strategyOpenAISelected)
    case 'static-pool':
      return Metric.increment(DistractorMetrics.strategyStaticPoolSelected)
    case 'section-based':
      return Metric.increment(DistractorMetrics.strategySectionBasedSelected)
    case 'hybrid':
      return Metric.increment(DistractorMetrics.strategyHybridSelected)
    case 'curated':
      return Metric.increment(DistractorMetrics.strategyCuratedSelected)
    default:
      return Effect.void
  }
}

// Complexity type for metrics
type ComplexityType = 'simple-fact' | 'conceptual' | 'analytical' | 'comparative'

// Helper to track complexity classification
export const trackComplexity = (complexityType: ComplexityType): Effect.Effect<void, never> => {
  switch (complexityType) {
    case 'simple-fact':
      return Metric.increment(DistractorMetrics.complexitySimpleFact)
    case 'conceptual':
      return Metric.increment(DistractorMetrics.complexityConceptual)
    case 'comparative':
      return Metric.increment(DistractorMetrics.complexityComparative)
    case 'analytical':
      return Metric.increment(DistractorMetrics.complexityAnalytical)
    default:
      return Effect.void
  }
}
