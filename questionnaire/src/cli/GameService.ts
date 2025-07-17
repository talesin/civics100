import { Effect, Console, Option, Layer } from 'effect'
import questionsWithDistractors from 'distractions'
import type { StateAbbreviation } from 'civics2json'
import {
  PairedQuestionNumber,
  type PairedAnswers,
  type Question,
  type WebGameSession,
  type GameSettings,
  type UserAnswer,
  type GameResult,
  type QuestionDisplay
} from '../types'
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
 * Generate a unique session ID for web games
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Create a new web game session with selected questions
 */
const createWebGameSession = (
  questionDataService: QuestionDataService,
  questionSelector: QuestionSelector
) =>
  Effect.fn(function* (settings: GameSettings, existingPairedAnswers?: PairedAnswers) {
    const questions = yield* questionDataService.loadQuestions({
      questions: questionsWithDistractors,
      userState: settings.userState,
      questionNumbers: settings.questionNumbers
    })

    const selectedQuestions =
      existingPairedAnswers && Object.keys(existingPairedAnswers).length > 0
        ? yield* selectAdaptiveQuestions(questionSelector)(
            questions,
            settings.maxQuestions,
            existingPairedAnswers
          )
        : selectRandomQuestions(questions, settings.maxQuestions)

    const session: WebGameSession = {
      id: generateSessionId(),
      questions: selectedQuestions.map((q) => q.pairedQuestionNumber),
      currentQuestionIndex: 0,
      correctAnswers: 0,
      totalAnswered: 0,
      isCompleted: false,
      isEarlyWin: false,
      startedAt: new Date(),
      pairedAnswers: existingPairedAnswers ?? {},
      settings
    }

    return { session, questions: selectedQuestions }
  })

/**
 * Select questions using adaptive learning algorithm
 */
const selectAdaptiveQuestions = (questionSelector: QuestionSelector) =>
  Effect.fn(function* (
    allQuestions: ReadonlyArray<Question>,
    questionCount: number,
    pairedAnswers: PairedAnswers
  ) {
    const availablePairedNumbers = allQuestions.map((q) => q.pairedQuestionNumber)
    const selectedQuestions: Question[] = []
    const usedPairedNumbers = new Set<string>()

    for (let i = 0; i < questionCount && i < allQuestions.length; i++) {
      const filteredPairedAnswers = Object.fromEntries(
        Object.entries(pairedAnswers).filter(([pqn]) => !usedPairedNumbers.has(pqn))
      )

      const availableNumbers = availablePairedNumbers.filter((pqn) => !usedPairedNumbers.has(pqn))

      const selectedPairedNumber = yield* questionSelector.selectPairedQuestion(
        availableNumbers,
        filteredPairedAnswers
      )

      if (Option.isSome(selectedPairedNumber)) {
        const question = allQuestions.find(
          (q) => q.pairedQuestionNumber === selectedPairedNumber.value
        )
        if (question) {
          selectedQuestions.push(question)
          usedPairedNumbers.add(question.pairedQuestionNumber)
        }
      } else {
        // Fallback to random selection if adaptive fails
        const remainingQuestions = allQuestions.filter(
          (q) => !usedPairedNumbers.has(q.pairedQuestionNumber)
        )
        if (remainingQuestions.length > 0) {
          const randomQuestion = remainingQuestions[0]
          if (randomQuestion) {
            selectedQuestions.push(randomQuestion)
            usedPairedNumbers.add(randomQuestion.pairedQuestionNumber)
          }
        }
      }
    }

    return selectedQuestions
  })

/**
 * Select random questions for games without answer history
 */
const selectRandomQuestions = (
  allQuestions: ReadonlyArray<Question>,
  questionCount: number
): ReadonlyArray<Question> => {
  const shuffled = [...allQuestions]
  // Simple Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    const swapValue = shuffled[j]
    if (temp !== undefined && swapValue !== undefined) {
      shuffled[i] = swapValue
      shuffled[j] = temp
    }
  }
  return shuffled.slice(0, questionCount)
}

/**
 * Process a user's answer and update the session
 */
const processWebGameAnswer =
  (questionSelector: QuestionSelector) =>
  (session: WebGameSession, answer: UserAnswer): WebGameSession => {
    const newCorrectAnswers = session.correctAnswers + (answer.isCorrect ? 1 : 0)
    const newTotalAnswered = session.totalAnswered + 1
    const newCurrentIndex = session.currentQuestionIndex + 1

    // Record the answer in paired answers for adaptive learning
    const updatedPairedAnswers = questionSelector.recordPairedAnswer(
      answer.questionId as PairedQuestionNumber,
      answer.isCorrect,
      session.pairedAnswers
    )

    const isEarlyWin = newCorrectAnswers >= session.settings.winThreshold
    const isCompleted = isEarlyWin || newTotalAnswered >= session.settings.maxQuestions

    const updatedSession: WebGameSession = {
      ...session,
      currentQuestionIndex: newCurrentIndex,
      correctAnswers: newCorrectAnswers,
      totalAnswered: newTotalAnswered,
      isCompleted,
      isEarlyWin,
      pairedAnswers: updatedPairedAnswers
    }

    if (isCompleted) {
      updatedSession.completedAt = new Date()
    }

    return updatedSession
  }

