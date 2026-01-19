/**
 * EnhancedStaticGenerator - Production-Ready Distractor Generation
 *
 * @module EnhancedStaticGenerator
 *
 * **Purpose:**
 * Distractor generation system using OpenAI with fallback to curated database.
 *
 * **Key Features:**
 * - **Two-Strategy Approach:**
 *   - `openai-text`: AI-generated distractors with relevance scoring
 *   - `fallback`: Pre-validated curated distractors for all questions
 *
 * - **Quality Assurance:**
 *   - Similarity filtering to avoid duplicates
 *   - Quality scoring (relevance, plausibility, educational value)
 *   - Cross-checking against correct answers
 *
 * - **OpenAI Integration:**
 *   - GPT-4o-mini for intelligent text distractors
 *   - Automatic retry with exponential backoff
 *   - Graceful fallback to curated database on failure
 *
 * **Configuration:**
 * All behavior is controlled via {@link DistractorGenerationOptions}:
 * - `targetCount`: Number of distractors per question (5-20)
 * - `useOpenAI`: Enable/disable OpenAI generation
 * - `filterSimilar`: Apply similarity filtering
 * - `batchSize`: Parallel processing batch size
 */

import { Effect, Layer, Schedule } from 'effect'
import * as Metric from 'effect/Metric'
import type { Question } from 'civics2json'
import { QuestionsDataService } from '../data/QuestionsDataService'
import { FallbackDistractorService } from '../services/FallbackDistractorService'
import { OpenAIDistractorService } from '../services/OpenAIDistractorService'
import { DistractorQualityService } from '../services/DistractorQualityService'
import { SimilarityService } from '../services/SimilarityService'
import type {
  DistractorStrategy,
  DistractorGenerationResult,
  ScoredDistractor
} from '../types/index'
import type { DistractorGenerationOptions } from '../types/config'
import { QuestionWithDistractors } from './StaticGenerator'
import {
  OpenAIError,
  OpenAIRateLimitError,
  OpenAIAuthError,
  OpenAITimeoutError
} from '../types/errors'
import { DistractorMetrics, measureDuration, trackStrategySelection } from '../utils/metrics'

// Helper to extract answer text (reused from StaticGenerator)
const getAnswerText = (choice: Question['answers']['choices'][number]): string => {
  if (typeof choice === 'string') {
    return choice
  }
  if ('senator' in choice) {
    return choice.senator
  }
  if ('representative' in choice) {
    return choice.representative
  }
  if ('governor' in choice) {
    return choice.governor
  }
  if ('capital' in choice) {
    return choice.capital
  }
  return ''
}

/**
 * Select the distractor generation strategy for a given question.
 *
 * **Simplified Strategy:**
 * - If OpenAI is enabled → 'openai-text'
 * - If OpenAI is disabled → 'fallback'
 *
 * @param question - The civics question to generate distractors for
 * @param options - Generation configuration including OpenAI enablement
 * @returns Effect producing the selected strategy
 */
export const selectDistractorStrategy = (
  question: Question,
  options: DistractorGenerationOptions
): Effect.Effect<DistractorStrategy, never> =>
  Effect.gen(function* () {
    const selectedStrategy: DistractorStrategy = options.useOpenAI ? 'openai-text' : 'fallback'

    yield* Effect.logDebug(
      `Strategy for Q${question.questionNumber}: ${selectedStrategy} (useOpenAI=${options.useOpenAI})`
    )

    yield* trackStrategySelection(selectedStrategy)
    return selectedStrategy
  })

// Create retry schedule for OpenAI requests (following coding guide)
const createOpenAIRetrySchedule = () =>
  Schedule.exponential('100 millis').pipe(
    Schedule.intersect(Schedule.recurs(3)), // Max 3 retries
    Schedule.whileInput((error: unknown) => {
      // Don't retry on auth errors - fail fast
      if (error instanceof OpenAIAuthError) return false
      // Don't retry indefinitely on rate limits - only a few times
      if (error instanceof OpenAIRateLimitError) return true
      // Retry on network/timeout errors
      if (error instanceof OpenAITimeoutError) return true
      // Retry on general OpenAI errors
      if (error instanceof OpenAIError) return true
      return false
    })
  )

