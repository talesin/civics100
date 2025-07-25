import { Effect, Console, Option, Layer } from 'effect'
import questionsWithDistractors from 'distractions'
import type { StateAbbreviation } from 'civics2json'
import { PairedQuestionNumber, type PairedAnswers, type Question } from '../types'
import { QuestionSelector } from '../services/QuestionSelector'
import { QuestionDataService } from '../services/QuestionDataService'

/**
 * State for the CLI game including loaded questions and user answers
 *
 * Uses the paired question system where:
 * - questions: Array of individual paired questions (one per correct answer)
 * - answers: Performance history tracked per pairedQuestionNumber
 * - currentQuestion: The specific paired question being presented
 */
export type GameState = {
  questions: ReadonlyArray<Question>
  answers: PairedAnswers
  currentQuestion: Option.Option<Question>
}

/**
 * Initialize the game state by loading questions from data sources
 */
const initializeGame = (questionDataService: QuestionDataService) =>
  Effect.fn(function* (userState: StateAbbreviation, questionNumbers?: ReadonlyArray<number>) {
    const questions = yield* questionDataService.loadQuestions({
      questions: questionsWithDistractors,
      userState,
      questionNumbers
    })

    return {
      questions,
      answers: {},
      currentQuestion: Option.none()
    }
  })

/**
 * Record a user's answer to a specific paired question
 *
 * This maintains separate answer histories for each paired question,
 * enabling granular tracking of performance on individual answer choices.
 * Each pairedQuestionNumber (e.g., "20-0", "20-1") gets its own history.
 */
const recordAnswer = (
  pairedQuestionNumber: PairedQuestionNumber,
  isCorrect: boolean,
  answers: PairedAnswers
): PairedAnswers => {
  const currentHistory = answers[pairedQuestionNumber] ?? []
  const newEntry = { ts: new Date(), correct: isCorrect }

  return {
    ...answers,
    [pairedQuestionNumber]: [...currentHistory, newEntry]
  }
}

/**
 * Calculate overall game statistics across all paired questions
 *
 * Aggregates performance data from all paired questions to provide
 * comprehensive learning analytics. Each paired question contributes
 * its individual performance history to the overall statistics.
 */
const calculateOverallStats = (answers: PairedAnswers) => {
  const allAnswers = Object.values(answers).flat()
  const totalAnswered = allAnswers.length
  const correctAnswers = allAnswers.filter((answer) => answer.correct).length
  const questionsAttempted = Object.keys(answers).length
  const accuracy = totalAnswered > 0 ? correctAnswers / totalAnswered : 0

  return {
    questionsAttempted,
    totalAnswered,
    correctAnswers,
    incorrectAnswers: totalAnswered - correctAnswers,
    accuracy
  }
}

/**
 * Display a paired question with its answer choices and performance information
 *
 * Shows both the original question number and the paired question identifier
 * to help users understand they're working with a specific answer variant.
 * The expected answer and performance stats are specific to this paired question.
 */
const displayQuestion = (questionSelector: QuestionSelector) =>
  Effect.fn(function* (question: Question, weight: number, state: GameState) {
    const stats = questionSelector.getPairedQuestionStats(
      question.pairedQuestionNumber,
      state.answers
    )

    yield* Console.log(
      `\n✏️ Question ${question.questionNumber} (${question.pairedQuestionNumber}):`
    )
    yield* Console.log(question.question)
    yield* Console.log(`🎯 Expected answer: "${question.correctAnswerText}"`)

    // Show expected answers requirement if it's multiple choice
    if (question.expectedAnswers !== undefined && question.expectedAnswers > 1) {
      yield* Console.log(
        `📝 Select ${question.expectedAnswers} answers (separate with commas, e.g., A,C)`
      )
    } else {
      yield* Console.log(`📝 Select one answer`)
    }

    yield* Console.log(
      `⚖️ Selection weight: ${weight.toFixed(2)} | History: ${stats.totalAnswered} attempts, ${(stats.accuracy * 100).toFixed(1)}% accuracy`
    )
    yield* Console.log('')

    for (let i = 0; i < question.answers.length; i++) {
      const letter = String.fromCharCode(65 + i) // A, B, C, D...
      yield* Console.log(`${letter}. ${question.answers[i]}`)
    }

    yield* Console.log('')
  })

