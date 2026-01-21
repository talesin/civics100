import { Data, Effect, Layer } from 'effect'
import { SimilarityService, SimilarityError } from './SimilarityService'

export class DistractorQualityError extends Data.TaggedError('DistractorQualityError')<{
  readonly message: string
}> {}

export const filterQualityDistractors = (similarityService: SimilarityService) =>
  Effect.fn(function* (candidates: readonly string[], correctAnswers: readonly string[]) {
    // Step 1: Remove exact matches (case-insensitive)
    const noExactMatches = candidates.filter(
      (candidate) =>
        !correctAnswers.some(
          (answer) => answer.toLowerCase().trim() === candidate.toLowerCase().trim()
        )
    )

    // Step 2: Remove very short fragments (less than 3 characters)
    const noShortFragments = noExactMatches.filter((candidate) => candidate.trim().length >= 3)

    // Step 3: Remove candidates that match whole correct answers (not just substrings)
    // Uses word-based matching to avoid filtering valid distractors that share common words
    const noMatches = noShortFragments.filter((candidate) => {
      const candidateLower = candidate.toLowerCase().trim()
      const candidateWords = new Set(candidateLower.split(/\s+/))

      return !correctAnswers.some((answer) => {
        const answerLower = answer.toLowerCase().trim()
        const answerWords = new Set(answerLower.split(/\s+/))

        // Only filter if:
        // 1. Exact match (same string)
        // 2. High word overlap (>75% of words match, excluding short words)
        if (candidateLower === answerLower) return true

        // Calculate word overlap (only count words > 2 characters to ignore articles/prepositions)
        const commonWords = [...candidateWords].filter((w) => answerWords.has(w) && w.length > 2)
        const overlapRatio = commonWords.length / Math.min(candidateWords.size, answerWords.size)

        return overlapRatio > 0.75
      })
    })

    // Step 4: Apply similarity filtering to avoid partial matches
    const notSimilar = yield* Effect.filter(noMatches, (candidate) =>
      Effect.gen(function* () {
        const isSimilar = yield* Effect.exists(correctAnswers, (answer) =>
          similarityService.isSimilar(answer, candidate)
        )
        return !isSimilar
      })
    )

    // Step 5: Remove duplicates (case-insensitive)
    const uniqueDistractors = notSimilar.filter(
      (candidate, index, array) =>
        array.findIndex((item) => item.toLowerCase().trim() === candidate.toLowerCase().trim()) ===
        index
    )

    // Step 6: Filter out empty or whitespace-only strings
    const noEmptyStrings = uniqueDistractors.filter((candidate) => candidate.trim().length > 0)

    return noEmptyStrings
  })

export const validateDistractorCompleteness = (distractor: string): boolean => {
  const trimmed = distractor.trim()

  // Check if it's a complete phrase/name (not a fragment)
  // Fragments often end with incomplete words or have weird punctuation
  if (trimmed.length < 3) return false

  // Check for common fragment patterns
  const fragmentPatterns = [
    /^[a-z]/, // Starts with lowercase (likely a fragment)
    /\(\s*$/, // Ends with open parenthesis
    /^\s*\)/, // Starts with close parenthesis
    /[,;]\s*$/, // Ends with comma or semicolon
    /^\s*[,;]/, // Starts with comma or semicolon
    /\s+$\s+/ // Multiple spaces at end
  ]

  return !fragmentPatterns.some((pattern) => pattern.test(trimmed))
}

/**
 * Standardizes distractor format to match the format of correct answers.
 * This helps ensure distractors don't stand out due to inconsistent formatting.
 */
export const standardizeDistractorFormat = (
  distractor: string,
  correctAnswers: readonly string[]
): string => {
  const trimmedDistractor = distractor.trim()

  // Analyze the format patterns in correct answers
  const hasParentheses = correctAnswers.some(
    (answer) => answer.includes('(') && answer.includes(')')
  )
  const startsWithRightTo = correctAnswers.some((answer) =>
    answer.toLowerCase().startsWith('right to')
  )
  const isShortForm = correctAnswers.every((answer) => answer.split(' ').length <= 2)
  const hasArticles = correctAnswers.some((answer) => /^(the|a|an)\s/.test(answer.toLowerCase()))

  let standardized = trimmedDistractor

  // If correct answers have parentheses, consider adding them to distractors that could benefit
  if (hasParentheses && !standardized.includes('(')) {
    // For amendment-related questions, add constitutional context
    if (correctAnswers.some((answer) => answer.toLowerCase().includes('constitution'))) {
      if (
        standardized.toLowerCase().includes('law') ||
        standardized.toLowerCase().includes('decision') ||
        standardized.toLowerCase().includes('order')
      ) {
        // Don't add parentheses to these as they're different concepts
      }
    }
  }

  // If correct answers are in short form (1-2 words), prefer short form distractors
  if (isShortForm && standardized.toLowerCase().startsWith('right to ')) {
    // Convert "right to bear arms" to "bear arms" to match short format
    standardized = standardized.replace(/^right to /i, '')
  }

  // If correct answers don't start with "right to", remove it from distractors
  if (!startsWithRightTo && standardized.toLowerCase().startsWith('right to ')) {
    standardized = standardized.replace(/^right to /i, '')
  }

  // If correct answers have articles, ensure distractors do too when appropriate
  if (hasArticles && !standardized.toLowerCase().match(/^(the|a|an)\s/)) {
    // Add article for anthem names, songs, documents
    if (
      standardized.toLowerCase().includes('banner') ||
      standardized.toLowerCase().includes('hymn') ||
      standardized.toLowerCase().includes('song') ||
      standardized.toLowerCase().includes('america') ||
      standardized.toLowerCase().includes('hymn')
    ) {
      standardized = 'The ' + standardized
    }
  }

  return standardized
}