// Result type from OpenAI generation with scored distractors
interface OpenAIGenerationResult {
  readonly distractors: readonly ScoredDistractor[]
}

// Handle OpenAI text generation with retry logic (following coding guide)
const generateWithOpenAI = (
  openaiService: OpenAIDistractorService,
  question: Question,
  targetCount: number
): Effect.Effect<OpenAIGenerationResult, never> =>
  Effect.gen(function* () {
    const retrySchedule = createOpenAIRetrySchedule()

    // Try OpenAI generation with intelligent retry logic
    const openaiAttempt = Effect.gen(function* () {
      const request = yield* openaiService.createRequest(question, targetCount)
      const response = yield* openaiService.generateDistractors(request)
      return response
    })

    const openaiResult = yield* openaiAttempt.pipe(
      Effect.retry(retrySchedule),
      Effect.tapError((error) => {
        // Extract detailed error message from tagged errors
        const errorDetails = (() => {
          if (error instanceof OpenAIAuthError) {
            return `Authentication error: ${error.message}`
          }
          if (error instanceof OpenAIRateLimitError) {
            const retryInfo =
              error.retryAfter !== undefined ? ` (retry after ${error.retryAfter}s)` : ''
            return `Rate limit exceeded${retryInfo}`
          }
          if (error instanceof OpenAITimeoutError) {
            return `Request timed out after ${error.timeoutMs}ms`
          }
          if (error instanceof OpenAIError) {
            const cause = error.cause
            if (cause instanceof Error) {
              return cause.message
            }
            return String(cause)
          }
          if (error instanceof Error) {
            return error.message
          }
          return String(error)
        })()
        return Effect.log(
          `OpenAI attempt failed for question ${question.questionNumber}: ${errorDetails}`
        )
      }),
      Effect.either
    )

    if (openaiResult._tag === 'Right') {
      const distractors = openaiResult.right.distractors
      yield* Effect.log(
        `Generated ${distractors.length} distractors via OpenAI for question ${question.questionNumber}`
      )
      return { distractors }
    } else {
      // Enhanced fallback with error-specific handling
      const error = openaiResult.left
      let fallbackReason = 'OpenAI failed'

      if (error instanceof OpenAIAuthError) {
        fallbackReason = 'OpenAI authentication failed'
      } else if (error instanceof OpenAIRateLimitError) {
        fallbackReason = 'OpenAI rate limit exceeded'
      } else if (error instanceof OpenAITimeoutError) {
        fallbackReason = 'OpenAI request timed out'
      }

      yield* Effect.log(
        `${fallbackReason}, falling back to empty result for question ${question.questionNumber}`
      )
      return { distractors: [] }
    }
  })

// Apply quality filtering and similarity removal (following coding guide)
const applyQualityFiltering = (
  rawDistractors: string[],
  correctAnswers: string[],
  answerType: string,
  filterSimilar: boolean,
  qualityService: DistractorQualityService,
  similarityService: SimilarityService
): Effect.Effect<string[], never> =>
  Effect.gen(function* () {
    // Step 1: Apply quality filtering (with error handling)
    const qualityFiltered = yield* qualityService
      .applyEnhancedQualityFilters(rawDistractors, correctAnswers, answerType)
      .pipe(Effect.catchAll(() => Effect.succeed(rawDistractors)))

    // Step 2: Apply similarity filtering if enabled (with error handling)
    const finalDistractors = filterSimilar
      ? yield* similarityService.removeSimilar(qualityFiltered, correctAnswers).pipe(
          Effect.catchAll(() => Effect.succeed(qualityFiltered)) // Fallback on similarity error
        )
      : qualityFiltered

    return finalDistractors
  })