/**
 * Calculate final game result
 */
const calculateGameResult = (session: WebGameSession): GameResult => {
  const percentage =
    session.totalAnswered > 0
      ? Math.round((session.correctAnswers / session.totalAnswered) * 100)
      : 0

  return {
    sessionId: session.id,
    totalQuestions: session.totalAnswered,
    correctAnswers: session.correctAnswers,
    percentage,
    isEarlyWin: session.isEarlyWin,
    completedAt: session.completedAt ?? new Date()
  }
}

/**
 * Transform a Question into a QuestionDisplay for UI consumption
 */
const transformQuestionToDisplay = (
  question: Question,
  questionNumber: number,
  totalQuestions: number
): QuestionDisplay => {
  return {
    id: question.pairedQuestionNumber,
    questionText: question.question,
    answers: question.answers,
    correctAnswerIndex: question.correctAnswer,
    questionNumber,
    totalQuestions
  }
}

/**
 * Service for managing game flow and user interactions
 */
export class GameService extends Effect.Service<GameService>()('GameService', {
  effect: Effect.gen(function* () {
    const questionDataService = yield* QuestionDataService
    const questionSelector = yield* QuestionSelector

    return {
      // CLI-focused methods
      initializeGame: initializeGame(questionDataService),
      getNextQuestion: getNextQuestion(questionDataService, questionSelector),
      displayQuestion: displayQuestion(questionSelector),
      displayStats,
      processAnswer,

      // Web session management methods
      createWebGameSession: createWebGameSession(questionDataService, questionSelector),
      processWebGameAnswer: processWebGameAnswer(questionSelector),
      calculateGameResult,
      transformQuestionToDisplay,
      generateSessionId
    }
  }),
  dependencies: [QuestionDataService.Default, QuestionSelector.Default]
}) {}

/**
 * Test layer for GameService with mockable functions
 */
export const TestGameServiceLayer = (fn?: {
  // CLI methods
  initializeGame?: GameService['initializeGame']
  getNextQuestion?: GameService['getNextQuestion']
  displayQuestion?: GameService['displayQuestion']
  displayStats?: GameService['displayStats']
  processAnswer?: GameService['processAnswer']

  // Web session methods
  createWebGameSession?: GameService['createWebGameSession']
  processWebGameAnswer?: GameService['processWebGameAnswer']
  calculateGameResult?: GameService['calculateGameResult']
  transformQuestionToDisplay?: GameService['transformQuestionToDisplay']
  generateSessionId?: GameService['generateSessionId']
}) =>
  Layer.succeed(
    GameService,
    GameService.of({
      _tag: 'GameService',
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
      processAnswer: fn?.processAnswer ?? ((_userInput, _question, state) => Effect.succeed(state)),

      // Web session methods
      createWebGameSession:
        fn?.createWebGameSession ??
        ((_settings, _pairedAnswers) =>
          Effect.succeed({
            session: {
              id: 'test-session',
              questions: [],
              currentQuestionIndex: 0,
              correctAnswers: 0,
              totalAnswered: 0,
              isCompleted: false,
              isEarlyWin: false,
              startedAt: new Date(),
              pairedAnswers: {},
              settings: {
                maxQuestions: 10,
                winThreshold: 6,
                userState: 'CA' as import('civics2json').StateAbbreviation
              }
            },
            questions: []
          })),
      processWebGameAnswer: fn?.processWebGameAnswer ?? ((session) => session),
      calculateGameResult:
        fn?.calculateGameResult ??
        ((_session) => ({
          sessionId: 'test',
          totalQuestions: 0,
          correctAnswers: 0,
          percentage: 0,
          isEarlyWin: false,
          completedAt: new Date()
        })),
      transformQuestionToDisplay:
        fn?.transformQuestionToDisplay ??
        ((_question, questionNumber, totalQuestions) => ({
          id: 'test-question',
          questionText: 'Test question',
          answers: [],
          correctAnswerIndex: 0,
          questionNumber,
          totalQuestions
        })),
      generateSessionId: fn?.generateSessionId ?? (() => 'test-session-id')
    })
  )
