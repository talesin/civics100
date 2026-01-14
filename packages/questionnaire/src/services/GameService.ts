import { Chunk, Effect, Option, Layer, Random, Clock } from 'effect'
import questionsWithDistractors from 'distractions'
import {
  PairedQuestionNumber,
  type PairedAnswers,
  type Question,
  type GameSession,
  type GameSettings,
  type UserAnswer,
  type GameResult,
  type QuestionDisplay,
  type QuestionArray,
  type InProgressSession,
  isSessionEarlyWin,
  isSessionEarlyFail,
  getSessionCompletedAt
} from '../types'
import { QuestionSelector } from './QuestionSelector'
import { QuestionDataService } from './QuestionDataService'

/**
 * Generate a unique session ID for games using Effect's Clock and Random services
 */
const generateSessionId = Effect.gen(function* () {
  const timestamp = yield* Clock.currentTimeMillis
  const random = yield* Random.nextIntBetween(0, 1_000_000_000)
  return `session_${timestamp}_${random.toString(36).slice(2, 11)}`
})

/**
 * Pure factory function to create an InProgress game session
 * Shared between production code and tests to avoid duplication
 */
export const createInProgressSession = (
  sessionId: string,
  questionPairedNumbers: ReadonlyArray<string>,
  startTimestamp: number,
  settings: GameSettings,
  existingPairedAnswers?: PairedAnswers
): InProgressSession => ({
  _tag: 'InProgress',
  id: sessionId,
  questions: questionPairedNumbers,
  currentQuestionIndex: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  totalAnswered: 0,
  startedAt: new Date(startTimestamp),
  pairedAnswers: existingPairedAnswers ?? {},
  settings
})

/**
 * Create a new  game session with selected questions
 */
const createGameSession = (
  questionDataService: QuestionDataService,
  questionSelector: QuestionSelector
) =>
  Effect.fn(function* (settings: GameSettings, existingPairedAnswers?: PairedAnswers) {
    const questions = yield* questionDataService.loadQuestions({
      questions: questionsWithDistractors,
      userState: settings.userState,
      questionNumbers: settings.questionNumbers
    })

    const selectedQuestions: QuestionArray =
      existingPairedAnswers && Object.keys(existingPairedAnswers).length > 0
        ? yield* selectAdaptiveQuestions(questionSelector)(
            questions,
            settings.maxQuestions,
            existingPairedAnswers
          )
        : yield* selectRandomQuestions(questions, settings.maxQuestions)

    const sessionId = yield* generateSessionId
    const startTimestamp = yield* Clock.currentTimeMillis

    const session = createInProgressSession(
      sessionId,
      selectedQuestions.map((q) => q.pairedQuestionNumber),
      startTimestamp,
      settings,
      existingPairedAnswers
    )

    return { session, questions: selectedQuestions }
  })

/**
 * Select questions using adaptive learning algorithm
 */
