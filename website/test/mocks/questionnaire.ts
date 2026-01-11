/* eslint-disable @typescript-eslint/no-explicit-any */
// Minimal mock for Jest compatibility
// This provides only what's needed for tests to work with the real questionnaire package's interface

import { Effect, Layer, Brand } from 'effect'

// Essential types that match the real questionnaire package
export type QuestionNumber = string & Brand.Brand<'QuestionNumber'>
export const QuestionNumber = Brand.nominal<QuestionNumber>()

export type PairedQuestionNumber = string & Brand.Brand<'PairedQuestionNumber'>
export const PairedQuestionNumber = Brand.nominal<PairedQuestionNumber>()

export type PairedAnswers = Record<PairedQuestionNumber, Array<{ ts: Date; correct: boolean }>>

export type Question = {
  questionNumber: QuestionNumber
  pairedQuestionNumber: PairedQuestionNumber
  question: string
  correctAnswer: number | ReadonlyArray<number>
  correctAnswerText: string
  answers: ReadonlyArray<string>
  expectedAnswers?: number
}

export type GameSettings = {
  maxQuestions: number
  winThreshold: number
  userState: string
  questionNumbers?: readonly number[]
}

// Base session data shared across all game states
type BaseSessionData = {
  readonly id: string
  readonly questions: ReadonlyArray<string>
  readonly currentQuestionIndex: number
  readonly correctAnswers: number
  readonly incorrectAnswers: number
  readonly totalAnswered: number
  readonly startedAt: Date
  readonly pairedAnswers: PairedAnswers
  readonly settings: GameSettings
}

export type InProgressSession = BaseSessionData & { readonly _tag: 'InProgress' }
export type CompletedNormalSession = BaseSessionData & { readonly _tag: 'CompletedNormal'; readonly completedAt: Date }
export type EarlyWinSession = BaseSessionData & { readonly _tag: 'EarlyWin'; readonly completedAt: Date }
export type EarlyFailSession = BaseSessionData & { readonly _tag: 'EarlyFail'; readonly completedAt: Date }

export type GameSession = InProgressSession | CompletedNormalSession | EarlyWinSession | EarlyFailSession

// Type guards for GameSession states
export const isSessionInProgress = (s: GameSession): s is InProgressSession => s._tag === 'InProgress'
export const isSessionCompleted = (s: GameSession): s is CompletedNormalSession | EarlyWinSession | EarlyFailSession => s._tag !== 'InProgress'
export const isSessionEarlyWin = (s: GameSession): s is EarlyWinSession => s._tag === 'EarlyWin'
export const isSessionEarlyFail = (s: GameSession): s is EarlyFailSession => s._tag === 'EarlyFail'
export const getSessionCompletedAt = (s: GameSession): Date | undefined => isSessionCompleted(s) ? s.completedAt : undefined

export type UserAnswer = {
  questionId: string
  selectedAnswerIndex: number | ReadonlyArray<number>
  isCorrect: boolean
  answeredAt: Date
}

export type GameResult = {
  sessionId: string
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  percentage: number
  isEarlyWin: boolean
  isEarlyFail: boolean
  completedAt: Date
}

