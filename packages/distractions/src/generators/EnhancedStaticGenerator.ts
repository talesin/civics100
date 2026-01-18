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
import type {
  DistractorStrategy,
  DistractorGenerationResult,
  QuestionComplexity,
  CostEstimate,
  TemporalContext,
  FallbackChain
} from '../types/index'
import type { DistractorGenerationOptions } from '../types/config'
import { QuestionWithDistractors } from './StaticGenerator'
import {
  OpenAIError,
  OpenAIRateLimitError,
  OpenAIAuthError,
  OpenAITimeoutError
} from '../types/errors'
import {
  DistractorMetrics,
  measureDuration,
  trackStrategySelection,
  trackComplexity
} from '../utils/metrics'

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
 * Analyze the complexity of a civics question to guide strategy selection.
 *
 * **Complexity Types:**
 * - `simple-fact`: Direct recall questions (What is, Who is, When did)
 * - `conceptual`: Understanding-based questions (Why, How does, Explain)
 * - `comparative`: Analysis questions comparing concepts (difference, compare, contrast)
 * - `analytical`: Applied knowledge questions
 *
 * @param question - The civics question to analyze
 * @returns QuestionComplexity object with type, difficulty, and cognitive level
 */
export const analyzeComplexity = (question: Question): QuestionComplexity => {
  const text = question.question.toLowerCase()

  // Check comparative keywords FIRST - they can appear anywhere in question
  // and override the apparent simplicity of "What is the difference..."
  if (/\b(difference|compare|contrast|versus|vs\.?)\b/.test(text)) {
    return { type: 'comparative', difficulty: 4, cognitiveLevel: 'analyze' }
  }

  // Simple facts: "What is...", "Who is...", "When did...", "Where is..."
  if (/^(what|who|when|where) (is|was|are|were)\b/.test(text)) {
    return { type: 'simple-fact', difficulty: 1, cognitiveLevel: 'recall' }
  }

  // Name/identify questions are also simple recall
  if (/^name\b|^identify\b|^list\b/.test(text)) {
    return { type: 'simple-fact', difficulty: 2, cognitiveLevel: 'recall' }
  }

  // Conceptual: "Why...", "How does...", "Explain..."
  if (/^(why|how does|how do|explain)\b/.test(text)) {
    return { type: 'conceptual', difficulty: 3, cognitiveLevel: 'understand' }
  }

  // How many - usually simple recall
  if (/^how many\b/.test(text)) {
    return { type: 'simple-fact', difficulty: 2, cognitiveLevel: 'recall' }
  }

  // What do/does - often conceptual understanding
  if (/^what (do|does)\b/.test(text)) {
    return { type: 'conceptual', difficulty: 3, cognitiveLevel: 'understand' }
  }

  // Default to analytical for other question types
  return { type: 'analytical', difficulty: 2, cognitiveLevel: 'apply' }
}

/**
 * Estimate the cost of using OpenAI for a given question.
 *
 * **Cost Model (gpt-4o-mini):**
 * - Input: $0.15 per 1M tokens
 * - Output: $0.60 per 1M tokens
 * - Threshold: $0.001 per question (recommended maximum)
 *
 * @param question - The question to estimate cost for
 * @param strategy - The generation strategy being considered
 * @returns CostEstimate with token count, cost, and recommendation
 */
export const estimateCost = (question: Question, strategy: DistractorStrategy): CostEstimate => {
  if (strategy !== 'openai-text') {
    return { estimatedTokens: 0, estimatedCost: 0, shouldUseOpenAI: false }
  }

  // Estimate based on question length + expected response
  // Average of ~4 characters per token
  const inputTokens = Math.ceil(question.question.length / 4)
  const outputTokens = 200 // Average response size for 3-5 distractors

  // gpt-4o-mini pricing: $0.15/1M input, $0.60/1M output
  const inputCost = inputTokens * 0.00000015
  const outputCost = outputTokens * 0.0000006
  const totalCost = inputCost + outputCost

  return {
    estimatedTokens: inputTokens + outputTokens,
    estimatedCost: totalCost,
    shouldUseOpenAI: totalCost < 0.001 // Threshold: $0.001 per question
  }
}

/**
 * Get the fallback chain of strategies for a question.
 *
 * **Strategy Chains:**
 * - High-complexity conceptual questions: OpenAI → section → hybrid
 * - Structured data (senator, etc.): static-pool → section (never OpenAI)
 * - Default: OpenAI → static → section → hybrid
 *
 * @param question - The civics question
 * @returns Ordered array of strategies to try
 */