const selectAdaptiveQuestions = (questionSelector: QuestionSelector) =>
  Effect.fn(function* (
    allQuestions: QuestionArray,
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
 * Uses Effect's Random service for testability
 */
const selectRandomQuestions = (
  allQuestions: QuestionArray,
  questionCount: number
): Effect.Effect<QuestionArray, never, never> =>
  Effect.gen(function* () {
    const shuffled = yield* Random.shuffle([...allQuestions])
    return Chunk.toReadonlyArray(shuffled).slice(0, questionCount)
  })

/**
 * Process a user's answer and update the session
 * Uses Clock service for completedAt timestamp
 * Returns appropriate session state based on game outcome
 */
const processGameAnswer =
  (questionSelector: QuestionSelector) =>
  (session: GameSession, answer: UserAnswer): Effect.Effect<GameSession, never, never> =>
    Effect.gen(function* () {
      const newCorrectAnswers = session.correctAnswers + (answer.isCorrect ? 1 : 0)
      const newIncorrectAnswers = session.incorrectAnswers + (answer.isCorrect ? 0 : 1)
      const newTotalAnswered = session.totalAnswered + 1
      const newCurrentIndex = session.currentQuestionIndex + 1

      // Record the answer in paired answers for adaptive learning
      const updatedPairedAnswers = questionSelector.recordPairedAnswer(
        PairedQuestionNumber(answer.questionId),
        answer.isCorrect,
        session.pairedAnswers
      )

      // Base session data for all states
      const baseData = {
        id: session.id,
        questions: session.questions,
        currentQuestionIndex: newCurrentIndex,
        correctAnswers: newCorrectAnswers,
        incorrectAnswers: newIncorrectAnswers,
        totalAnswered: newTotalAnswered,
        startedAt: session.startedAt,
        pairedAnswers: updatedPairedAnswers,
        settings: session.settings
      }

      // Check for early failure (9 incorrect answers)
      const hasEarlyFail = newIncorrectAnswers >= 9

      // Check for early win (only if not already failed)
      const hasEarlyWin = newCorrectAnswers >= session.settings.winThreshold && !hasEarlyFail

      // Game completes if: early fail, early win, or all questions answered
      const hasCompletedNormal = newTotalAnswered >= session.settings.maxQuestions

      // Return appropriate session state
      if (hasEarlyFail) {
        const completedAt = new Date(yield* Clock.currentTimeMillis)
        return { ...baseData, _tag: 'EarlyFail' as const, completedAt }
      }

      if (hasEarlyWin) {
        const completedAt = new Date(yield* Clock.currentTimeMillis)
        return { ...baseData, _tag: 'EarlyWin' as const, completedAt }
      }

      if (hasCompletedNormal) {
        const completedAt = new Date(yield* Clock.currentTimeMillis)
        return { ...baseData, _tag: 'CompletedNormal' as const, completedAt }
      }

      // Still in progress
      return { ...baseData, _tag: 'InProgress' as const }
    })

/**
 * Calculate final game result
 * Uses Clock service for completedAt fallback timestamp
 */
const calculateGameResult = (session: GameSession): Effect.Effect<GameResult, never, never> =>
  Effect.gen(function* () {
    const percentage =
      session.totalAnswered > 0
        ? Math.round((session.correctAnswers / session.totalAnswered) * 100)
        : 0

    const completedAt = getSessionCompletedAt(session) ?? new Date(yield* Clock.currentTimeMillis)

    return {
      sessionId: session.id,
      totalQuestions: session.totalAnswered,
      correctAnswers: session.correctAnswers,
      incorrectAnswers: session.incorrectAnswers,
      percentage,
      isEarlyWin: isSessionEarlyWin(session),
      isEarlyFail: isSessionEarlyFail(session),
      completedAt
    }
  })

/**
 * Validate user answer selection against question requirements
 * Exported for testing
 */
export const validateAnswerSelection = (
  selectedAnswers: number | ReadonlyArray<number>,
  correctAnswer: number | ReadonlyArray<number>,
  expectedAnswers?: number
): boolean => {
  // Handle legacy single answer format
  if (typeof selectedAnswers === 'number' && typeof correctAnswer === 'number') {
    return selectedAnswers === correctAnswer
  }

  // Handle multiple answer format
  const selectedArray = Array.isArray(selectedAnswers) ? selectedAnswers : [selectedAnswers]
  const correctArray = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]

  // Check if we have the expected number of answers
  if (expectedAnswers !== undefined && selectedArray.length !== expectedAnswers) {
    return false
  }

  // For multiple answers, check if all selected answers are correct
  // Note: For questions with multiple correct options (like Cabinet positions),
  // users only need to select the expected number of correct answers, not all correct answers
  return selectedArray.every((answer) => correctArray.includes(answer))
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
    totalQuestions,
    expectedAnswers: question.expectedAnswers
  }
}

/**
 * Core GameService for web/API game functionality
 * Contains only platform-agnostic game logic
 */
export class GameService extends Effect.Service<GameService>()('questionnaire/GameService', {
  effect: Effect.gen(function* () {
    const questionDataService = yield* QuestionDataService
    const questionSelector = yield* QuestionSelector

    return {
      // Session management methods
      createGameSession: createGameSession(questionDataService, questionSelector),
      processGameAnswer: processGameAnswer(questionSelector),
      calculateGameResult,
      transformQuestionToDisplay: (
        question: Question,
        questionNumber: number,
        totalQuestions: number
      ) => transformQuestionToDisplay(question, questionNumber, totalQuestions),
      generateSessionId,
      validateAnswerSelection: (
        selectedAnswers: number | ReadonlyArray<number>,
        correctAnswer: number | ReadonlyArray<number>,
        expectedAnswers?: number
      ) => validateAnswerSelection(selectedAnswers, correctAnswer, expectedAnswers)
    }
  }),
  dependencies: [QuestionDataService.Default, QuestionSelector.Default]
}) {}

/**
 * Test layer for GameService with mockable functions
 */
export const TestGameServiceLayer = (fn?: {
  // Session methods
  createGameSession?: GameService['createGameSession']
  processGameAnswer?: GameService['processGameAnswer']
  calculateGameResult?: GameService['calculateGameResult']
  transformQuestionToDisplay?: GameService['transformQuestionToDisplay']
  generateSessionId?: GameService['generateSessionId']
  validateAnswerSelection?: GameService['validateAnswerSelection']
}) =>
  Layer.succeed(
    GameService,
    GameService.of({
      _tag: 'questionnaire/GameService',
      // Session methods
      createGameSession:
        fn?.createGameSession ??
        ((_settings, _pairedAnswers) =>
          Effect.succeed({
            session: {
              _tag: 'InProgress' as const,
              id: 'test-session',
              questions: [],
              currentQuestionIndex: 0,
              correctAnswers: 0,
              incorrectAnswers: 0,
              totalAnswered: 0,
              startedAt: new Date(),
              pairedAnswers: {},
              settings: {
                maxQuestions: 20,
                winThreshold: 12,
                userState: 'CA' as import('civics2json').StateAbbreviation
              }
            },
            questions: []
          })),
      processGameAnswer: fn?.processGameAnswer ?? ((session, _answer) => Effect.succeed(session)),
      calculateGameResult:
        fn?.calculateGameResult ??
        ((_session) =>
          Effect.succeed({
            sessionId: 'test',
            totalQuestions: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            percentage: 0,
            isEarlyWin: false,
            isEarlyFail: false,
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
      generateSessionId: fn?.generateSessionId ?? Effect.succeed('test-session-id'),
      validateAnswerSelection: fn?.validateAnswerSelection ?? validateAnswerSelection
    })
  )
