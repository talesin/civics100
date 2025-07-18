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

export type GameSession = {
  id: string
  questions: ReadonlyArray<string>
  currentQuestionIndex: number
  correctAnswers: number
  totalAnswered: number
  isCompleted: boolean
  isEarlyWin: boolean
  startedAt: Date
  completedAt?: Date
  pairedAnswers: PairedAnswers
  settings: GameSettings
}

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
  percentage: number
  isEarlyWin: boolean
  completedAt: Date
}

// Mock GameService with minimal interface
export class GameService extends Effect.Service<GameService>()('GameService', {
  effect: Effect.succeed({
    createGameSession: (settings: GameSettings) =>
      Effect.succeed({
        session: {
          id: 'test-session',
          questions: Array.from({ length: settings.maxQuestions }, (_, i) => `${i + 1}-0`),
          currentQuestionIndex: 0,
          correctAnswers: 0,
          totalAnswered: 0,
          isCompleted: false,
          isEarlyWin: false,
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
      const newTotalAnswered = session.totalAnswered + 1
      const newCurrentIndex = session.currentQuestionIndex + 1
      const isEarlyWin = newCorrectAnswers >= session.settings.winThreshold
      const isCompleted = isEarlyWin || newTotalAnswered >= session.settings.maxQuestions

      const updatedSession = {
        ...session,
        currentQuestionIndex: newCurrentIndex,
        correctAnswers: newCorrectAnswers,
        totalAnswered: newTotalAnswered,
        isCompleted,
        isEarlyWin
      }

      if (isCompleted) {
        updatedSession.completedAt = new Date()
      }

      return updatedSession
    },
    calculateGameResult: (session: GameSession) => ({
      sessionId: session.id,
      totalQuestions: session.totalAnswered,
      correctAnswers: session.correctAnswers,
      percentage:
        session.totalAnswered > 0
          ? Math.round((session.correctAnswers / session.totalAnswered) * 100)
          : 0,
      isEarlyWin: session.isEarlyWin,
      completedAt: session.completedAt ?? new Date()
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
              id: 'test-session',
              questions: Array.from({ length: settings.maxQuestions }, (_, i) => `${i + 1}-0`),
              currentQuestionIndex: 0,
              correctAnswers: 0,
              totalAnswered: 0,
              isCompleted: false,
              isEarlyWin: false,
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
          const newTotalAnswered = session.totalAnswered + 1
          const newCurrentIndex = session.currentQuestionIndex + 1
          const isEarlyWin = newCorrectAnswers >= session.settings.winThreshold
          const isCompleted = isEarlyWin || newTotalAnswered >= session.settings.maxQuestions

          const updatedSession = {
            ...session,
            currentQuestionIndex: newCurrentIndex,
            correctAnswers: newCorrectAnswers,
            totalAnswered: newTotalAnswered,
            isCompleted,
            isEarlyWin
          }

          if (isCompleted) {
            updatedSession.completedAt = new Date()
          }

          return updatedSession
        }),
      calculateGameResult:
        fn?.calculateGameResult ??
        ((session: GameSession) => ({
          sessionId: session.id,
          totalQuestions: session.totalAnswered,
          correctAnswers: session.correctAnswers,
          percentage:
            session.totalAnswered > 0
              ? Math.round((session.correctAnswers / session.totalAnswered) * 100)
              : 0,
          isEarlyWin: session.isEarlyWin,
          completedAt: session.completedAt ?? new Date()
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
