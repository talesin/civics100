import { Effect, Option, Layer } from 'effect'
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
  type QuestionArray
} from '../types'
import { QuestionSelector } from './QuestionSelector'
import { QuestionDataService } from './QuestionDataService'

/**
 * Generate a unique session ID for  games
 */
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

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
        : selectRandomQuestions(questions, settings.maxQuestions)

    const session: GameSession = {
      id: generateSessionId(),
      questions: selectedQuestions.map((q) => q.pairedQuestionNumber),
      currentQuestionIndex: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      totalAnswered: 0,
      isCompleted: false,
      isEarlyWin: false,
      isEarlyFail: false,
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
 */
const selectRandomQuestions = (
  allQuestions: QuestionArray,
  questionCount: number
): QuestionArray => {
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
const processGameAnswer =
  (questionSelector: QuestionSelector) =>
  (session: GameSession, answer: UserAnswer): GameSession => {
    const newCorrectAnswers = session.correctAnswers + (answer.isCorrect ? 1 : 0)
    const newIncorrectAnswers = session.incorrectAnswers + (answer.isCorrect ? 0 : 1)
    const newTotalAnswered = session.totalAnswered + 1
    const newCurrentIndex = session.currentQuestionIndex + 1

    // Record the answer in paired answers for adaptive learning
    const updatedPairedAnswers = questionSelector.recordPairedAnswer(
      answer.questionId as PairedQuestionNumber,
      answer.isCorrect,
      session.pairedAnswers
    )

    // Check for early failure (9 incorrect answers)
    const isEarlyFail = newIncorrectAnswers >= 9

    // Check for early win (only if not already failed)
    const isEarlyWin = newCorrectAnswers >= session.settings.winThreshold && !isEarlyFail

    // Game completes if: early fail, early win, or all questions answered
    const isCompleted = isEarlyFail || isEarlyWin || newTotalAnswered >= session.settings.maxQuestions

    const updatedSession: GameSession = {
      ...session,
      currentQuestionIndex: newCurrentIndex,
      correctAnswers: newCorrectAnswers,
      incorrectAnswers: newIncorrectAnswers,
      totalAnswered: newTotalAnswered,
      isCompleted,
      isEarlyWin,
      isEarlyFail,
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
const calculateGameResult = (session: GameSession): GameResult => {
  const percentage =
    session.totalAnswered > 0
      ? Math.round((session.correctAnswers / session.totalAnswered) * 100)
      : 0

  return {
    sessionId: session.id,
    totalQuestions: session.totalAnswered,
    correctAnswers: session.correctAnswers,
    incorrectAnswers: session.incorrectAnswers,
    percentage,
    isEarlyWin: session.isEarlyWin,
    isEarlyFail: session.isEarlyFail,
    completedAt: session.completedAt ?? new Date()
  }
}

/**
 * Validate user answer selection against question requirements
 */
const validateAnswerSelection = (
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
export class GameService extends Effect.Service<GameService>()('GameService', {
  effect: Effect.gen(function* () {
    const questionDataService = yield* QuestionDataService
    const questionSelector = yield* QuestionSelector

    return {
      //  session management methods
      createGameSession: createGameSession(questionDataService, questionSelector),
      processGameAnswer: processGameAnswer(questionSelector),
      calculateGameResult: (session: GameSession) => calculateGameResult(session),
      transformQuestionToDisplay: (
        question: Question,
        questionNumber: number,
        totalQuestions: number
      ) => transformQuestionToDisplay(question, questionNumber, totalQuestions),
      generateSessionId: () => generateSessionId(),
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
  //  session methods
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
      _tag: 'GameService',
      //  session methods
      createGameSession:
        fn?.createGameSession ??
        ((_settings, _pairedAnswers) =>
          Effect.succeed({
            session: {
              id: 'test-session',
              questions: [],
              currentQuestionIndex: 0,
              correctAnswers: 0,
              incorrectAnswers: 0,
              totalAnswered: 0,
              isCompleted: false,
              isEarlyWin: false,
              isEarlyFail: false,
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
      processGameAnswer: fn?.processGameAnswer ?? ((session) => session),
      calculateGameResult:
        fn?.calculateGameResult ??
        ((_session) => ({
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
      generateSessionId: fn?.generateSessionId ?? (() => 'test-session-id'),
      validateAnswerSelection: fn?.validateAnswerSelection ?? validateAnswerSelection
    })
  )
