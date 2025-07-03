import { Data, Effect } from 'effect'
import type { Question } from 'civics2json'
import { QuestionsDataService } from '../data/questions-data-service'
import { SimilarityService } from '../services/SimilarityService'

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

export class StaticGenerator extends Effect.Service<StaticGenerator>()('StaticGenerator', {
  effect: Effect.gen(function* () {
    const questionsDataService = yield* QuestionsDataService
    const similarityService = yield* SimilarityService

    const generate = () =>
      Effect.gen(function* () {
        const allQuestions = yield* questionsDataService.getAllQuestions()
        const allAnswers = allQuestions.flatMap((q) => q.answers.choices.map(getAnswerText))

        return yield* Effect.all(
          allQuestions.map((question) =>
            Effect.gen(function* () {
              const correctAnswers = question.answers.choices.map(getAnswerText)
              const potentialDistractors = allAnswers.filter((ans) => !correctAnswers.includes(ans))

              const distractors = yield* Effect.filter(potentialDistractors, (distractor) =>
                Effect.gen(function* () {
                  const isSimilar = yield* Effect.exists(correctAnswers, (answer) =>
                    similarityService.isSimilar(answer, distractor)
                  )
                  return !isSimilar
                })
              )

              return QuestionWithDistractors({
                ...question,
                distractors
              })
            })
          )
        )
      })

    return {
      generate
    }
  })
}) {}