// Pad distractors to target count using fallback database only
// Exported for testing purposes
export const padDistractors = (
  distractors: string[],
  targetCount: number,
  question: Question,
  correctAnswers: string[],
  fallbackService: FallbackDistractorService
): Effect.Effect<string[], never> =>
  Effect.gen(function* () {
    if (distractors.length >= targetCount) {
      return distractors.slice(0, targetCount)
    }

    const needed = targetCount - distractors.length
    let result = [...distractors]

    // Use fallback database (fast, pre-validated, curated for each question)
    const fallbacks = fallbackService.getFallbackDistractors(question)
    const unusedFallbacks = [...fallbacks].filter(
      (f) =>
        !result.some((d) => d.toLowerCase() === f.toLowerCase()) &&
        !correctAnswers.some((a) => a.toLowerCase() === f.toLowerCase())
    )

    if (unusedFallbacks.length > 0) {
      const fallbacksToAdd = unusedFallbacks.slice(0, needed)
      result = [...result, ...fallbacksToAdd]
    }

    return result.slice(0, targetCount)
  })

// ============================================================================
// Quality Metrics Calculation
// ============================================================================

/**
 * Check if a string appears to be a name format (capitalized words).
 */
const isNameFormat = (text: string): boolean => {
  const words = text.trim().split(/\s+/)
  return words.every((word) => /^[A-Z][a-z]*/.test(word))
}

/**
 * Get category keywords for a question based on its content.
 */
const getCategoryKeywords = (question: Question): string[] => {
  const text = question.question.toLowerCase()

  if (/president|executive/.test(text)) return ['president', 'leader', 'elected']
  if (/congress|senate|house|legislat/.test(text)) return ['senator', 'representative', 'congress']
  if (/court|justice|judicial/.test(text)) return ['justice', 'court', 'judge']
  if (/constitution|amendment|bill of rights/.test(text)) return ['amendment', 'right', 'freedom']
  if (/state|governor/.test(text)) return ['state', 'governor', 'capital']
  if (/war|military|independence/.test(text)) return ['war', 'battle', 'independence']
  if (/vote|election/.test(text)) return ['vote', 'election', 'citizen']

  return []
}

/**
 * Check if a distractor is topically related to the question.
 */
const isTopicallyRelated = (distractor: string, question: Question): boolean => {
  const keywords = getCategoryKeywords(question)
  const distractorLower = distractor.toLowerCase()
  return keywords.some((kw) => distractorLower.includes(kw))
}

/**
 * Common misconceptions by question topic.
 */
const commonMisconceptions: Record<string, string[]> = {
  constitution: ['1776', 'Declaration of Independence'],
  president: ['lifetime', 'unlimited terms', 'Congress elects'],
  congress: ['100 representatives', '435 senators'],
  amendments: ['12 amendments', '27 original'],
  rights: ['driving is a right', 'voting is optional']
}

/**
 * Check if distractor represents a common misconception.
 */
const checkCommonMisconceptions = (distractor: string, question: Question): boolean => {
  const text = question.question.toLowerCase()
  const distractorLower = distractor.toLowerCase()

  for (const [topic, misconceptions] of Object.entries(commonMisconceptions)) {
    if (text.includes(topic)) {
      return misconceptions.some((m) => distractorLower.includes(m.toLowerCase()))
    }
  }

  return false
}

/**
 * Calculate relevance score based on semantic distance.
 *
 * Optimal range: 0.3-0.6 similarity
 * - Too similar (>0.6) = might be confused with correct answer
 * - Too different (<0.3) = obviously wrong
 *
 * @param distractor - The distractor to score
 * @param correctAnswer - The correct answer for comparison
 * @param similarityService - Service for calculating similarity
 * @returns Score between 0 and 1
 */
const calculateRelevanceScore = (
  distractor: string,
  correctAnswer: string,
  similarityService: SimilarityService
): Effect.Effect<number, never> =>
  Effect.gen(function* () {
    const similarityResult = yield* similarityService
      .calculateSimilarity(distractor.toLowerCase(), correctAnswer.toLowerCase())
      .pipe(Effect.catchAll(() => Effect.succeed(0.5)))

    const similarity = similarityResult

    // Optimal range: 0.3-0.6
    if (similarity >= 0.3 && similarity <= 0.6) {
      return 0.9 // Perfect range
    } else if (similarity < 0.3) {
      // Too different - scale from 0.5 to 0.8
      return 0.5 + (similarity / 0.3) * 0.3
    } else {
      // Too similar - scale down from 0.9 to 0.4
      return 0.9 - ((similarity - 0.6) / 0.4) * 0.5
    }
  })

