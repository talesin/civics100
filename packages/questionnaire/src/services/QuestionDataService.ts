import { Effect, Option, Layer, Random } from 'effect'
import type { QuestionWithDistractors } from 'distractions'
import type { StateAbbreviation } from 'civics2json'
import { QuestionNumber, PairedQuestionNumber, type Question } from '../types'

export type QuestionDataSource = {
  questions: ReadonlyArray<QuestionWithDistractors>
  userState: StateAbbreviation
  userDistrict?: string | undefined
  questionNumbers?: ReadonlyArray<number> | undefined
}

/**
 * Fisher–Yates shuffle utility that returns a new shuffled copy of the input array.
 * Uses `Effect.Random` so it can be composed inside other Effect pipelines.
 */
const shuffleArray = (
  arr: ReadonlyArray<string>
): Effect.Effect<ReadonlyArray<string>, never, never> =>
  Effect.gen(function* () {
    const mutable = [...arr]
    for (let i = mutable.length - 1; i > 0; i--) {
      const j = yield* Random.nextIntBetween(0, i + 1)
      const temp = mutable[i]
      const swap = mutable[j]
      if (temp !== undefined && swap !== undefined) {
        mutable[i] = swap
        mutable[j] = temp
      }
    }
    return mutable
  })

/**
 * Randomly selects up to N distractors from the available pool.
 * If fewer distractors are available, returns all of them.
 */
const selectRandomDistractors = (
  distractors: ReadonlyArray<string>,
  count: number
): Effect.Effect<ReadonlyArray<string>, never, never> =>
  Effect.gen(function* () {
    if (distractors.length <= count) {
      return distractors
    }
    const shuffled = yield* shuffleArray(distractors)
    return shuffled.slice(0, count)
  })

/**
 * Determines the total number of options to display based on expected answers.
 * - 1 expected answer: 4 total options
 * - 2 expected answers: 6 total options
 * - 3+ expected answers: 8 total options
 */
const getTotalOptionCount = (expectedAnswers: number): number => {
  if (expectedAnswers <= 1) return 4
  if (expectedAnswers === 2) return 6
  return 8
}

/**
 * Determines how many distractors to include based on expected answers.
 * For single-answer questions: totalOptions - 1 (one correct answer)
 * For multi-answer questions: totalOptions - expectedAnswers
 */
const getDistractorCount = (expectedAnswers: number): number => {
  const total = getTotalOptionCount(expectedAnswers)
  return total - expectedAnswers
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
    const shuffled = yield* shuffleArray(allAnswers)
    const correctIndex = shuffled.indexOf(correctAnswer)

    return { answers: shuffled, correctIndex }
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
  distractors: ReadonlyArray<string>,
  expectedAnswers?: number
): Effect.Effect<Question, never, never> => {
  return Effect.gen(function* () {
    const count = getDistractorCount(expectedAnswers ?? 1)
    const selectedDistractors = yield* selectRandomDistractors(distractors, count)
    const { answers, correctIndex } = yield* shuffleAnswers(correctAnswer, selectedDistractors)

    return {
      questionNumber,
      pairedQuestionNumber,
      question: questionText,
      correctAnswer: correctIndex,
      correctAnswerText: correctAnswer,
      answers,
      ...(expectedAnswers !== undefined && { expectedAnswers })
    }
  })
}

/**
 * Randomly selects correct answers when there are more available than needed.
 * This ensures variety in multi-answer questions with large answer pools.
 */
const selectRandomCorrectAnswers = (
  correctAnswers: ReadonlyArray<string>,
  count: number
): Effect.Effect<ReadonlyArray<string>, never, never> =>
  Effect.gen(function* () {
    if (correctAnswers.length <= count) {
      return correctAnswers
    }
    const shuffled = yield* shuffleArray(correctAnswers)
    return shuffled.slice(0, count)
  })

/**
 * Create a unified multi-answer question with multiple correct answers
 *
 * When there are more correct answers than expectedAnswers (e.g., 22 Cabinet
 * positions but user needs to select 2), randomly selects expectedAnswers
 * correct answers to display alongside distractors, keeping total options
 * within the limit (6 for expectedAnswers=2).
 */