// Mock GameService with minimal interface
export class GameService extends Effect.Service<GameService>()('GameService', {
  effect: Effect.succeed({
    createGameSession: (settings: GameSettings) =>
      Effect.succeed({
        session: {
          _tag: 'InProgress' as const,
          id: 'test-session',
          questions: Array.from({ length: settings.maxQuestions }, (_, i) => `${i + 1}-0`),
          currentQuestionIndex: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          totalAnswered: 0,
          startedAt: new Date(),
          pairedAnswers: {},
          settings
        },
        questions: Array.from({ length: settings.maxQuestions }, (_, i) => ({
          questionNumber: QuestionNumber((i + 1).toString()),
          pairedQuestionNumber: PairedQuestionNumber(`${i + 1}-0`),
          question: `Test question ${i + 1}`,
          correctAnswer: 0,
          correctAnswerText: `Test answer ${i + 1}`,
          answers: [`Test answer ${i + 1}`, 'Wrong answer 1', 'Wrong answer 2', 'Wrong answer 3']
        }))
      }),
    processGameAnswer: (session: GameSession, answer: UserAnswer) => {
      const newCorrectAnswers = session.correctAnswers + (answer.isCorrect ? 1 : 0)
      const newIncorrectAnswers = session.incorrectAnswers + (answer.isCorrect ? 0 : 1)
      const newTotalAnswered = session.totalAnswered + 1
      const newCurrentIndex = session.currentQuestionIndex + 1
      const hasEarlyFail = newIncorrectAnswers >= 9
      const hasEarlyWin = newCorrectAnswers >= session.settings.winThreshold && !hasEarlyFail
      const hasCompletedNormal = newTotalAnswered >= session.settings.maxQuestions

      const baseData = {
        id: session.id,
        questions: session.questions,
        currentQuestionIndex: newCurrentIndex,
        correctAnswers: newCorrectAnswers,
        incorrectAnswers: newIncorrectAnswers,
        totalAnswered: newTotalAnswered,
        startedAt: session.startedAt,
        pairedAnswers: session.pairedAnswers,
        settings: session.settings
      }

      if (hasEarlyFail) {
        return Effect.succeed({ ...baseData, _tag: 'EarlyFail' as const, completedAt: new Date() })
      }
      if (hasEarlyWin) {
        return Effect.succeed({ ...baseData, _tag: 'EarlyWin' as const, completedAt: new Date() })
      }
      if (hasCompletedNormal) {
        return Effect.succeed({ ...baseData, _tag: 'CompletedNormal' as const, completedAt: new Date() })
      }
      return Effect.succeed({ ...baseData, _tag: 'InProgress' as const })
    },
    calculateGameResult: (session: GameSession) =>
      Effect.succeed({
        sessionId: session.id,
        totalQuestions: session.totalAnswered,
        correctAnswers: session.correctAnswers,
        incorrectAnswers: session.incorrectAnswers,
        percentage:
          session.totalAnswered > 0
            ? Math.round((session.correctAnswers / session.totalAnswered) * 100)
            : 0,
        isEarlyWin: isSessionEarlyWin(session),
        isEarlyFail: isSessionEarlyFail(session),
        completedAt: getSessionCompletedAt(session) ?? new Date()
      }),
    transformQuestionToDisplay: (
      question: Question,
      questionNumber: number,
      totalQuestions: number
    ) => ({
      id: question.pairedQuestionNumber,
      questionText: question.question,
      answers: question.answers,
      correctAnswerIndex: question.correctAnswer,
      questionNumber,
      totalQuestions,
      expectedAnswers: question.expectedAnswers
    }),
    validateAnswerSelection: (selectedAnswers: number | ReadonlyArray<number>, correctAnswer: number | ReadonlyArray<number>, expectedAnswers?: number) => {
      if (typeof selectedAnswers === 'number' && typeof correctAnswer === 'number') {
        return selectedAnswers === correctAnswer
      }
      const selectedArray = Array.isArray(selectedAnswers) ? selectedAnswers : [selectedAnswers]
      const correctArray = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]
      if (expectedAnswers && selectedArray.length !== expectedAnswers) {
        return false
      }
      return selectedArray.every(answer => correctArray.includes(answer)) && selectedArray.length === correctArray.length
    },
    generateSessionId: () => 'test-session-id'
  })
}) {}

export const GameServiceDefault = GameService.Default