/**
 * Get the next paired question to ask based on weighted selection
 *
 * Uses the adaptive learning algorithm to select a paired question based on
 * individual performance history. Each paired question is weighted according
 * to its specific answer performance, enabling focused practice on weak areas.
 *
 * Returns both the question and its selection weight for display
 */
const getNextQuestion = (
  questionDataService: QuestionDataService,
  questionSelector: QuestionSelector
) =>
  Effect.fn(function* (state: GameState) {
    const availablePairedNumbers = questionDataService.getAvailablePairedQuestionNumbers(
      state.questions
    )
    const selectedPairedNumber = yield* questionSelector.selectPairedQuestion(
      availablePairedNumbers,
      state.answers
    )

    const question = selectedPairedNumber.pipe(
      Option.flatMap((pairedQuestionNumber) =>
        questionDataService.findQuestionByPairedNumber(pairedQuestionNumber, state.questions)
      ),
      Option.map((question) => {
        const stats = questionSelector.getPairedQuestionStats(
          question.pairedQuestionNumber,
          state.answers
        )
        const weight = calculateWeight(stats)
        return { question, weight }
      })
    )

    return question
  })

/**
 * Calculate weight for display based on question stats
 */
const calculateWeight = (stats: { totalAnswered: number; accuracy: number }): number => {
  if (stats.totalAnswered === 0) {
    return 10 // Unanswered weight
  }
  // Interpolate between incorrect (5) and correct (1) weights
  return 5 + (1 - 5) * stats.accuracy
}

/**
 * Display game statistics
 */
const displayStats = (state: GameState): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    const totalQuestions = state.questions.length
    const answeredQuestions = Object.keys(state.answers).length
    const totalAnswers = Object.values(state.answers).reduce(
      (sum, history) => sum + history.length,
      0
    )
    const correctAnswers = Object.values(state.answers)
      .flat()
      .filter((answer) => answer.correct).length

    const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0

    yield* Console.log(`
📊 Statistics:
Questions available: ${totalQuestions}
Questions attempted: ${answeredQuestions}
Total answers: ${totalAnswers}
Correct answers: ${correctAnswers}
Accuracy: ${accuracy.toFixed(1)}%
`)
  })

/**
 * Parse user input to extract answer indices
 */
const parseAnswerInput = (userInput: string, maxAnswers: number): number[] | null => {
  const cleanInput = userInput.trim().toUpperCase()

  // Handle single answer (e.g., "A")
  if (cleanInput.length === 1) {
    const answerIndex = cleanInput.charCodeAt(0) - 65 // A=0, B=1, etc.
    if (answerIndex >= 0 && answerIndex < maxAnswers) {
      return [answerIndex]
    }
    return null
  }

  // Handle multiple answers (e.g., "A,C" or "A, C")
  const parts = cleanInput.split(',').map((part) => part.trim())
  const indices: number[] = []

  for (const part of parts) {
    if (part.length !== 1) {
      return null
    }
    const answerIndex = part.charCodeAt(0) - 65
    if (answerIndex < 0 || answerIndex >= maxAnswers) {
      return null
    }
    if (indices.includes(answerIndex)) {
      return null // Duplicate answer
    }
    indices.push(answerIndex)
  }

  return indices.sort()
}

/**
 * Validate the user's selected answers against the correct answer indices.
 *
 * Handles both single-answer and multiple-answer questions.
 *
 * @param expectedCount - Number of answers expected for the question (defaults to 1)
 * @param answerIndices - The indices chosen by the user, sorted ascending
 * @param correctAnswerIndices - The indices that represent the correct answer(s)
 * @returns `true` if the user's selection is correct, `false` otherwise
 */
const validateAnswers = (
  expectedCount: number,
  answerIndices: number[],
  correctAnswerIndices: number[]
): boolean => {
  if (expectedCount === 1) {
    // Single-answer flow: an exact index match is required.
    return answerIndices[0] === correctAnswerIndices[0]
  }

  // Multi-answer flow: the user must provide the expected number of answers
  // and every selected index must be included in the correct set.
  return (
    answerIndices.length === expectedCount &&
    answerIndices.every((index) => correctAnswerIndices.includes(index))
  )
}

/**
 * Process a user's answer input for CLI
 */
