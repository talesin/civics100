import { Data, Effect, Layer } from 'effect'
// Using default imports, which is the modern way to handle CJS modules that export a function/object with `module.exports`.
// @ts-expect-error - no types available
import similarity from 'sentence-similarity'
// @ts-expect-error - no types available
import similarityScore from 'similarity-score'

// Define a structured error for better error handling
export class SimilarityError extends Data.TaggedError('SimilarityError')<{
  readonly message: string
}> {}

export interface SimilarityThresholds {
  readonly correctAnswerSimilarity: number // Max similarity to correct answers
  readonly distractorSimilarity: number // Max similarity between distractors
  readonly minimumDistance: number // Minimum semantic distance required
}

export const DEFAULT_SIMILARITY_THRESHOLDS: SimilarityThresholds = {
  correctAnswerSimilarity: 0.8,
  distractorSimilarity: 0.7,
  minimumDistance: 0.3
}

// Core function with dependency injection via currying (following coding guide)
export const calculateSimilarityScore = () =>
  (text1: string, text2: string): Effect.Effect<number, SimilarityError> =>
    Effect.try({
      try: () => {
        const s1 = text1.split(' ')
        const s2 = text2.split(' ')

        const winkOpts = {
          f: similarityScore.winklerMetaphone,
          options: { threshold: 0 }
        }

        const result = similarity(s1, s2, winkOpts)
        return result.score * result.order * result.size
      },
      catch: (error) =>
        new SimilarityError({
          message: `Failed to calculate similarity: ${
            error instanceof Error ? error.message : String(error)
          }`
        })
    })

export const isSimilar = (threshold: number = 0.4) =>
  (answer: string, distractor: string): Effect.Effect<boolean, SimilarityError> =>
    Effect.gen(function* () {
      const score = yield* calculateSimilarityScore()(answer, distractor)
      return score > threshold
    })

export const removeSimilarDistractors = (
  thresholds: SimilarityThresholds = DEFAULT_SIMILARITY_THRESHOLDS
) =>
  (distractors: string[], correctAnswers: string[]): Effect.Effect<string[], SimilarityError> =>
    Effect.gen(function* () {
    const filtered: string[] = []

    for (const distractor of distractors) {
      let isTooSimilar = false

      // Check similarity against correct answers
      for (const correctAnswer of correctAnswers) {
        const score = yield* calculateSimilarityScore()(distractor.toLowerCase(), correctAnswer.toLowerCase())
        if (score > thresholds.correctAnswerSimilarity) {
          isTooSimilar = true
          break
        }
      }

      // Check similarity against already accepted distractors
      if (!isTooSimilar) {
        for (const existing of filtered) {
          const score = yield* calculateSimilarityScore()(distractor.toLowerCase(), existing.toLowerCase())
          if (score > thresholds.distractorSimilarity) {
            isTooSimilar = true
            break
          }
        }
      }

      if (!isTooSimilar) {
        filtered.push(distractor)
      }
    }

    return filtered
  })

export const deduplicateDistractors = (
  thresholds: SimilarityThresholds = DEFAULT_SIMILARITY_THRESHOLDS
) =>
  (distractors: string[]): Effect.Effect<string[], SimilarityError> =>
    Effect.gen(function* () {
    const unique: string[] = []

    for (const distractor of distractors) {
      let isDuplicate = false

      for (const existing of unique) {
        const score = yield* calculateSimilarityScore()(distractor.toLowerCase(), existing.toLowerCase())
        if (score > thresholds.distractorSimilarity) {
          isDuplicate = true
          break
        }
      }

      if (!isDuplicate) {
        unique.push(distractor)
      }
    }

    return unique
  })

// Service class - minimal configuration (following coding guide)
export class SimilarityService extends Effect.Service<SimilarityService>()('SimilarityService', {
  effect: Effect.succeed({
    calculateSimilarity: calculateSimilarityScore(),
    isSimilar: isSimilar(),
    removeSimilar: removeSimilarDistractors(),
    deduplicate: deduplicateDistractors()
  })
}) {}

// Test layer following coding guide pattern
export const TestSimilarityServiceLayer = (fn?: {
  calculateSimilarity?: (text1: string, text2: string) => Effect.Effect<number, SimilarityError>
  isSimilar?: (answer: string, distractor: string) => Effect.Effect<boolean, SimilarityError>
  removeSimilar?: (distractors: string[], correctAnswers: string[]) => Effect.Effect<string[], SimilarityError>
  deduplicate?: (distractors: string[]) => Effect.Effect<string[], SimilarityError>
}) =>
  Layer.succeed(
    SimilarityService,
    SimilarityService.of({
      _tag: 'SimilarityService',
      calculateSimilarity: fn?.calculateSimilarity ?? ((_text1: string, _text2: string) => Effect.succeed(0.5)),
      isSimilar: fn?.isSimilar ?? ((_answer: string, _distractor: string) => Effect.succeed(false)),
      removeSimilar: fn?.removeSimilar ?? ((_distractors: string[], _correctAnswers: string[]) => Effect.succeed(['mock filtered distractor'])),
      deduplicate: fn?.deduplicate ?? ((_distractors: string[]) => Effect.succeed(['mock unique distractor']))
    })
  )
