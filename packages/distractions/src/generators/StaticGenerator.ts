/**
 * StaticGenerator - Basic Distractor Generation
 *
 * @deprecated This generator is kept for backward compatibility and testing purposes.
 * For production use, prefer {@link EnhancedStaticGenerator} which includes:
 * - OpenAI integration for higher quality text distractors
 * - Quality filtering and similarity detection
 * - Multiple generation strategies with intelligent selection
 * - Comprehensive metrics and error handling
 *
 * @module StaticGenerator
 *
 * **Purpose:**
 * Provides basic distractor generation using only curated distractors and
 * section-based fallback. This is a simple, deterministic generator that
 * doesn't require external API calls.
 *
 * **Use Cases:**
 * - Testing and development (no API key required)
 * - Fallback when OpenAI is unavailable
 * - Quick prototyping
 * - Integration tests that need predictable behavior
 *
 * **Limitations:**
 * - No quality filtering or similarity detection
 * - Limited distractor variety for text questions
 * - Section-based approach may produce low-quality distractors
 * - No configurable options
 *
 * @example
 * ```typescript
 * import { StaticGenerator } from './generators/StaticGenerator'
 *
 * const program = Effect.gen(function* () {
 *   const generator = yield* StaticGenerator
 *   const questionsWithDistractors = yield* generator.generate()
 *   return questionsWithDistractors
 * })
 * ```
 */

import { Data, Effect, Layer } from 'effect'
import type { Question } from 'civics2json'
import { QuestionsDataService } from '../data/QuestionsDataService'
import { CuratedDistractorService } from '../services/CuratedDistractorService'

/**
 * Question with generated distractors attached.
 * This is the output type for both StaticGenerator and EnhancedStaticGenerator.
 */
export type QuestionWithDistractors = Question & {
  readonly _tag: 'QuestionWithDistractors'
  readonly distractors: readonly string[]
}

export const QuestionWithDistractors =
  Data.tagged<QuestionWithDistractors>('QuestionWithDistractors')

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
  // This case should not be reached with valid data
  return ''
}

/**
 * Generate distractors for all questions using basic strategies.
 *
 * **Strategy:**
 * 1. First tries to use curated distractors (if available)
 * 2. Falls back to section-based generation (using answers from other questions in same section)
 *
 * **Note:** This function does not support configuration options. For configurable
 * generation with quality filtering, use {@link EnhancedStaticGenerator}.
 *
 * @param questionsDataService - Service to fetch all questions
 * @param curatedDistractorService - Service to fetch hand-crafted distractors
 * @returns Effect that produces array of questions with distractors
 */
export const generate = (
  questionsDataService: QuestionsDataService,
  curatedDistractorService: CuratedDistractorService
) =>
  Effect.fn(function* () {
    const allQuestions = yield* questionsDataService.getAllQuestions()

    return yield* Effect.all(
      allQuestions.map((question) =>
        Effect.gen(function* () {
          let finalDistractors: readonly string[]

          // Try to get curated distractors first
          const curatedDistractors = curatedDistractorService.getDistractorsForQuestion(question)

          if (curatedDistractors.length > 0) {
            finalDistractors = curatedDistractors
            yield* Effect.log(`Using curated distractors for question ${question.questionNumber}`)
          } else {
            // Fallback to section-based approach
            const correctAnswers = question.answers.choices.map(getAnswerText)
            const potentialDistractorPool = allQuestions
              .filter(
                (q) =>
                  q.section === question.section && q.questionNumber !== question.questionNumber
              )
              .flatMap((q) => q.answers.choices.map(getAnswerText))
              .filter((answer) => !correctAnswers.includes(answer))

            // Take first 4 unique distractors
            const uniqueDistractors = [...new Set(potentialDistractorPool)].slice(0, 4)
            finalDistractors = uniqueDistractors
            yield* Effect.log(
              `Using section-based fallback for question ${question.questionNumber}`
            )
          }

          return QuestionWithDistractors({
            ...question,
            distractors: finalDistractors
          })
        })
      )
    )
  })

/**
 * StaticGenerator Service
 *
 * **Status:** Maintained for backward compatibility
 *
 * **Recommendation:** Use {@link EnhancedStaticGenerator} for new code.
 *
 * Provides basic distractor generation without external dependencies.
 * Useful for testing and development scenarios where you don't want
 * to make API calls or need deterministic behavior.
 */
export class StaticGenerator extends Effect.Service<StaticGenerator>()('StaticGenerator', {
  effect: Effect.gen(function* () {
    const questionsDataService = yield* QuestionsDataService
    const curatedDistractorService = yield* CuratedDistractorService

    return {
      generate: generate(questionsDataService, curatedDistractorService)
    }
  }),
  dependencies: [QuestionsDataService.Default, CuratedDistractorService.Default]
}) {}

export const TestStaticGeneratorLayer = (fn?: {
  generate?: () => Effect.Effect<QuestionWithDistractors[]>
}) =>
  Layer.succeed(
    StaticGenerator,
    StaticGenerator.of({
      _tag: 'StaticGenerator',
      generate: fn?.generate ?? (() => Effect.succeed([]))
    })
  )
