import { describe, it, expect } from '@jest/globals'
import { Effect, Layer } from 'effect'
import { SessionService } from '@/services/SessionService'
import { DEFAULT_GAME_SETTINGS } from '@/types'
import { GameSession, TestGameServiceLayer } from 'questionnaire'

describe('SessionService', () => {
  const gameServiceLayer = TestGameServiceLayer()
  const testLayer = SessionService.DefaultWithoutDependencies.pipe(Layer.provide(gameServiceLayer))

  it('should create a new session with correct structure', async () => {
    await Effect.gen(function* () {
      const sessionService = yield* SessionService
      const session = yield* sessionService.createNewSession(DEFAULT_GAME_SETTINGS)

      expect(session).toMatchObject({
        id: expect.any(String),
        questions: expect.any(Array),
        currentQuestionIndex: 0,
        correctAnswers: 0,
        totalAnswered: 0,
        isCompleted: false,
        isEarlyWin: false,
        startedAt: expect.any(Date)
      })
      expect(session.questions).toHaveLength(DEFAULT_GAME_SETTINGS.maxQuestions)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should process correct answers correctly', async () => {
    await Effect.gen(function* () {
      const sessionService = yield* SessionService
      const session = yield* sessionService.createNewSession(DEFAULT_GAME_SETTINGS)

      const correctAnswer = {
        questionId: 'question-1',
        selectedAnswerIndex: 0,
        isCorrect: true,
        answeredAt: new Date()
      }

      const updatedSession = sessionService.processAnswer(session, correctAnswer)

      expect(updatedSession).toMatchObject({
        correctAnswers: 1,
        totalAnswered: 1,
        currentQuestionIndex: 1,
        isCompleted: false,
        isEarlyWin: false
      })
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should process incorrect answers correctly', async () => {
    await Effect.gen(function* () {
      const sessionService = yield* SessionService
      const session = yield* sessionService.createNewSession(DEFAULT_GAME_SETTINGS)

      const incorrectAnswer = {
        questionId: 'question-1',
        selectedAnswerIndex: 1,
        isCorrect: false,
        answeredAt: new Date()
      }

      const updatedSession = sessionService.processAnswer(session, incorrectAnswer)

      expect(updatedSession).toMatchObject({
        correctAnswers: 0,
        totalAnswered: 1,
        currentQuestionIndex: 1,
        isCompleted: false,
        isEarlyWin: false
      })
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should detect early win at 6 correct answers', async () => {
    await Effect.gen(function* () {
      const sessionService = yield* SessionService
      let session = yield* sessionService.createNewSession(DEFAULT_GAME_SETTINGS)

      // Answer 6 questions correctly
      for (let i = 0; i < 6; i++) {
        const correctAnswer = {
          questionId: `question-${i + 1}`,
          selectedAnswerIndex: 0,
          isCorrect: true,
          answeredAt: new Date()
        }
        session = sessionService.processAnswer(session, correctAnswer)
      }

      expect(session).toMatchObject({
        correctAnswers: 6,
        totalAnswered: 6,
        isCompleted: true,
        isEarlyWin: true,
        completedAt: expect.any(Date)
      })
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should complete session after max questions', async () => {
    await Effect.gen(function* () {
      const sessionService = yield* SessionService
      let session = yield* sessionService.createNewSession({
        ...DEFAULT_GAME_SETTINGS,
        maxQuestions: 3
      })

      // Answer 3 questions (some correct, some not)
      for (let i = 0; i < 3; i++) {
        const answer = {
          questionId: `question-${i + 1}`,
          selectedAnswerIndex: 0,
          isCorrect: i < 2, // First 2 correct, last incorrect
          answeredAt: new Date()
        }
        session = sessionService.processAnswer(session, answer)
      }

      expect(session.correctAnswers).toBe(2)
      expect(session.totalAnswered).toBe(3)
      expect(session.isCompleted).toBe(true)
      expect(session.isEarlyWin).toBe(false) // Only 2 correct, not 6
      expect(session.completedAt).toBeInstanceOf(Date)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should calculate results correctly', async () => {
    await Effect.gen(function* () {
      const sessionService = yield* SessionService

      const session: GameSession = {
        id: 'test-session',
        questions: ['q1', 'q2', 'q3', 'q4', 'q5'],
        currentQuestionIndex: 5,
        correctAnswers: 4,
        totalAnswered: 5,
        isCompleted: true,
        isEarlyWin: false,
        startedAt: new Date(),
        completedAt: new Date(),
        pairedAnswers: {},
        settings: {
          maxQuestions: 0,
          winThreshold: 0,
          userState: 'CA',
          questionNumbers: undefined
        }
      }

      const result = sessionService.calculateResult(session)

      expect(result.sessionId).toBe('test-session')
      expect(result.totalQuestions).toBe(5)
      expect(result.correctAnswers).toBe(4)
      expect(result.percentage).toBe(80) // 4/5 = 80%
      expect(result.isEarlyWin).toBe(false)
      expect(result.completedAt).toBeInstanceOf(Date)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should check session continuation correctly', async () => {
    await Effect.gen(function* () {
      const sessionService = yield* SessionService

      const activeSession: GameSession = {
        id: 'test-session',
        questions: ['q1', 'q2', 'q3'],
        currentQuestionIndex: 1,
        correctAnswers: 1,
        totalAnswered: 1,
        isCompleted: false,
        isEarlyWin: false,
        startedAt: new Date(),
        pairedAnswers: {},
        settings: {
          maxQuestions: 10,
          winThreshold: 6,
          userState: 'CA',
          questionNumbers: undefined
        }
      }

      const completedSession: GameSession = {
        ...activeSession,
        isCompleted: true
      }

      const earlyWinSession: GameSession = {
        ...activeSession,
        correctAnswers: 6,
        isEarlyWin: true
      }

      expect(sessionService.canContinue(activeSession)).toBe(true)
      expect(sessionService.canContinue(completedSession)).toBe(false)
      expect(sessionService.canContinue(earlyWinSession)).toBe(false)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })
})
