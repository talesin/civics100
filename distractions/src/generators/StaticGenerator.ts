import { Data, Effect, Layer } from 'effect'
import type { Question } from 'civics2json'
import { QuestionsDataService } from '../data/QuestionsDataService'
import { CuratedDistractorService } from '../services/CuratedDistractorService'

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
