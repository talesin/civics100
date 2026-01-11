/**
 * EnhancedStaticGenerator - Production-Ready Distractor Generation
 *
 * @module EnhancedStaticGenerator
 *
 * **Purpose:**
 * Advanced distractor generation system that combines multiple strategies,
 * quality filtering, and OpenAI integration to produce high-quality incorrect
 * answer choices for civics questions.
 *
 * **Key Features:**
 * - **Multiple Generation Strategies:**
 *   - `curated`: Hand-crafted distractors from experts
 *   - `static-pool`: Distractors from pre-populated data pools (senators, governors, etc.)
 *   - `openai-text`: AI-generated distractors for conceptual questions
 *   - `section-based`: Answers from related questions as distractors
 *   - `hybrid`: Combination of multiple approaches
 *
 * - **Quality Assurance:**
 *   - Similarity filtering to avoid duplicates
 *   - Quality scoring (relevance, plausibility, educational value)
 *   - Configurable thresholds
 *   - Cross-checking against correct answers
 *
 * - **OpenAI Integration:**
 *   - GPT-5-mini for intelligent text distractors
 *   - Response caching to reduce API costs
 *   - Rate limiting to prevent quota exhaustion
 *   - Automatic retry with exponential backoff
 *   - Graceful fallback to static generation
 *
 * - **Observability:**
 *   - Comprehensive metrics tracking
 *   - Performance monitoring
 *   - Generation quality metrics
 *   - Error reporting
 *
 * **Configuration:**
 * All behavior is controlled via {@link DistractorGenerationOptions}:
 * - `targetCount`: Number of distractors per question (5-20)
 * - `useOpenAI`: Enable/disable OpenAI generation
 * - `filterSimilar`: Apply similarity filtering
 * - `checkAnswers`: Cross-check against correct answers
 * - `batchSize`: Parallel processing batch size
 *
 * @example Basic Usage
 * ```typescript
 * import { EnhancedStaticGenerator } from './generators/EnhancedStaticGenerator'
 * import { DEFAULT_GENERATION_OPTIONS } from './types/config'
 *
 * const program = Effect.gen(function* () {
 *   const generator = yield* EnhancedStaticGenerator
 *
 *   const options = {
 *     ...DEFAULT_GENERATION_OPTIONS,
 *     targetCount: 10,
 *     useOpenAI: true
 *   }
 *
 *   const questionsWithDistractors = yield* generator.generateEnhanced(options)
 *   return questionsWithDistractors
 * })
 * ```
 *
 * @example Custom Configuration
 * ```typescript
 * const options: DistractorGenerationOptions = {
 *   regenAll: false,
 *   regenIncomplete: true,
 *   targetCount: 15,
 *   filterSimilar: true,
 *   checkAnswers: true,
 *   useOpenAI: true,
 *   batchSize: 10,
 *   maxRetries: 3
 * }
 *
 * const results = yield* generator.generateEnhanced(options)
 * ```
 */

import { Chunk, Effect, Layer, Schedule, Random } from 'effect'
import * as Metric from 'effect/Metric'
import type { Question } from 'civics2json'
import { QuestionsDataService } from '../data/QuestionsDataService'
import { CuratedDistractorService } from '../services/CuratedDistractorService'
import { OpenAIDistractorService } from '../services/OpenAIDistractorService'
import { DistractorQualityService } from '../services/DistractorQualityService'
import { SimilarityService } from '../services/SimilarityService'
import type { DistractorStrategy, DistractorGenerationResult } from '../types/index'
import type { DistractorGenerationOptions } from '../types/config'
import { QuestionWithDistractors } from './StaticGenerator'
import {
  OpenAIError,
  OpenAIRateLimitError,
  OpenAIAuthError,
  OpenAITimeoutError
} from '../types/errors'
import { DistractorMetrics, measureDuration } from '../utils/metrics'

// Static pools imports
import { usSenators } from '../data/pools/senators'
import { usRepresentatives } from '../data/pools/representatives'
import { usGovernors } from '../data/pools/governors'
import { usCapitals } from '../data/pools/capitals'
import { usPresidents } from '../data/pools/presidents'
import { usStates } from '../data/pools/states'

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
 * Select the optimal distractor generation strategy for a given question.
 *
 * **Strategy Selection Logic:**
 * - Text questions with OpenAI enabled → `openai-text` (best quality)
 * - Structured questions (senator, representative, etc.) → `static-pool` (fast, accurate)
 * - Text questions with OpenAI disabled → `section-based` (fallback)
 * - Unknown types → `hybrid` (maximum coverage)
 *
 * **Future Enhancements (Phase 2):**
 * - Question complexity analysis
 * - Historical performance data
 * - Cost optimization
 * - Quality-based fallback chains
 *
 * @param question - The civics question to generate distractors for
 * @param options - Generation configuration including OpenAI enablement
 * @returns Effect producing the selected strategy
 */