/**
 * Calculate plausibility score based on format and context matching.
 *
 * @param distractor - The distractor to score
 * @param correctAnswer - The correct answer for comparison
 * @param question - The question for context
 * @returns Score between 0 and 1
 */
const calculatePlausibilityScore = (
  distractor: string,
  correctAnswer: string,
  question: Question
): number => {
  let score = 0.5 // Base score

  // Same format as correct answer (both names, both dates, etc.)
  if (isNameFormat(distractor) === isNameFormat(correctAnswer)) {
    score += 0.2
  }

  // Similar length
  const lengthRatio =
    Math.min(distractor.length, correctAnswer.length) /
    Math.max(distractor.length, correctAnswer.length)
  score += lengthRatio * 0.2

  // Contains expected category keywords
  const categoryKeywords = getCategoryKeywords(question)
  const hasKeywords = categoryKeywords.some((kw) => distractor.toLowerCase().includes(kw))
  if (hasKeywords) score += 0.1

  return Math.min(1, score)
}

/**
 * Calculate educational value based on topic relevance and misconception addressing.
 *
 * @param distractor - The distractor to score
 * @param question - The question for context
 * @returns Score between 0 and 1
 */
const calculateEducationalValue = (distractor: string, question: Question): number => {
  let score = 0.5 // Base score

  // Related to correct topic (teaches related content when revealed as wrong)
  if (isTopicallyRelated(distractor, question)) {
    score += 0.3
  }

  // Common misconception (valuable to address)
  if (checkCommonMisconceptions(distractor, question)) {
    score += 0.2
  }

  return Math.min(1, score)
}

/**
 * Calculate aggregate quality metrics for a set of distractors.
 *
 * @param distractors - The distractors to evaluate
 * @param correctAnswer - The correct answer
 * @param question - The question for context
 * @param similarityService - Service for similarity calculations
 * @returns Quality metrics object
 */
const calculateQualityMetrics = (
  distractors: string[],
  correctAnswer: string,
  question: Question,
  similarityService: SimilarityService
): Effect.Effect<
  { relevanceScore: number; plausibilityScore: number; educationalValue: number },
  never
> =>
  Effect.gen(function* () {
    if (distractors.length === 0) {
      return { relevanceScore: 0.5, plausibilityScore: 0.5, educationalValue: 0.5 }
    }

    // Calculate scores for each distractor
    const relevanceScores: number[] = []
    for (const distractor of distractors) {
      const score = yield* calculateRelevanceScore(distractor, correctAnswer, similarityService)
      relevanceScores.push(score)
    }

    const plausibilityScores = distractors.map((d) =>
      calculatePlausibilityScore(d, correctAnswer, question)
    )

    const educationalScores = distractors.map((d) => calculateEducationalValue(d, question))

    // Calculate averages
    const avg = (scores: number[]) =>
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.5

    return {
      relevanceScore: avg(relevanceScores),
      plausibilityScore: avg(plausibilityScores),
      educationalValue: avg(educationalScores)
    }
  })

