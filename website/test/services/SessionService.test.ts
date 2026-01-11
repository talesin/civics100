import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import { SessionService } from '@/services/SessionService'
import { DEFAULT_GAME_SETTINGS } from '@/types'
import {
  GameSession,
  isSessionCompleted,
  isSessionEarlyWin,
  isSessionEarlyFail,
  getSessionCompletedAt
} from 'questionnaire'

describe('SessionService', () => {
  const testLayer = SessionService.Default

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
        _tag: 'InProgress',
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

      expect(updatedSession.correctAnswers).toBe(1)
      expect(updatedSession.totalAnswered).toBe(1)
      expect(updatedSession.currentQuestionIndex).toBe(1)
      expect(isSessionCompleted(updatedSession)).toBe(false)
      expect(isSessionEarlyWin(updatedSession)).toBe(false)
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

      expect(updatedSession.correctAnswers).toBe(0)
      expect(updatedSession.totalAnswered).toBe(1)
      expect(updatedSession.currentQuestionIndex).toBe(1)
      expect(isSessionCompleted(updatedSession)).toBe(false)
      expect(isSessionEarlyWin(updatedSession)).toBe(false)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should detect early win at 12 correct answers (2025 default)', async () => {
    await Effect.gen(function* () {
      const sessionService = yield* SessionService
      let session = yield* sessionService.createNewSession(DEFAULT_GAME_SETTINGS)

      // Answer 12 questions correctly
      for (let i = 0; i < 12; i++) {
        const correctAnswer = {
          questionId: `question-${i + 1}`,
          selectedAnswerIndex: 0,
          isCorrect: true,
          answeredAt: new Date()
        }
        session = sessionService.processAnswer(session, correctAnswer)
      }

      expect(session.correctAnswers).toBe(12)
      expect(session.totalAnswered).toBe(12)
      expect(session.incorrectAnswers).toBe(0)
      expect(isSessionCompleted(session)).toBe(true)
      expect(isSessionEarlyWin(session)).toBe(true)
      expect(isSessionEarlyFail(session)).toBe(false)
      expect(getSessionCompletedAt(session)).toBeInstanceOf(Date)
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
      expect(session.incorrectAnswers).toBe(1)
      expect(session.totalAnswered).toBe(3)
      expect(isSessionCompleted(session)).toBe(true)
      expect(isSessionEarlyWin(session)).toBe(false)
      expect(isSessionEarlyFail(session)).toBe(false)
      expect(getSessionCompletedAt(session)).toBeInstanceOf(Date)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should detect early fail at 9 incorrect answers (2025 rule)', async () => {
    await Effect.gen(function* () {
      const sessionService = yield* SessionService
      let session = yield* sessionService.createNewSession(DEFAULT_GAME_SETTINGS)

      // Answer 9 questions incorrectly
      for (let i = 0; i < 9; i++) {
        const incorrectAnswer = {
          questionId: `question-${i + 1}`,
          selectedAnswerIndex: 0,
          isCorrect: false,
          answeredAt: new Date()
        }
        session = sessionService.processAnswer(session, incorrectAnswer)
      }

      expect(session.correctAnswers).toBe(0)
      expect(session.incorrectAnswers).toBe(9)
      expect(session.totalAnswered).toBe(9)
      expect(isSessionCompleted(session)).toBe(true)
      expect(isSessionEarlyWin(session)).toBe(false)
      expect(isSessionEarlyFail(session)).toBe(true)
      expect(getSessionCompletedAt(session)).toBeInstanceOf(Date)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should calculate results correctly', async () => {
    await Effect.gen(function* () {
      const sessionService = yield* SessionService

      const session: GameSession = {
        _tag: 'CompletedNormal',
        id: 'test-session',
        questions: ['q1', 'q2', 'q3', 'q4', 'q5'],
        currentQuestionIndex: 5,
        correctAnswers: 4,
        incorrectAnswers: 1,
        totalAnswered: 5,
        startedAt: new Date(),
        completedAt: new Date(),
        pairedAnswers: {},
        settings: {
          maxQuestions: 5,
          winThreshold: 3,
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
        _tag: 'InProgress',
        id: 'test-session',
        questions: ['q1', 'q2', 'q3'],
        currentQuestionIndex: 1,
        correctAnswers: 1,
        incorrectAnswers: 0,
        totalAnswered: 1,
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
        _tag: 'CompletedNormal',
        id: 'test-session',
        questions: ['q1', 'q2', 'q3'],
        currentQuestionIndex: 3,
        correctAnswers: 2,
        incorrectAnswers: 1,
        totalAnswered: 3,
        startedAt: new Date(),
        completedAt: new Date(),
        pairedAnswers: {},
        settings: {
          maxQuestions: 3,
          winThreshold: 2,
          userState: 'CA',
          questionNumbers: undefined
        }
      }

      const earlyWinSession: GameSession = {
        _tag: 'EarlyWin',
        id: 'test-session',
        questions: ['q1', 'q2', 'q3'],
        currentQuestionIndex: 6,
        correctAnswers: 6,
        incorrectAnswers: 0,
        totalAnswered: 6,
        startedAt: new Date(),
        completedAt: new Date(),
        pairedAnswers: {},
        settings: {
          maxQuestions: 10,
          winThreshold: 6,
          userState: 'CA',
          questionNumbers: undefined
        }
      }

      expect(sessionService.canContinue(activeSession)).toBe(true)
      expect(sessionService.canContinue(completedSession)).toBe(false)
      expect(sessionService.canContinue(earlyWinSession)).toBe(false)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  // New tests for 50 and 100 question early exit scenarios
  describe('Early Exit Conditions for Different Question Counts', () => {
    it('should allow early win at 30 correct for 50 questions', async () => {
      await Effect.gen(function* () {
        const sessionService = yield* SessionService
        let session = yield* sessionService.createNewSession({
          ...DEFAULT_GAME_SETTINGS,
          maxQuestions: 50,
          winThreshold: 30 // 60% of 50; early fail still at 9 incorrect (not proportional to question count)
        })

        // Answer 30 questions correctly
        for (let i = 0; i < 30; i++) {
          const correctAnswer = {
            questionId: `question-${i + 1}`,
            selectedAnswerIndex: 0,
            isCorrect: true,
            answeredAt: new Date()
          }
          session = sessionService.processAnswer(session, correctAnswer)
        }

        expect(session.correctAnswers).toBe(30)
        expect(session.totalAnswered).toBe(30)
        expect(isSessionCompleted(session)).toBe(true)
        expect(isSessionEarlyWin(session)).toBe(true)
        expect(isSessionEarlyFail(session)).toBe(false)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should allow early win at 60 correct for 100 questions', async () => {
      await Effect.gen(function* () {
        const sessionService = yield* SessionService
        let session = yield* sessionService.createNewSession({
          ...DEFAULT_GAME_SETTINGS,
          maxQuestions: 100,
          winThreshold: 60 // 60% of 100; note: early fail remains at 9 incorrect regardless of total question count
        })

        // Answer 60 questions correctly
        for (let i = 0; i < 60; i++) {
          const correctAnswer = {
            questionId: `question-${i + 1}`,
            selectedAnswerIndex: 0,
            isCorrect: true,
            answeredAt: new Date()
          }
          session = sessionService.processAnswer(session, correctAnswer)
        }

        expect(session.correctAnswers).toBe(60)
        expect(session.totalAnswered).toBe(60)
        expect(isSessionCompleted(session)).toBe(true)
        expect(isSessionEarlyWin(session)).toBe(true)
        expect(isSessionEarlyFail(session)).toBe(false)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should trigger early fail at 9 incorrect for 50 questions', async () => {
      await Effect.gen(function* () {
        const sessionService = yield* SessionService
        let session = yield* sessionService.createNewSession({
          ...DEFAULT_GAME_SETTINGS,
          maxQuestions: 50,
          winThreshold: 30
        })

        // Answer 9 questions incorrectly
        for (let i = 0; i < 9; i++) {
          const incorrectAnswer = {
            questionId: `question-${i + 1}`,
            selectedAnswerIndex: 0,
            isCorrect: false,
            answeredAt: new Date()
          }
          session = sessionService.processAnswer(session, incorrectAnswer)
        }

        expect(session.incorrectAnswers).toBe(9)
        expect(isSessionCompleted(session)).toBe(true)
        expect(isSessionEarlyWin(session)).toBe(false)
        expect(isSessionEarlyFail(session)).toBe(true)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should trigger early fail at 9 incorrect for 100 questions', async () => {
      await Effect.gen(function* () {
        const sessionService = yield* SessionService
        let session = yield* sessionService.createNewSession({
          ...DEFAULT_GAME_SETTINGS,
          maxQuestions: 100,
          winThreshold: 60
        })

        // Answer 9 questions incorrectly
        for (let i = 0; i < 9; i++) {
          const incorrectAnswer = {
            questionId: `question-${i + 1}`,
            selectedAnswerIndex: 0,
            isCorrect: false,
            answeredAt: new Date()
          }
          session = sessionService.processAnswer(session, incorrectAnswer)
        }

        expect(session.incorrectAnswers).toBe(9)
        expect(isSessionCompleted(session)).toBe(true)
        expect(isSessionEarlyWin(session)).toBe(false)
        expect(isSessionEarlyFail(session)).toBe(true)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should NOT allow early win before reaching threshold', async () => {
      await Effect.gen(function* () {
        const sessionService = yield* SessionService

        // Test 11/20 (one short of 12)
        let session20 = yield* sessionService.createNewSession({
          ...DEFAULT_GAME_SETTINGS,
          maxQuestions: 20,
          winThreshold: 12
        })
        for (let i = 0; i < 11; i++) {
          session20 = sessionService.processAnswer(session20, {
            questionId: `q-${i}`,
            selectedAnswerIndex: 0,
            isCorrect: true,
            answeredAt: new Date()
          })
        }
        expect(isSessionEarlyWin(session20)).toBe(false)
        expect(isSessionCompleted(session20)).toBe(false)

        // Test 29/50 (one short of 30)
        let session50 = yield* sessionService.createNewSession({
          ...DEFAULT_GAME_SETTINGS,
          maxQuestions: 50,
          winThreshold: 30
        })
        for (let i = 0; i < 29; i++) {
          session50 = sessionService.processAnswer(session50, {
            questionId: `q-${i}`,
            selectedAnswerIndex: 0,
            isCorrect: true,
            answeredAt: new Date()
          })
        }
        expect(isSessionEarlyWin(session50)).toBe(false)
        expect(isSessionCompleted(session50)).toBe(false)

        // Test 59/100 (one short of 60)
        let session100 = yield* sessionService.createNewSession({
          ...DEFAULT_GAME_SETTINGS,
          maxQuestions: 100,
          winThreshold: 60
        })
        for (let i = 0; i < 59; i++) {
          session100 = sessionService.processAnswer(session100, {
            questionId: `q-${i}`,
            selectedAnswerIndex: 0,
            isCorrect: true,
            answeredAt: new Date()
          })
        }
        expect(isSessionEarlyWin(session100)).toBe(false)
        expect(isSessionCompleted(session100)).toBe(false)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })
  })
})