export const getFallbackChain = (question: Question): FallbackChain => {
  const complexity = analyzeComplexity(question)
  const answerType = question.answers._type

  // Structured data questions - never use OpenAI (static pools are better)
  if (['senator', 'representative', 'governor', 'capital'].includes(answerType)) {
    return ['static-pool', 'section-based'] as const
  }

  // High-complexity conceptual questions benefit most from OpenAI
  if (complexity.type === 'conceptual' && complexity.difficulty >= 3) {
    return ['openai-text', 'section-based', 'hybrid'] as const
  }

  // Comparative questions need intelligent generation
  if (complexity.type === 'comparative') {
    return ['openai-text', 'section-based', 'hybrid'] as const
  }

  // Simple facts can use static pools as fallback
  if (complexity.type === 'simple-fact') {
    return ['openai-text', 'static-pool', 'section-based'] as const
  }

  // Default chain with full fallback options
  return ['openai-text', 'static-pool', 'section-based', 'hybrid'] as const
}

/**
 * Select the optimal distractor generation strategy for a given question.
 *
 * **Strategy Selection Logic:**
 * Uses intelligent analysis to select the best strategy:
 * 1. Analyzes question complexity (simple fact, conceptual, comparative, analytical)
 * 2. Estimates API cost and checks against threshold
 * 3. Considers question type (structured data vs. text)
 * 4. Returns the first viable strategy from the fallback chain
 *
 * **Strategy Types:**
 * - `openai-text`: AI-generated distractors (best for conceptual questions)
 * - `static-pool`: Pre-populated pools (best for structured data)
 * - `section-based`: Related question answers (good fallback)
 * - `hybrid`: Combined approaches (maximum coverage)
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
    const answerType = question.answers._type
    const complexity = analyzeComplexity(question)
    const fallbackChain = getFallbackChain(question)

    // Track complexity classification
    yield* trackComplexity(complexity.type)

    let selectedStrategy: DistractorStrategy

    // If OpenAI is disabled, use static strategies only
    if (options.useOpenAI === false) {
      // For text questions, prefer section-based (static pools are for structured data)
      if (answerType === 'text') {
        selectedStrategy = 'section-based'
      } else {
        // Find first non-OpenAI strategy in the chain
        const staticStrategy = fallbackChain.find((s) => s !== 'openai-text')
        selectedStrategy = staticStrategy ?? 'static-pool'
      }
    }
    // For structured data, always use static pools (more accurate than AI)
    else if (['senator', 'representative', 'governor', 'capital'].includes(answerType)) {
      selectedStrategy = 'static-pool'
    } else {
      // Check cost for OpenAI strategy
      const costEstimate = estimateCost(question, 'openai-text')

      // If cost is acceptable and OpenAI is enabled, prefer it for text questions
      if (costEstimate.shouldUseOpenAI && answerType === 'text') {
        // Use OpenAI for complex questions, otherwise consider alternatives
        if (complexity.difficulty >= 3 || complexity.type === 'conceptual') {
          selectedStrategy = 'openai-text'
        } else if (complexity.type === 'simple-fact') {
          selectedStrategy = 'openai-text'
        } else {
          selectedStrategy = fallbackChain[0] ?? 'section-based'
        }
      }
      // For simple facts with text answers, OpenAI still helps but isn't required
      else if (complexity.type === 'simple-fact' && answerType === 'text') {
        selectedStrategy = costEstimate.shouldUseOpenAI ? 'openai-text' : 'section-based'
      } else {
        // Return first strategy from fallback chain
        selectedStrategy = fallbackChain[0] ?? 'section-based'
      }
    }

    // Track the selected strategy
    yield* trackStrategySelection(selectedStrategy)

    return selectedStrategy
  })

// Usage tracking for frequency balancing (module-level for session persistence)
const distractorUsageTracker = new Map<string, number>()

/**
 * Get temporal context from a question to filter pool by time period.
 *
 * @param question - The civics question
 * @returns TemporalContext with era and optional year range
 */
export const getTemporalContext = (question: Question): TemporalContext => {
  const text = question.question.toLowerCase()

  // Historical questions about founding era
  if (/founding|constitution|1700s|1800s|revolutionary|colonial|framers/.test(text)) {
    return { era: 'historical', relevantYears: [1776, 1865] as const }
  }

  // Civil War era
  if (/civil war|slavery|emancipation|lincoln/.test(text)) {
    return { era: 'historical', relevantYears: [1850, 1877] as const }
  }

  // Modern era (20th century)
  if (/world war|civil rights|cold war|20th century/.test(text)) {
    return { era: 'modern', relevantYears: [1900, 2000] as const }
  }

  // Current/contemporary questions
  if (/current|today|now|president is|currently|presently/.test(text)) {
    return { era: 'current' }
  }

  // Default to modern era
  return { era: 'modern', relevantYears: [1900, 2025] as const }
}