export const semanticValidation = (distractor: string, questionType: string): boolean => {
  const distractorLower = distractor.toLowerCase()

  // Basic semantic validation rules
  switch (questionType) {
    case 'president':
      // Should look like a person's name
      return /^[A-Z][a-z]+ [A-Z]/.test(distractor) || /^[A-Z][a-z]+$/.test(distractor)

    case 'state':
      // Should look like a proper noun (state name)
      return /^[A-Z]/.test(distractor)

    case 'war':
      // Should contain typical war-related terms
      return (
        distractorLower.includes('war') ||
        distractorLower.includes('revolution') ||
        distractorLower.includes('conflict') ||
        /^(World War|Korean War|Vietnam War|Civil War)/.test(distractor)
      )

    case 'document':
      // Should look like a document name
      return (
        distractorLower.includes('constitution') ||
        distractorLower.includes('declaration') ||
        distractorLower.includes('act') ||
        distractorLower.includes('amendment') ||
        /^the [A-Z]/.test(distractor)
      )

    case 'anthem':
      // Should look like a song/anthem name
      return (
        distractorLower.includes('banner') ||
        distractorLower.includes('anthem') ||
        distractorLower.includes('song') ||
        distractorLower.includes('hymn') ||
        /^the [A-Z]/.test(distractor) ||
        /^[A-Z].*[A-Z]/.test(distractor) // Proper capitalization pattern
      )

    default:
      return true // Allow anything for other types
  }
}

export const applyEnhancedQualityFilters = (similarityService: SimilarityService) =>
  Effect.fn(function* (
    candidates: readonly string[],
    correctAnswers: readonly string[],
    questionType: string = 'unknown'
  ) {
    // Apply basic quality filters first
    const basicFiltered = yield* filterQualityDistractors(similarityService)(
      candidates,
      correctAnswers
    )

    // Apply completeness validation
    const completeDistractors = basicFiltered.filter(validateDistractorCompleteness)

    // Apply semantic validation
    const semanticallyValid = completeDistractors.filter((distractor) =>
      semanticValidation(distractor, questionType)
    )

    // Apply format standardization to ensure consistency with correct answers
    const formatStandardized = semanticallyValid.map((distractor) =>
      standardizeDistractorFormat(distractor, correctAnswers)
    )

    return formatStandardized
  })

export class DistractorQualityService extends Effect.Service<DistractorQualityService>()(
  'DistractorQualityService',
  {
    effect: Effect.gen(function* () {
      const similarityService = yield* SimilarityService

      return {
        filterQualityDistractors: filterQualityDistractors(similarityService),
        validateDistractorCompleteness,
        semanticValidation,
        standardizeDistractorFormat,
        applyEnhancedQualityFilters: applyEnhancedQualityFilters(similarityService)
      }
    }),
    dependencies: [SimilarityService.Default]
  }
) {}

export const TestDistractorQualityServiceLayer = (fn?: {
  filterQualityDistractors?: (
    candidates: readonly string[],
    correctAnswers: readonly string[]
  ) => Effect.Effect<string[], SimilarityError>
  validateDistractorCompleteness?: (distractor: string) => boolean
  semanticValidation?: (distractor: string, questionType: string) => boolean
  standardizeDistractorFormat?: (distractor: string, correctAnswers: readonly string[]) => string
  applyEnhancedQualityFilters?: (
    candidates: readonly string[],
    correctAnswers: readonly string[],
    questionType?: string
  ) => Effect.Effect<string[], SimilarityError>
}) =>
  Layer.succeed(
    DistractorQualityService,
    DistractorQualityService.of({
      _tag: 'DistractorQualityService',
      filterQualityDistractors: fn?.filterQualityDistractors ?? (() => Effect.succeed([])),
      validateDistractorCompleteness: fn?.validateDistractorCompleteness ?? (() => true),
      semanticValidation: fn?.semanticValidation ?? (() => true),
      standardizeDistractorFormat: fn?.standardizeDistractorFormat ?? ((distractor) => distractor),
      applyEnhancedQualityFilters: fn?.applyEnhancedQualityFilters ?? (() => Effect.succeed([]))
    })
  )