export const selectDistractorStrategy = (
  question: Question,
  options: DistractorGenerationOptions
): Effect.Effect<DistractorStrategy, never> => {
  const answerType = question.answers._type

  // TODO: Phase 2 Enhancement - Implement intelligent strategy selection based on:
  // 1. Question complexity analysis (simple facts vs. conceptual understanding)
  // 2. Available static pool quality for the specific question type
  // 3. Historical performance data for each strategy on similar questions
  // 4. Cost optimization (OpenAI usage budget vs. quality requirements)
  // 5. Fallback chains with quality thresholds (try OpenAI, fallback to static if poor quality)

  // If OpenAI is disabled, use static strategies only
  if (options.useOpenAI === false) {
    return Effect.succeed(answerType === 'text' ? 'section-based' : 'static-pool')
  }

  // Basic strategy selection logic (will be enhanced with AI-driven selection in Phase 2)
  switch (answerType) {
    case 'text':
      // For text questions, prefer OpenAI for better quality and contextual understanding
      return Effect.succeed('openai-text')
    case 'senator':
    case 'representative':
    case 'governor':
    case 'capital':
      // For structured data, use static pools (high quality, cost-effective)
      return Effect.succeed('static-pool')
    default:
      // For unknown types, use hybrid approach for maximum coverage
      return Effect.succeed('hybrid')
  }
}

// Static pool generation by type (following coding guide)
export const generateFromStaticPools = (
  question: Question,
  targetCount: number
): Effect.Effect<string[], never> => {
  const answerType = question.answers._type
  const correctAnswers = question.answers.choices.map(getAnswerText)

  // TODO: Phase 2 Enhancement - Improve static pool generation with:
  // 1. Smart pool selection based on question context (regional relevance, time period, etc.)
  // 2. Difficulty matching (don't use obviously wrong answers for easy questions)
  // 3. Thematic clustering (group similar concepts for better distractors)
  // 4. Historical data analysis (which distractors work best for similar questions)
  // 5. State/region-aware filtering (don't use California senators for Texas questions)
  // 6. Time period awareness (don't use outdated information as distractors)
  // 7. Frequency balancing (avoid overusing the same distractors across questions)

  let pool: string[] = []

  // Basic pool selection (will be enhanced with contextual intelligence in Phase 2)
  switch (answerType) {
    case 'senator':
      pool = usSenators
      break
    case 'representative':
      pool = usRepresentatives
      break
    case 'governor':
      pool = usGovernors
      break
    case 'capital':
      pool = usCapitals
      break
    case 'text':
      // For text questions, use presidents as fallback (limited effectiveness)
      pool = usPresidents
      break
    default:
      // Mixed pool for unknown types (needs refinement)
      pool = [...usStates, ...usCapitals].slice(0, 20)
  }

  // Basic filtering (will be enhanced with semantic similarity in Phase 2)
  const candidates = pool.filter(
    (item) =>
      !correctAnswers.some(
        (answer) =>
          item.toLowerCase().includes(answer.toLowerCase()) ||
          answer.toLowerCase().includes(item.toLowerCase())
      )
  )

  // Random shuffle using Effect's Random for testability
  return Effect.gen(function* () {
    const shuffled = yield* Random.shuffle(candidates)
    return Chunk.toReadonlyArray(shuffled).slice(0, targetCount)
  })
}

// Section-based fallback generation (following coding guide)
export const generateFromSection = (
  question: Question,
  allQuestions: Question[],
  targetCount: number
): Effect.Effect<string[], never> => {
  const correctAnswers = question.answers.choices.map(getAnswerText)

  const sectionQuestions = allQuestions.filter(
    (q) => q.section === question.section && q.questionNumber !== question.questionNumber
  )

  const potentialDistractors = sectionQuestions
    .flatMap((q) => q.answers.choices.map(getAnswerText))
    .filter((answer) => !correctAnswers.includes(answer))

  // Remove duplicates and take target count
  const uniqueDistractors = [...new Set(potentialDistractors)]
  return Effect.succeed(uniqueDistractors.slice(0, targetCount))
}

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