const processAnswer = (
  userInput: string,
  question: Question,
  state: GameState
): Effect.Effect<GameState, never, never> =>
  Effect.gen(function* () {
    const answerIndices = parseAnswerInput(userInput, question.answers.length)

    if (!answerIndices) {
      const expectedCount = question.expectedAnswers ?? 1
      if (expectedCount === 1) {
        yield* Console.log('❌ Invalid answer. Please enter A, B, C, or D.')
      } else {
        yield* Console.log(
          `❌ Invalid answer. Please enter ${expectedCount} letters separated by commas (e.g., A,C).`
        )
      }
      return state
    }

    const istNonEmpty = <T>(arr: T[]): arr is [T, ...T[]] => arr.length > 0

    // Check if the number of answers matches expected
    const expectedCount = question.expectedAnswers ?? 1
    if (answerIndices.length !== expectedCount) {
      yield* Console.log(
        `❌ Please select exactly ${expectedCount} answer${expectedCount > 1 ? 's' : ''}.`
      )
      return state
    }

    // Handle both single and multiple answer questions
    const correctAnswerIndices: number[] = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [question.correctAnswer]

    // Validate user answers
    const isCorrect = validateAnswers(expectedCount, answerIndices, correctAnswerIndices)

    const selectedLetters = answerIndices.map((i) => String.fromCharCode(65 + i)).join(', ')

    if (isCorrect) {
      yield* Console.log('✅ Correct!')
    } else {
      if (expectedCount === 1 && istNonEmpty(correctAnswerIndices)) {
        const correctLetter = String.fromCharCode(65 + correctAnswerIndices[0])
        yield* Console.log(`❌ Incorrect. The correct answer was ${correctLetter}.`)
      } else {
        const correctLetters = correctAnswerIndices
          .slice(0, expectedCount)
          .map((i) => String.fromCharCode(65 + i))
          .join(', ')
        yield* Console.log(
          `❌ Incorrect. You selected: ${selectedLetters}. You need to select ${expectedCount} correct answers from: ${correctLetters}.`
        )
      }
    }

    const newAnswers = recordAnswer(question.pairedQuestionNumber, isCorrect, state.answers)

    const overallStats = calculateOverallStats(newAnswers)
    yield* Console.log(
      `Overall progress - Questions: ${overallStats.questionsAttempted}, Answers: ${overallStats.totalAnswered}, Accuracy: ${(overallStats.accuracy * 100).toFixed(1)}%`
    )

    return {
      ...state,
      answers: newAnswers,
      currentQuestion: Option.none()
    }
  })

/**
 * CLI-specific GameService for command-line interface interactions
 * Contains CLI-focused game logic and user interaction functionality
 */
export class CLIGameService extends Effect.Service<CLIGameService>()('CLIGameService', {
  effect: Effect.gen(function* () {
    const questionDataService = yield* QuestionDataService
    const questionSelector = yield* QuestionSelector

    return {
      // CLI-focused methods
      initializeGame: initializeGame(questionDataService),
      getNextQuestion: getNextQuestion(questionDataService, questionSelector),
      displayQuestion: displayQuestion(questionSelector),
      displayStats,
      processAnswer
    }
  }),
  dependencies: [QuestionDataService.Default, QuestionSelector.Default]
}) {}

/**
 * Test layer for CLIGameService with mockable functions
 */
export const TestCLIGameServiceLayer = (fn?: {
  // CLI methods
  initializeGame?: CLIGameService['initializeGame']
  getNextQuestion?: CLIGameService['getNextQuestion']
  displayQuestion?: CLIGameService['displayQuestion']
  displayStats?: CLIGameService['displayStats']
  processAnswer?: CLIGameService['processAnswer']
}) =>
  Layer.succeed(
    CLIGameService,
    CLIGameService.of({
      _tag: 'CLIGameService',
      // CLI methods
      initializeGame:
        fn?.initializeGame ??
        ((_userState: StateAbbreviation, _questionNumbers?: ReadonlyArray<number>) =>
          Effect.succeed({
            questions: [],
            answers: {},
            currentQuestion: Option.none()
          })),
      getNextQuestion: fn?.getNextQuestion ?? (() => Effect.succeed(Option.none())),
      displayQuestion: fn?.displayQuestion ?? (() => Effect.void),
      displayStats: fn?.displayStats ?? (() => Effect.void),
      processAnswer: fn?.processAnswer ?? ((_userInput, _question, state) => Effect.succeed(state))
    })
  )