/**
 * Filter pool by regional relevance (remove same-state entries for state-specific questions).
 *
 * @param pool - The distractor pool to filter
 * @param correctAnswer - The correct answer to check against
 * @returns Filtered pool with same-state entries removed
 */
const filterByRegion = (pool: string[], correctAnswer: string): string[] => {
  // Match state abbreviations (e.g., "CA", "TX") or full state names in the answer
  const stateAbbrevPattern = /\b([A-Z]{2})\b/
  const correctStateMatch = correctAnswer.match(stateAbbrevPattern)

  if (!correctStateMatch) {
    // Try to find state name in the answer
    const stateNames = usStates.map((s) => s.toLowerCase())
    const answerLower = correctAnswer.toLowerCase()
    const foundState = stateNames.find((state) => answerLower.includes(state))
    if (foundState === undefined) return pool
  }

  const correctState = correctStateMatch?.[1]
  if (correctState === undefined) return pool

  // Remove entries from the same state (too obvious as wrong answers)
  return pool.filter((entry) => {
    const entryState = entry.match(stateAbbrevPattern)?.[1]
    return entryState !== correctState
  })
}

/**
 * Match pool entries by difficulty (similar length/complexity to correct answer).
 *
 * @param pool - The distractor pool
 * @param correctAnswer - The correct answer to match against
 * @returns Pool sorted and filtered by difficulty match
 */
const matchDifficulty = (pool: string[], correctAnswer: string): string[] => {
  const targetLength = correctAnswer.length
  const targetWordCount = correctAnswer.split(/\s+/).length

  return pool
    .map((entry) => ({
      entry,
      lengthDiff: Math.abs(entry.length - targetLength),
      wordCountDiff: Math.abs(entry.split(/\s+/).length - targetWordCount)
    }))
    .sort((a, b) => {
      // Prefer similar length/complexity (weighted score)
      const aScore = a.lengthDiff + a.wordCountDiff * 3
      const bScore = b.lengthDiff + b.wordCountDiff * 3
      return aScore - bScore
    })
    .slice(0, Math.ceil(pool.length * 0.7)) // Keep top 70% of matches
    .map((item) => item.entry)
}

/**
 * Balance frequency by preferring less-used distractors.
 *
 * @param pool - The distractor pool
 * @param targetCount - Target number of distractors needed
 * @returns Pool sorted by usage (least used first)
 */
const balanceFrequency = (pool: string[], targetCount: number): string[] => {
  return pool
    .map((entry) => ({
      entry,
      usageCount: distractorUsageTracker.get(entry) ?? 0
    }))
    .sort((a, b) => a.usageCount - b.usageCount)
    .slice(0, targetCount * 2) // Keep 2x target for variety
    .map((item) => item.entry)
}

/**
 * Track distractor usage for frequency balancing.
 *
 * @param distractors - Distractors being used
 */
const trackUsage = (distractors: string[]): void => {
  for (const distractor of distractors) {
    const current = distractorUsageTracker.get(distractor) ?? 0
    distractorUsageTracker.set(distractor, current + 1)
  }
}

// Static pool generation by type with enhanced filtering
export const generateFromStaticPools = (
  question: Question,
  targetCount: number
): Effect.Effect<string[], never> => {
  const answerType = question.answers._type
  const correctAnswers = question.answers.choices.map(getAnswerText)
  const primaryAnswer = correctAnswers[0] ?? ''

  let pool: string[] = []

  // Pool selection based on answer type
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
      // Mixed pool for unknown types
      pool = [...usStates, ...usCapitals].slice(0, 20)
  }

  // Step 1: Basic filtering - remove correct answers
  let candidates = pool.filter(
    (item) =>
      !correctAnswers.some(
        (answer) =>
          item.toLowerCase().includes(answer.toLowerCase()) ||
          answer.toLowerCase().includes(item.toLowerCase())
      )
  )

  // Step 2: Regional filtering for state-specific questions
  if (['senator', 'representative', 'governor'].includes(answerType)) {
    candidates = filterByRegion(candidates, primaryAnswer)
  }

  // Step 3: Difficulty matching
  candidates = matchDifficulty(candidates, primaryAnswer)

  // Step 4: Frequency balancing
  candidates = balanceFrequency(candidates, targetCount)

  // Random shuffle using Effect's Random for testability
  return Effect.gen(function* () {
    const shuffled = yield* Random.shuffle(candidates)
    const selected = Chunk.toReadonlyArray(shuffled).slice(0, targetCount)

    // Track usage for frequency balancing
    trackUsage([...selected])

    return selected
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