// Handle OpenAI text generation with retry logic (following coding guide)
const generateWithOpenAI = (
  openaiService: OpenAIDistractorService,
  question: Question,
  targetCount: number
): Effect.Effect<string[], never> =>
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
      Effect.tapError((error) =>
        Effect.log(
          `OpenAI attempt failed for question ${question.questionNumber}: ${error instanceof Error ? error.message : String(error)}`
        )
      ),
      Effect.either
    )

    if (openaiResult._tag === 'Right') {
      const distractors = [...openaiResult.right.distractors]
      yield* Effect.log(
        `Generated ${distractors.length} distractors via OpenAI for question ${question.questionNumber}`
      )
      return distractors
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
      return []
    }
  })

// Handle hybrid strategy generation (following coding guide)
const generateWithHybrid = (
  question: Question,
  allQuestions: Question[],
  targetCount: number
): Effect.Effect<string[], never> =>
  Effect.gen(function* () {
    // Combine multiple sources
    const staticDistractors = yield* generateFromStaticPools(question, Math.ceil(targetCount / 2))
    const sectionDistractors = yield* generateFromSection(
      question,
      allQuestions,
      Math.ceil(targetCount / 2)
    )
    const combined = [...staticDistractors, ...sectionDistractors]
    yield* Effect.log(
      `Generated ${combined.length} distractors via hybrid approach for question ${question.questionNumber}`
    )
    return combined
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

// Pad distractors to target count if needed (following coding guide)
const padDistractors = (
  distractors: string[],
  targetCount: number,
  question: Question,
  allQuestions: Question[],
  correctAnswers: string[],
  qualityService: DistractorQualityService
): Effect.Effect<string[], never> =>
  Effect.gen(function* () {
    if (distractors.length >= targetCount) {
      return distractors.slice(0, targetCount)
    }

    const needed = targetCount - distractors.length
    const sectionPadding = yield* generateFromSection(question, allQuestions, needed)
    const filteredPadding = yield* qualityService
      .filterQualityDistractors(sectionPadding, correctAnswers)
      .pipe(Effect.catchAll(() => Effect.succeed(sectionPadding)))

    return [...distractors, ...filteredPadding].slice(0, targetCount)
  })

// Enhanced generation with multiple strategies (following coding guide)
export const generateEnhancedDistractors =
  (
    curatedDistractorService: CuratedDistractorService,
    openaiService: OpenAIDistractorService,
    qualityService: DistractorQualityService,
    similarityService: SimilarityService
  ) =>
  (
    question: Question,
    allQuestions: Question[],
    options: DistractorGenerationOptions
  ): Effect.Effect<DistractorGenerationResult, never> => {
    // Wrap the entire generation process with metrics
    return measureDuration(
      DistractorMetrics.questionProcessingTime,
      Effect.gen(function* () {
        const correctAnswers = question.answers.choices.map(getAnswerText)
        let rawDistractors: string[] = []
        let strategy: DistractorStrategy = 'curated'

        // Step 1: Try curated distractors first
        const curatedDistractors = curatedDistractorService.getDistractorsForQuestion(question)
        if (curatedDistractors.length >= options.targetCount) {
          rawDistractors = curatedDistractors.slice(0, options.targetCount)
          strategy = 'curated'
          yield* Effect.log(`Using curated distractors for question ${question.questionNumber}`)
        } else {
          // Step 2: Select strategy and generate raw distractors
          const selectedStrategy = yield* selectDistractorStrategy(question, options)
          strategy = selectedStrategy

          switch (selectedStrategy) {
            case 'openai-text': {
              const openaiDistractors = yield* generateWithOpenAI(
                openaiService,
                question,
                options.targetCount
              )
              if (openaiDistractors.length > 0) {
                rawDistractors = openaiDistractors
              } else {
                // Fallback to section-based generation
                rawDistractors = yield* generateFromSection(
                  question,
                  allQuestions,
                  options.targetCount
                )
                strategy = 'section-based'
                yield* Effect.log(
                  `OpenAI fallback: using section-based for question ${question.questionNumber}`
                )
              }
              break
            }

            case 'static-pool': {
              rawDistractors = yield* generateFromStaticPools(question, options.targetCount)
              yield* Effect.log(
                `Generated ${rawDistractors.length} distractors from static pools for question ${question.questionNumber}`
              )
              break
            }

            case 'section-based': {
              rawDistractors = yield* generateFromSection(
                question,
                allQuestions,
                options.targetCount
              )
              yield* Effect.log(
                `Generated ${rawDistractors.length} distractors from section for question ${question.questionNumber}`
              )
              break
            }

            case 'hybrid': {
              rawDistractors = yield* generateWithHybrid(
                question,
                allQuestions,
                options.targetCount
              )
              break
            }
          }

          // Add any curated distractors to supplement
          if (curatedDistractors.length > 0) {
            rawDistractors = [...curatedDistractors, ...rawDistractors]
          }
        }

        // Step 3: Apply quality filtering and similarity removal
        const filteredDistractors = yield* applyQualityFiltering(
          rawDistractors,
          correctAnswers,
          question.answers._type,
          options.filterSimilar,
          qualityService,
          similarityService
        )

        // Step 4: Ensure we have enough distractors, pad if needed
        const paddedDistractors = yield* padDistractors(
          filteredDistractors,
          options.targetCount,
          question,
          allQuestions,
          correctAnswers,
          qualityService
        )

        // Step 5: Track final metrics
        yield* Metric.increment(DistractorMetrics.questionsProcessed)
        if (rawDistractors.length - paddedDistractors.length > 0) {
          yield* Metric.incrementBy(
            DistractorMetrics.distractorsFiltered,
            rawDistractors.length - paddedDistractors.length
          )
        }

        return {
          question,
          distractors: paddedDistractors.slice(0, options.targetCount) as readonly string[],
          strategy,
          quality: {
            // TODO: Phase 2 - Calculate actual quality metrics based on:
            // 1. Semantic similarity scores between distractors and correct answers
            // 2. Difficulty assessment using readability metrics and concept complexity
            // 3. Educational value scoring based on common misconceptions and learning objectives
            // 4. Plausibility scoring using context similarity and domain knowledge
            // 5. Distractor effectiveness metrics from psychometric analysis
            relevanceScore: 0.8, // Will be calculated from semantic analysis
            plausibilityScore: 0.7, // Will be derived from context matching
            educationalValue: 0.8, // Will be based on learning objective alignment
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
          strategy: 'section-based' as DistractorStrategy,
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
 *    a. Check for curated distractors (highest priority)
 *    b. Select generation strategy based on question type
 *    c. Generate raw distractors using selected strategy
 *    d. Apply quality filtering
 *    e. Apply similarity filtering (if enabled)
 *    f. Pad to target count if needed
 *    g. Track metrics
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
 * @param curatedDistractorService - Service for hand-crafted distractors
 * @param openaiService - Service for AI-generated distractors
 * @param qualityService - Service for quality filtering
 * @param similarityService - Service for similarity detection
 * @returns Function that takes options and returns Effect with questions+distractors
 */
export const generateEnhanced =
  (
    questionsDataService: QuestionsDataService,
    curatedDistractorService: CuratedDistractorService,
    openaiService: OpenAIDistractorService,
    qualityService: DistractorQualityService,
    similarityService: SimilarityService
  ) =>
  (options: DistractorGenerationOptions): Effect.Effect<QuestionWithDistractors[], never> =>
    Effect.gen(function* () {
      const allQuestions = yield* questionsDataService.getAllQuestions()

      const results = yield* Effect.all(
        allQuestions.map((question) =>
          generateEnhancedDistractors(
            curatedDistractorService,
            openaiService,
            qualityService,
            similarityService
          )(question, [...allQuestions], options)
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
 * - {@link CuratedDistractorService} - Provides hand-crafted distractors
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
      const curatedDistractorService = yield* CuratedDistractorService
      const openaiService = yield* OpenAIDistractorService
      const qualityService = yield* DistractorQualityService
      const similarityService = yield* SimilarityService

      const generateEnhancedFn = generateEnhanced(
        questionsDataService,
        curatedDistractorService,
        openaiService,
        qualityService,
        similarityService
      )

      return {
        generateEnhanced: generateEnhancedFn,
        selectStrategy: selectDistractorStrategy,
        generateFromPools: generateFromStaticPools,
        generateFromSection: generateFromSection
      }
    }),
    dependencies: [
      QuestionsDataService.Default,
      CuratedDistractorService.Default,
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
  generateFromPools?: typeof generateFromStaticPools
  generateFromSection?: typeof generateFromSection
}) =>
  Layer.succeed(
    EnhancedStaticGenerator,
    EnhancedStaticGenerator.of({
      _tag: 'EnhancedStaticGenerator',
      generateEnhanced: fn?.generateEnhanced ?? (() => Effect.succeed([])),
      selectStrategy: fn?.selectStrategy ?? (() => Effect.succeed('curated')),
      generateFromPools: fn?.generateFromPools ?? (() => Effect.succeed(['mock pool distractor'])),
      generateFromSection:
        fn?.generateFromSection ?? (() => Effect.succeed(['mock section distractor']))
    })
  )
