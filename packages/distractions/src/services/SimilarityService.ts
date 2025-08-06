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

export const isSimilar = (answer: string, distractor: string) =>
  Effect.try({
    try: () => {
      const s1 = answer.split(' ')
      const s2 = distractor.split(' ')

      // As per the documentation, we need a word similarity function.
      // We'll use winklerMetaphone from similarity-score.
      const winkOpts = {
        f: similarityScore.winklerMetaphone,
        options: { threshold: 0 }
      }

      const result = similarity(s1, s2, winkOpts)

      // The documentation suggests multiplying score*order*size for a final score between 0 and 1.
      const finalScore = result.score * result.order * result.size

      // Let's set a threshold for similarity.
      return finalScore > 0.4
    },
    catch: (error) =>
      new SimilarityError({
        message: `Failed to compare sentences: ${
          error instanceof Error ? error.message : String(error)
        }`
      })
  })

// Service Definition
export class SimilarityService extends Effect.Service<SimilarityService>()('SimilarityService', {
  effect: Effect.succeed({
    isSimilar
  })
}) {}

export const TestSimilarityServiceLayer = (fn?: {
  isSimilar?: (answer: string, distractor: string) => Effect.Effect<boolean, SimilarityError>
}) =>
  Layer.succeed(
    SimilarityService,
    SimilarityService.of({
      _tag: 'SimilarityService',
      isSimilar: fn?.isSimilar ?? ((_answer: string, _distractor: string) => Effect.succeed(false))
    })
  )
