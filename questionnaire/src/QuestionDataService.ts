import { Effect, Option, Layer, Random } from 'effect'
import type { QuestionWithDistractors } from 'distractions'
import type { StateAbbreviation } from 'civics2json'
import { QuestionNumber, PairedQuestionNumber, type Question } from './types'

export type QuestionDataSource = {
  questions: ReadonlyArray<QuestionWithDistractors>
  userState: StateAbbreviation
  questionNumbers?: ReadonlyArray<number> | undefined
}

/**
 * Shuffles an array of answers using Fisher-Yates algorithm with Effect Random
 * Returns the shuffled answers array and the index of the correct answer
 * Uses a specific correct answer rather than always the first one
 */
const shuffleAnswers = (
  correctAnswer: string,
  distractors: ReadonlyArray<string>
): Effect.Effect<{ answers: ReadonlyArray<string>; correctIndex: number }, never, never> => {
  return Effect.gen(function* () {
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
 * Creates a Question with shuffled answer choices using a specific correct answer
 */
const createQuestion = (
  questionNumber: QuestionNumber,
  pairedQuestionNumber: PairedQuestionNumber,
  questionText: string,
  correctAnswer: string,
  distractors: ReadonlyArray<string>
): Effect.Effect<Question, never, never> => {
  return Effect.gen(function* () {
    const { answers, correctIndex } = yield* shuffleAnswers(correctAnswer, distractors)

    return {
      questionNumber,
      pairedQuestionNumber,
      question: questionText,
      correctAnswer: correctIndex,
      correctAnswerText: correctAnswer,
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

/**
 * Transforms a single question with multiple correct answers into paired questions
 *
 * This implements the core paired question logic: for each correct answer in the original
 * question, creates a separate Question instance with its own pairedQuestionNumber.
 * This enables granular tracking of user performance on each specific answer choice.
 *
 * Example transformation:
 * - Original: "Name one U.S. Senator" with answers ["Feinstein", "Padilla"]
 * - Result: 2 Questions with pairedQuestionNumbers "20-0" and "20-1"
 */
const createQuestionsFromData = (
  questionWithDistractors: QuestionWithDistractors,
  userState: StateAbbreviation
): Effect.Effect<ReadonlyArray<Question>, never, never> => {
  return Effect.gen(function* () {
    const questionNumber = QuestionNumber(questionWithDistractors.questionNumber.toString())
    const correctAnswers = extractCorrectAnswers(questionWithDistractors, userState)

    if (correctAnswers.length === 0) {
      return []
    }

    // Create a separate paired question for each correct answer
    // This is the core of the paired question system: splitting one question
    // into multiple trackable instances based on correct answers
    const questionEffects = correctAnswers.map((correctAnswer, index) => {
      const pairedQuestionNumber = PairedQuestionNumber(
        `${questionWithDistractors.questionNumber}-${index}`
      )
      return createQuestion(
        questionNumber,
        pairedQuestionNumber,
        questionWithDistractors.question,
        correctAnswer,
        questionWithDistractors.distractors
      )
    })

    const questions = yield* Effect.all(questionEffects)
    return questions
  })
}

/**
 * Filters questions by question numbers if specified in the data source
 */
const filterQuestionsByNumbers = (
  questions: ReadonlyArray<QuestionWithDistractors>,
  questionNumbers?: ReadonlyArray<number>
): ReadonlyArray<QuestionWithDistractors> => {
  if (!questionNumbers || questionNumbers.length === 0) {
    return questions
  }

  const questionNumberSet = new Set(questionNumbers)
  return questions.filter((question) => questionNumberSet.has(question.questionNumber))
}

/**
 * Loads and transforms all questions from the data source into paired questions
 *
 * This function processes the entire question set, applying the paired question
 * transformation to each question. If questionNumbers are specified in the data source,
 * only those questions will be loaded. The result is a flattened array where each
 * paired question can be tracked individually for adaptive learning.
 */
export const loadQuestions = (
  dataSource: QuestionDataSource
): Effect.Effect<ReadonlyArray<Question>, never, never> => {
  return Effect.gen(function* () {
    // Filter questions by numbers if specified
    const filteredQuestions = filterQuestionsByNumbers(
      dataSource.questions,
      dataSource.questionNumbers
    )

    const questionEffects = filteredQuestions.map((question) =>
      createQuestionsFromData(question, dataSource.userState)
    )

    const questionArrays = yield* Effect.all(questionEffects)
    // Flatten the array of arrays into a single array of paired questions
    // Each element is now a trackable paired question with its own performance history
    const questions = questionArrays.flat()

    return questions
  })
}

export const getAvailableQuestionNumbers = (
  questions: ReadonlyArray<Question>
): ReadonlyArray<QuestionNumber> => {
  return questions.map((q) => q.questionNumber)
}

/**
 * Gets all available paired question numbers for selection
 *
 * Returns the complete list of paired question identifiers that can be used
 * for weighted random selection in the adaptive learning system.
 */
export const getAvailablePairedQuestionNumbers = (
  questions: ReadonlyArray<Question>
): ReadonlyArray<PairedQuestionNumber> => {
  return questions.map((q) => q.pairedQuestionNumber)
}

/**
 * Finds a question by original question number
 *
 * Note: This may return any of the paired questions that share the same
 * original question number. Use findQuestionByPairedNumber for specific
 * paired question lookup.
 */
export const findQuestionByNumber = (
  questionNumber: QuestionNumber,
  questions: ReadonlyArray<Question>
): Option.Option<Question> => {
  const found = questions.find((q) => q.questionNumber === questionNumber)
  return found ? Option.some(found) : Option.none()
}

/**
 * Finds a specific paired question by its paired question number
 *
 * This is the preferred method for looking up questions in the paired system,
 * as it provides exact matching to the specific answer variant being tracked.
 */
export const findQuestionByPairedNumber = (
  pairedQuestionNumber: PairedQuestionNumber,
  questions: ReadonlyArray<Question>
): Option.Option<Question> => {
  const found = questions.find((q) => q.pairedQuestionNumber === pairedQuestionNumber)
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
      getAvailablePairedQuestionNumbers,
      findQuestionByNumber,
      findQuestionByPairedNumber,
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
  getAvailablePairedQuestionNumbers?: (
    questions: ReadonlyArray<Question>
  ) => ReadonlyArray<PairedQuestionNumber>
  findQuestionByNumber?: (
    questionNumber: QuestionNumber,
    questions: ReadonlyArray<Question>
  ) => Option.Option<Question>
  findQuestionByPairedNumber?: (
    pairedQuestionNumber: PairedQuestionNumber,
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
      getAvailablePairedQuestionNumbers: fn?.getAvailablePairedQuestionNumbers ?? (() => []),
      findQuestionByNumber: fn?.findQuestionByNumber ?? (() => Option.none()),
      findQuestionByPairedNumber: fn?.findQuestionByPairedNumber ?? (() => Option.none()),
      getQuestionCount: fn?.getQuestionCount ?? (() => 0)
    })
  )