const createUnifiedMultiAnswerQuestion = (
  questionNumber: QuestionNumber,
  questionText: string,
  correctAnswers: ReadonlyArray<string>,
  distractors: ReadonlyArray<string>,
  expectedAnswers: number
): Effect.Effect<Question, never, never> => {
  return Effect.gen(function* () {
    // Select only expectedAnswers correct answers when pool is larger
    const selectedCorrectAnswers = yield* selectRandomCorrectAnswers(
      correctAnswers,
      expectedAnswers
    )

    const distractorCount = getDistractorCount(expectedAnswers)
    const selectedDistractors = yield* selectRandomDistractors(distractors, distractorCount)
    // Combine selected correct answers with selected distractors
    const allAnswers = [...selectedCorrectAnswers, ...selectedDistractors]

    // Create a unified pairedQuestionNumber for multi-answer questions
    const pairedQuestionNumber = PairedQuestionNumber(`${questionNumber}-unified`)

    // Shuffle all answers and track indices of correct answers
    const shuffled = yield* shuffleArray(allAnswers)

    // Find indices of correct answers in shuffled array
    const correctIndices = selectedCorrectAnswers
      .map((correctAnswer) => shuffled.findIndex((answer) => answer === correctAnswer))
      .filter((index) => index !== -1)

    return {
      questionNumber,
      pairedQuestionNumber,
      question: questionText,
      correctAnswer: correctIndices, // Array of correct indices for multi-answer
      correctAnswerText: selectedCorrectAnswers.join(', '),
      answers: shuffled,
      expectedAnswers
    }
  })
}

const extractCorrectAnswers = (
  question: QuestionWithDistractors,
  userState: StateAbbreviation,
  userDistrict?: string | undefined
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
        .filter(
          (choice) =>
            choice.state === userState && (userDistrict == null || choice.district === userDistrict)
        )
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
 * Transforms a single question into either unified multi-answer or paired questions
 *
 * For questions with expectedAnswers > 1, creates a unified question with multiple correct answers.
 * For questions with expectedAnswers = 1, uses the paired question system for granular tracking.
 *
 * Example transformations:
 * - Multi-answer: "What are two Cabinet positions?" → 1 unified Question with 2 correct indices
 * - Single-answer: "Name one U.S. Senator" → 2 Questions with pairedQuestionNumbers "20-0" and "20-1"
 */
const createQuestionsFromData = (
  questionWithDistractors: QuestionWithDistractors,
  userState: StateAbbreviation,
  userDistrict?: string | undefined
): Effect.Effect<ReadonlyArray<Question>, never, never> => {
  return Effect.gen(function* () {
    const questionNumber = QuestionNumber(questionWithDistractors.questionNumber.toString())
    const correctAnswers = extractCorrectAnswers(questionWithDistractors, userState, userDistrict)

    if (correctAnswers.length === 0) {
      return []
    }

    const expectedAnswers = questionWithDistractors.expectedAnswers ?? 1

    // For multi-answer questions, create a unified question
    if (expectedAnswers > 1) {
      const unifiedQuestion = yield* createUnifiedMultiAnswerQuestion(
        questionNumber,
        questionWithDistractors.question,
        correctAnswers,
        questionWithDistractors.distractors,
        expectedAnswers
      )
      return [unifiedQuestion]
    }

    // For single-answer questions, use the paired question system
    const questionEffects = correctAnswers.map((correctAnswer, index) => {
      const pairedQuestionNumber = PairedQuestionNumber(
        `${questionWithDistractors.questionNumber}-${index}`
      )
      return createQuestion(
        questionNumber,
        pairedQuestionNumber,
        questionWithDistractors.question,
        correctAnswer,
        questionWithDistractors.distractors,
        questionWithDistractors.expectedAnswers
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
      createQuestionsFromData(question, dataSource.userState, dataSource.userDistrict)
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
