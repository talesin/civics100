import { Effect, Console, Option, Layer } from 'effect'
import questionsWithDistractors from 'distractions'
import type { StateAbbreviation } from 'civics2json'
import { PairedQuestionNumber, type PairedAnswers, type Question } from '../types'
import { QuestionSelector } from '../QuestionSelector'
import { QuestionDataService } from '../QuestionDataService'

/**
 * State for the game including loaded questions and user answers
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
const initializeGame = (
  questionDataService: QuestionDataService,
  userState: StateAbbreviation,
  questionNumbers?: ReadonlyArray<number>
): Effect.Effect<GameState, never, never> =>
  Effect.gen(function* () {
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
const displayQuestion = (
  question: Question,
  weight: number,
  state: GameState,
  questionSelector: QuestionSelector
): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    const stats = questionSelector.getPairedQuestionStats(
      question.pairedQuestionNumber,
      state.answers
    )

    yield* Console.log(
      `\n✏️ Question ${question.questionNumber} (${question.pairedQuestionNumber}):`
    )
    yield* Console.log(question.question)
    yield* Console.log(`🎯 Expected answer: "${question.correctAnswerText}"`)
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
  state: GameState,
  questionDataService: QuestionDataService,
  questionSelector: QuestionSelector
): Effect.Effect<Option.Option<{ question: Question; weight: number }>, never, never> =>
  Effect.gen(function* () {
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
 * Process a user's answer input
 */
const processAnswer = (
  userInput: string,
  question: Question,
  state: GameState
): Effect.Effect<GameState, never, never> =>
  Effect.gen(function* () {
    const answerIndex = userInput.toUpperCase().charCodeAt(0) - 65 // A=0, B=1, etc.

    if (answerIndex < 0 || answerIndex >= question.answers.length) {
      yield* Console.log('❌ Invalid answer. Please enter A, B, C, or D.')
      return state
    }

    const isCorrect = answerIndex === question.correctAnswer
    const correctLetter = String.fromCharCode(65 + question.correctAnswer)

    if (isCorrect) {
      yield* Console.log('✅ Correct!')
    } else {
      yield* Console.log(`❌ Incorrect. The correct answer was ${correctLetter}.`)
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
 * Service for managing game flow and user interactions
 */
export class GameService extends Effect.Service<GameService>()('GameService', {
  effect: Effect.gen(function* () {
    const questionDataService = yield* QuestionDataService
    const questionSelector = yield* QuestionSelector

    return {
      initializeGame: (userState: StateAbbreviation, questionNumbers?: ReadonlyArray<number>) =>
        initializeGame(questionDataService, userState, questionNumbers),
      getNextQuestion: (state: GameState) =>
        getNextQuestion(state, questionDataService, questionSelector),
      displayQuestion: (question: Question, weight: number, state: GameState) =>
        displayQuestion(question, weight, state, questionSelector),
      displayStats: (state: GameState) => displayStats(state),
      processAnswer: (userInput: string, question: Question, state: GameState) =>
        processAnswer(userInput, question, state)
    }
  }),
  dependencies: [QuestionDataService.Default, QuestionSelector.Default]
}) {}

/**
 * Test layer for GameService with mockable functions
 */
export const TestGameServiceLayer = (fn?: {
  initializeGame?: (
    userState: StateAbbreviation,
    questionNumbers?: ReadonlyArray<number>
  ) => Effect.Effect<GameState, never, never>
  getNextQuestion?: (
    state: GameState
  ) => Effect.Effect<Option.Option<{ question: Question; weight: number }>, never, never>
  displayQuestion?: (
    question: Question,
    weight: number,
    state: GameState
  ) => Effect.Effect<void, never, never>
  displayStats?: (state: GameState) => Effect.Effect<void, never, never>
  processAnswer?: (
    userInput: string,
    question: Question,
    state: GameState
  ) => Effect.Effect<GameState, never, never>
}) =>
  Layer.succeed(
    GameService,
    GameService.of({
      _tag: 'GameService',
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