// ============================================================================
// Enhanced generation with multiple strategies (following coding guide)
export const generateEnhancedDistractors =
  (
    fallbackService: FallbackDistractorService,
    openaiService: OpenAIDistractorService,
    qualityService: DistractorQualityService,
    similarityService: SimilarityService
  ) =>
  (
    question: Question,
    options: DistractorGenerationOptions
  ): Effect.Effect<DistractorGenerationResult, never> => {
    // Wrap the entire generation process with metrics
    return measureDuration(
      DistractorMetrics.questionProcessingTime,
      Effect.gen(function* () {
        const correctAnswers = question.answers.choices.map(getAnswerText)
        let rawDistractors: string[] = []

        // Step 1: Select strategy and generate raw distractors
        const selectedStrategy = yield* selectDistractorStrategy(question, options)
        let strategy: DistractorStrategy = selectedStrategy
        yield* Effect.logDebug(
          `Question ${question.questionNumber}: strategy=${selectedStrategy}, ` +
            `type=${question.answers._type}`
        )

        switch (selectedStrategy) {
          case 'openai-text': {
            // Request extra distractors for filtering by relevance
            const requestCount = options.targetCount + (options.overRequestCount ?? 5)
            const result = yield* generateWithOpenAI(openaiService, question, requestCount)

            if (result.distractors.length > 0) {
              // Sort by relevance (highest first), take top N
              const sorted = [...result.distractors].sort((a, b) => b.relevance - a.relevance)
              const topDistractors = sorted.slice(0, options.targetCount)
              rawDistractors = topDistractors.map((d) => d.text)

              // Debug: show all scores
              yield* Effect.logDebug(
                `All distractors with scores: ${sorted.map((d) => `${d.text.slice(0, 20)}...(${d.relevance})`).join(', ')}`
              )

              // Log relevance filtering details
              const lowestKept = topDistractors.at(-1)?.relevance ?? 0
              const highestKept = topDistractors[0]?.relevance ?? 0
              yield* Effect.log(
                `Filtered ${result.distractors.length} -> ${rawDistractors.length} by relevance ` +
                  `(kept scores ${lowestKept}-${highestKept})`
              )
            } else {
              // OpenAI failed: use fallback database
              const fallbackDistractors = fallbackService.getFallbackDistractors(question)
              rawDistractors = [...fallbackDistractors].slice(0, options.targetCount)
              strategy = 'fallback'
              yield* Effect.log(
                `OpenAI failed: using fallback database for question ${question.questionNumber}`
              )
            }
            break
          }

          case 'fallback': {
            // Use fallback database directly (OpenAI disabled)
            const fallbackDistractors = fallbackService.getFallbackDistractors(question)
            rawDistractors = [...fallbackDistractors].slice(0, options.targetCount)
            yield* Effect.log(
              `Using fallback database for question ${question.questionNumber} (${rawDistractors.length} distractors)`
            )
            break
          }
        }

        // Step 2: Apply quality filtering and similarity removal
        const filteredDistractors = yield* applyQualityFiltering(
          rawDistractors,
          correctAnswers,
          question.answers._type,
          options.filterSimilar,
          qualityService,
          similarityService
        )

        // Step 4: Ensure we have enough distractors, pad if needed from fallback
        const paddedDistractors = yield* padDistractors(
          filteredDistractors,
          options.targetCount,
          question,
          correctAnswers,
          fallbackService
        )

        // Step 5: Track final metrics
        yield* Metric.increment(DistractorMetrics.questionsProcessed)
        if (rawDistractors.length - paddedDistractors.length > 0) {
          yield* Metric.incrementBy(
            DistractorMetrics.distractorsFiltered,
            rawDistractors.length - paddedDistractors.length
          )
        }

        // Step 6: Calculate real quality metrics
        const primaryAnswer = correctAnswers[0] ?? ''
        const qualityScores = yield* calculateQualityMetrics(
          [...paddedDistractors],
          primaryAnswer,
          question,
          similarityService
        )

        return {
          question,
          distractors: paddedDistractors.slice(0, options.targetCount) as readonly string[],
          strategy,
          quality: {
            ...qualityScores,
            duplicatesRemoved: rawDistractors.length - paddedDistractors.length,
            totalGenerated: rawDistractors.length
          }
        }
      })
    ).pipe(
      Effect.catchAll(() =>
        Effect.succeed({
          question,
          distractors: [] as readonly string[],
          strategy: 'fallback' as DistractorStrategy,
          quality: {
            relevanceScore: 0.5,
            plausibilityScore: 0.5,
            educationalValue: 0.5,
            duplicatesRemoved: 0,
            totalGenerated: 0
          }
        })
      )
    )
  }

/**
 * Generate distractors for all civics questions using the enhanced pipeline.
 *
 * **Processing Pipeline:**
 * 1. Load all questions from data service
 * 2. For each question:
 *    a. Select generation strategy based on question type
 *    b. Generate raw distractors using selected strategy
 *    c. Apply quality filtering
 *    d. Apply similarity filtering (if enabled)
 *    e. Pad to target count with fallback distractors if needed
 *    f. Track metrics
 * 3. Return all questions with distractors attached
 *
 * **Error Handling:**
 * - Individual question failures don't stop the pipeline
 * - OpenAI failures automatically fallback to static generation
 * - Empty distractor sets are allowed (won't crash)
 *
 * **Performance:**
 * - Questions processed in parallel (configurable batch size)
 * - OpenAI responses cached to reduce API calls
 * - Rate limiting prevents quota exhaustion
 *
 * @param questionsDataService - Service to fetch all civics questions
 * @param fallbackService - Service for fallback distractors when OpenAI fails
 * @param openaiService - Service for AI-generated distractors
 * @param qualityService - Service for quality filtering
 * @param similarityService - Service for similarity detection
 * @returns Function that takes options and returns Effect with questions+distractors
 */
