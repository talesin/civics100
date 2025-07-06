import { Effect, Option, Random } from 'effect'
import type { Answers, Question, QuestionNumber, WeightedQuestion, SelectionWeights } from './types'

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

const shuffleAnswers = (
  correctAnswers: ReadonlyArray<string>,
  distractors: ReadonlyArray<string>
): Effect.Effect<{ answers: ReadonlyArray<string>; correctIndex: number }, never, never> => {
  return Effect.gen(function* () {
    const correctAnswer = correctAnswers[0]
    if (correctAnswer === undefined || correctAnswer === '') {
      return { answers: [], correctIndex: -1 }
    }

    const allAnswers = [correctAnswer, ...distractors]

    // Manual Fisher-Yates shuffle using Effect Random
    const mutableAnswers = [...allAnswers]
    for (let i = mutableAnswers.length - 1; i > 0; i--) {
      const j = yield* Random.nextIntBetween(0, i + 1)
      const temp = mutableAnswers[i]
      const swapValue = mutableAnswers[j]
      if (temp !== undefined && swapValue !== undefined) {
        mutableAnswers[i] = swapValue
        mutableAnswers[j] = temp
      }
    }

    const correctIndex = mutableAnswers.indexOf(correctAnswer)

    return { answers: mutableAnswers, correctIndex }
  })
}

export const createQuestion = (
  questionNumber: QuestionNumber,
  questionText: string,
  correctAnswers: ReadonlyArray<string>,
  distractors: ReadonlyArray<string>
): Effect.Effect<Question, never, never> => {
  return Effect.gen(function* () {
    const { answers, correctIndex } = yield* shuffleAnswers(correctAnswers, distractors)

    return {
      questionNumber,
      question: questionText,
      correctAnswer: correctIndex,
      answers
    }
  })
}

export const getQuestionStats = (questionNumber: QuestionNumber, answers: Answers) => {
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
