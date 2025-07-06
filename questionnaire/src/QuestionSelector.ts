import { Effect, Option, Random, Layer } from 'effect'
import type { Answers, QuestionNumber, WeightedQuestion, SelectionWeights } from './types'

const DEFAULT_WEIGHTS: SelectionWeights = {
  unanswered: 10,
  incorrect: 5,
  correct: 1
}

const calculateQuestionWeight = (
  questionNumber: QuestionNumber,
  answers: Answers,
  weights: SelectionWeights = DEFAULT_WEIGHTS
): number => {
  const history = answers[questionNumber]

  if (!history || history.length === 0) {
    return weights.unanswered
  }

  const lastAnswer = history[history.length - 1]
  return lastAnswer?.correct === true ? weights.correct : weights.incorrect
}

const createWeightedQuestions = (
  availableQuestions: ReadonlyArray<QuestionNumber>,
  answers: Answers,
  weights?: SelectionWeights
): ReadonlyArray<WeightedQuestion> => {
  return availableQuestions.map((questionNumber) => ({
    questionNumber,
    weight: calculateQuestionWeight(questionNumber, answers, weights)
  }))
}

const selectWeightedRandom = (
  weightedQuestions: ReadonlyArray<WeightedQuestion>
): Effect.Effect<Option.Option<QuestionNumber>, never, never> => {
  if (weightedQuestions.length === 0) {
    return Effect.succeed(Option.none())
  }

  const totalWeight = weightedQuestions.reduce((sum, wq) => sum + wq.weight, 0)

  if (totalWeight === 0) {
    return Effect.succeed(Option.none())
  }

  return Effect.gen(function* () {
    const randomValue = yield* Random.nextIntBetween(1, totalWeight + 1)

    let cumulativeWeight = 0
    for (const weightedQuestion of weightedQuestions) {
      cumulativeWeight += weightedQuestion.weight
      if (randomValue <= cumulativeWeight) {
        return Option.some(weightedQuestion.questionNumber)
      }
    }

    return Option.none()
  })
}

export const selectQuestion = (
  availableQuestions: ReadonlyArray<QuestionNumber>,
  answers: Answers,
  weights?: SelectionWeights
): Effect.Effect<Option.Option<QuestionNumber>, never, never> => {
  const weightedQuestions = createWeightedQuestions(availableQuestions, answers, weights)
  return selectWeightedRandom(weightedQuestions)
}

const getQuestionStats = (questionNumber: QuestionNumber, answers: Answers) => {
  const history = answers[questionNumber] ?? []
  const totalAnswered = history.length
  const correctAnswers = history.filter((answer) => answer.correct).length
  const incorrectAnswers = totalAnswered - correctAnswers
  const accuracy = totalAnswered > 0 ? correctAnswers / totalAnswered : 0

  return {
    totalAnswered,
    correctAnswers,
    incorrectAnswers,
    accuracy
  }
}

/**
 * Service for question selection and statistics
 * Handles weighted question selection based on answer history
 */
export class QuestionSelector extends Effect.Service<QuestionSelector>()('QuestionSelector', {
  effect: Effect.gen(function* () {
    return {
      selectQuestion: (
        availableQuestions: ReadonlyArray<QuestionNumber>,
        answers: Answers,
        weights?: SelectionWeights
      ) => selectQuestion(availableQuestions, answers, weights),
      getQuestionStats: (questionNumber: QuestionNumber, answers: Answers) =>
        getQuestionStats(questionNumber, answers)
    }
  })
}) {}

/**
 * Test layer for QuestionSelector with mockable functions
 */
export const TestQuestionSelectorLayer = (fn?: {
  selectQuestion?: (
    availableQuestions: ReadonlyArray<QuestionNumber>,
    answers: Answers,
    weights?: SelectionWeights
  ) => Effect.Effect<Option.Option<QuestionNumber>, never, never>
  getQuestionStats?: (
    questionNumber: QuestionNumber,
    answers: Answers
  ) => {
    totalAnswered: number
    correctAnswers: number
    incorrectAnswers: number
    accuracy: number
  }
}) =>
  Layer.succeed(
    QuestionSelector,
    QuestionSelector.of({
      _tag: 'QuestionSelector',
      selectQuestion: fn?.selectQuestion ?? (() => Effect.succeed(Option.none())),
      getQuestionStats:
        fn?.getQuestionStats ??
        (() => ({ totalAnswered: 0, correctAnswers: 0, incorrectAnswers: 0, accuracy: 0 }))
    })
  )
