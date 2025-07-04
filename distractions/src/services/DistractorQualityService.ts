import { Data, Effect, Layer } from 'effect'
import { SimilarityService, SimilarityError } from './SimilarityService'

export class DistractorQualityError extends Data.TaggedError('DistractorQualityError')<{
  readonly message: string
}> {}

export const filterQualityDistractors =
  (similarityService: SimilarityService) =>
  (candidates: readonly string[], correctAnswers: readonly string[]) =>
    Effect.gen(function* () {
      // Step 1: Remove exact matches (case-insensitive)
      const noExactMatches = candidates.filter(
        (candidate) =>
          !correctAnswers.some(
            (answer) => answer.toLowerCase().trim() === candidate.toLowerCase().trim()
          )
      )

      // Step 2: Remove very short fragments (less than 3 characters)
      const noShortFragments = noExactMatches.filter((candidate) => candidate.trim().length >= 3)

      // Step 3: Remove candidates that are substrings of correct answers or vice versa
      const noSubstrings = noShortFragments.filter((candidate) => {
        const candidateLower = candidate.toLowerCase().trim()
        return !correctAnswers.some((answer) => {
          const answerLower = answer.toLowerCase().trim()
          // Check if candidate is substring of answer or answer is substring of candidate
          return candidateLower.includes(answerLower) || answerLower.includes(candidateLower)
        })
      })

      // Step 4: Apply similarity filtering to avoid partial matches
      const notSimilar = yield* Effect.filter(noSubstrings, (candidate) =>
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
          array.findIndex(
            (item) => item.toLowerCase().trim() === candidate.toLowerCase().trim()
          ) === index
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

    default:
      return true // Allow anything for other types
  }
}

export const applyEnhancedQualityFilters =
  (similarityService: SimilarityService) =>
  (
    candidates: readonly string[],
    correctAnswers: readonly string[],
    questionType: string = 'unknown'
  ) =>
    Effect.gen(function* () {
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

      return semanticallyValid
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
      applyEnhancedQualityFilters: fn?.applyEnhancedQualityFilters ?? (() => Effect.succeed([]))
    })
  )