// This is what the tests actually use - the real test layer from questionnaire
export const TestGameServiceLayer = (fn?: any) =>
  Layer.succeed(
    GameService,
    GameService.of({
      _tag: 'GameService',
      createGameSession:
        fn?.createGameSession ??
        ((settings: GameSettings) =>
          Effect.succeed({
            session: {
              _tag: 'InProgress' as const,
              id: 'test-session',
              questions: Array.from({ length: settings.maxQuestions }, (_, i) => `${i + 1}-0`),
              currentQuestionIndex: 0,
              correctAnswers: 0,
              incorrectAnswers: 0,
              totalAnswered: 0,
              startedAt: new Date(),
              pairedAnswers: {},
              settings
            },
            questions: Array.from({ length: settings.maxQuestions }, (_, i) => ({
              questionNumber: QuestionNumber((i + 1).toString()),
              pairedQuestionNumber: PairedQuestionNumber(`${i + 1}-0`),
              question: `Test question ${i + 1}`,
              correctAnswer: 0,
              correctAnswerText: `Test answer ${i + 1}`,
              answers: [
                `Test answer ${i + 1}`,
                'Wrong answer 1',
                'Wrong answer 2',
                'Wrong answer 3'
              ]
            }))
          })),
      processGameAnswer:
        fn?.processGameAnswer ??
        ((session: GameSession, answer: UserAnswer) => {
          const newCorrectAnswers = session.correctAnswers + (answer.isCorrect ? 1 : 0)
          const newIncorrectAnswers = session.incorrectAnswers + (answer.isCorrect ? 0 : 1)
          const newTotalAnswered = session.totalAnswered + 1
          const newCurrentIndex = session.currentQuestionIndex + 1
          const hasEarlyFail = newIncorrectAnswers >= 9
          const hasEarlyWin = newCorrectAnswers >= session.settings.winThreshold && !hasEarlyFail
          const hasCompletedNormal = newTotalAnswered >= session.settings.maxQuestions

          const baseData = {
            id: session.id,
            questions: session.questions,
            currentQuestionIndex: newCurrentIndex,
            correctAnswers: newCorrectAnswers,
            incorrectAnswers: newIncorrectAnswers,
            totalAnswered: newTotalAnswered,
            startedAt: session.startedAt,
            pairedAnswers: session.pairedAnswers,
            settings: session.settings
          }

          if (hasEarlyFail) {
            return Effect.succeed({ ...baseData, _tag: 'EarlyFail' as const, completedAt: new Date() })
          }
          if (hasEarlyWin) {
            return Effect.succeed({ ...baseData, _tag: 'EarlyWin' as const, completedAt: new Date() })
          }
          if (hasCompletedNormal) {
            return Effect.succeed({ ...baseData, _tag: 'CompletedNormal' as const, completedAt: new Date() })
          }
          return Effect.succeed({ ...baseData, _tag: 'InProgress' as const })
        }),
      calculateGameResult:
        fn?.calculateGameResult ??
        ((session: GameSession) =>
          Effect.succeed({
            sessionId: session.id,
            totalQuestions: session.totalAnswered,
            correctAnswers: session.correctAnswers,
            incorrectAnswers: session.incorrectAnswers,
            percentage:
              session.totalAnswered > 0
                ? Math.round((session.correctAnswers / session.totalAnswered) * 100)
                : 0,
            isEarlyWin: isSessionEarlyWin(session),
            isEarlyFail: isSessionEarlyFail(session),
            completedAt: getSessionCompletedAt(session) ?? new Date()
          })),
      transformQuestionToDisplay:
        fn?.transformQuestionToDisplay ??
        ((question: Question, questionNumber: number, totalQuestions: number) => ({
          id: question.pairedQuestionNumber,
          questionText: question.question,
          answers: question.answers,
          correctAnswerIndex: question.correctAnswer,
          questionNumber,
          totalQuestions,
          expectedAnswers: question.expectedAnswers
        })),
      validateAnswerSelection:
        fn?.validateAnswerSelection ??
        ((selectedAnswers: number | ReadonlyArray<number>, correctAnswer: number | ReadonlyArray<number>, expectedAnswers?: number) => {
          if (typeof selectedAnswers === 'number' && typeof correctAnswer === 'number') {
            return selectedAnswers === correctAnswer
          }
          const selectedArray = Array.isArray(selectedAnswers) ? selectedAnswers : [selectedAnswers]
          const correctArray = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]
          if (expectedAnswers && selectedArray.length !== expectedAnswers) {
            return false
          }
          return selectedArray.every(answer => correctArray.includes(answer)) && selectedArray.length === correctArray.length
        }),
      generateSessionId: fn?.generateSessionId ?? (() => 'test-session-id')
    })
  )

export * from './questionnaire-data'