export const generateEnhanced =
  (
    questionsDataService: QuestionsDataService,
    fallbackService: FallbackDistractorService,
    openaiService: OpenAIDistractorService,
    qualityService: DistractorQualityService,
    similarityService: SimilarityService
  ) =>
  (options: DistractorGenerationOptions): Effect.Effect<QuestionWithDistractors[], never> =>
    Effect.gen(function* () {
      const allQuestions = yield* questionsDataService.getAllQuestions()

      // Filter to specific question if questionNumber is set
      const questionsToProcess =
        options.questionNumber !== undefined
          ? allQuestions.filter((q) => q.questionNumber === options.questionNumber)
          : allQuestions

      const results = yield* Effect.all(
        questionsToProcess.map((question) =>
          generateEnhancedDistractors(
            fallbackService,
            openaiService,
            qualityService,
            similarityService
          )(question, options)
        ),
        { concurrency: options.batchSize ?? 10 }
      )

      return results.map((result) =>
        QuestionWithDistractors({
          ...result.question,
          distractors: result.distractors
        })
      )
    })

/**
 * EnhancedStaticGenerator Service
 *
 * **Recommended for:** Production use, CLI tool, API integration
 *
 * **Service Dependencies:**
 * - {@link QuestionsDataService} - Provides civics questions
 * - {@link FallbackDistractorService} - Provides fallback distractors when OpenAI fails
 * - {@link OpenAIDistractorService} - Provides AI-generated distractors
 * - {@link DistractorQualityService} - Filters low-quality distractors
 * - {@link SimilarityService} - Removes duplicate/similar distractors
 *
 * **Configuration:**
 * Pass {@link DistractorGenerationOptions} to `generateEnhanced()` to control:
 * - Target distractor count
 * - OpenAI enablement
 * - Quality filtering
 * - Similarity detection
 * - Batch processing
 *
 * **Usage in CLI:**
 * This service is automatically wired in the CLI with all dependencies.
 * Options are mapped from command-line arguments.
 *
 * @see {@link DistractorManager} for file I/O integration
 */
export class EnhancedStaticGenerator extends Effect.Service<EnhancedStaticGenerator>()(
  'EnhancedStaticGenerator',
  {
    effect: Effect.gen(function* () {
      const questionsDataService = yield* QuestionsDataService
      const fallbackService = yield* FallbackDistractorService
      const openaiService = yield* OpenAIDistractorService
      const qualityService = yield* DistractorQualityService
      const similarityService = yield* SimilarityService

      const generateEnhancedFn = generateEnhanced(
        questionsDataService,
        fallbackService,
        openaiService,
        qualityService,
        similarityService
      )

      return {
        generateEnhanced: generateEnhancedFn,
        selectStrategy: selectDistractorStrategy
      }
    }),
    dependencies: [
      QuestionsDataService.Default,
      FallbackDistractorService.Default,
      OpenAIDistractorService.Default,
      DistractorQualityService.Default,
      SimilarityService.Default
    ]
  }
) {}

// Test layer following coding guide pattern
export const TestEnhancedStaticGeneratorLayer = (fn?: {
  generateEnhanced?: (
    options: DistractorGenerationOptions
  ) => Effect.Effect<QuestionWithDistractors[], never>
  selectStrategy?: typeof selectDistractorStrategy
}) =>
  Layer.succeed(
    EnhancedStaticGenerator,
    EnhancedStaticGenerator.of({
      _tag: 'EnhancedStaticGenerator',
      generateEnhanced: fn?.generateEnhanced ?? (() => Effect.succeed([])),
      selectStrategy: fn?.selectStrategy ?? (() => Effect.succeed('fallback'))
    })
  )
