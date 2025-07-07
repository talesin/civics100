import { Effect, Array as EffectArray, Option, Layer, Random } from 'effect'
import type { QuestionWithDistractors } from 'distractions'
import type { StateAbbreviation } from 'civics2json'
import { QuestionNumber, type Question } from './types'

export type QuestionDataSource = {
  questions: ReadonlyArray<QuestionWithDistractors>
  userState: StateAbbreviation
}

/**
 * Shuffles an array of answers using Fisher-Yates algorithm with Effect Random
 * Returns the shuffled answers array and the index of the correct answer
 */
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

/**
 * Creates a Question with shuffled answer choices
 */
const createQuestion = (
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

const extractCorrectAnswers = (
  question: QuestionWithDistractors,
  userState: StateAbbreviation
): ReadonlyArray<string> => {
  switch (question.answers._type) {
    case 'text':
      return question.answers.choices
    case 'senator':
      return question.answers.choices
        .filter((choice) => choice.state === userState)
        .map((choice) => choice.senator)
    case 'representative':
      return question.answers.choices
        .filter((choice) => choice.state === userState)
        .map((choice) => choice.representative)
    case 'governor':
      return question.answers.choices
        .filter((choice) => choice.state === userState)
        .map((choice) => choice.governor)
    case 'capital':
      return question.answers.choices
        .filter((choice) => choice.state === userState)
        .map((choice) => choice.capital)
    default:
      return []
  }
}

const createQuestionFromData = (
  questionWithDistractors: QuestionWithDistractors,
  userState: StateAbbreviation
): Effect.Effect<Option.Option<Question>, never, never> => {
  return Effect.gen(function* () {
    const questionNumber = QuestionNumber(questionWithDistractors.questionNumber.toString())
    const correctAnswers = extractCorrectAnswers(questionWithDistractors, userState)

    if (correctAnswers.length === 0) {
      return Option.none()
    }

    const question = yield* createQuestion(
      questionNumber,
      questionWithDistractors.question,
      correctAnswers,
      questionWithDistractors.distractors
    )

    return Option.some(question)
  })
}

export const loadQuestions = (
  dataSource: QuestionDataSource
): Effect.Effect<ReadonlyArray<Question>, never, never> => {
  return Effect.gen(function* () {
    const questionEffects = dataSource.questions.map((question) =>
      createQuestionFromData(question, dataSource.userState)
    )

    const questionOptions = yield* Effect.all(questionEffects)
    const questions = EffectArray.filterMap(
      questionOptions,
      Option.match({
        onNone: () => Option.none(),
        onSome: (question) => Option.some(question)
      })
    )

    return questions
  })
}

export const getAvailableQuestionNumbers = (
  questions: ReadonlyArray<Question>
): ReadonlyArray<QuestionNumber> => {
  return questions.map((q) => q.questionNumber)
}

export const findQuestionByNumber = (
  questionNumber: QuestionNumber,
  questions: ReadonlyArray<Question>
): Option.Option<Question> => {
  const found = questions.find((q) => q.questionNumber === questionNumber)
  return found ? Option.some(found) : Option.none()
}

export const getQuestionCount = (questions: ReadonlyArray<Question>): number => {
  return questions.length
}

/**
 * Service for managing question data loading and transformation
 * Handles loading questions from the distractions package
 */
export class QuestionDataService extends Effect.Service<QuestionDataService>()(
  'QuestionDataService',
  {
    effect: Effect.succeed({
      loadQuestions,
      getAvailableQuestionNumbers,
      findQuestionByNumber,
      getQuestionCount
    })
  }
) {}

/**
 * Test layer for QuestionDataService with mockable functions
 */
export const TestQuestionDataServiceLayer = (fn?: {
  loadQuestions?: (
    dataSource: QuestionDataSource
  ) => Effect.Effect<ReadonlyArray<Question>, never, never>
  getAvailableQuestionNumbers?: (
    questions: ReadonlyArray<Question>
  ) => ReadonlyArray<QuestionNumber>
  findQuestionByNumber?: (
    questionNumber: QuestionNumber,
    questions: ReadonlyArray<Question>
  ) => Option.Option<Question>
  getQuestionCount?: (questions: ReadonlyArray<Question>) => number
}) =>
  Layer.succeed(
    QuestionDataService,
    QuestionDataService.of({
      _tag: 'QuestionDataService',
      loadQuestions: fn?.loadQuestions ?? (() => Effect.succeed([])),
      getAvailableQuestionNumbers: fn?.getAvailableQuestionNumbers ?? (() => []),
      findQuestionByNumber: fn?.findQuestionByNumber ?? (() => Option.none()),
      getQuestionCount: fn?.getQuestionCount ?? (() => 0)
    })
  )
