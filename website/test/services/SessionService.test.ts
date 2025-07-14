import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import { SessionService } from '@/services/SessionService'
import { QuestionDataService, TestQuestionDataServiceLayer } from '@/services/QuestionDataService'
import { DEFAULT_GAME_SETTINGS } from '@/types'

describe('SessionService', () => {
  const mockQuestionDataService = TestQuestionDataServiceLayer({
    generateGameQuestions: (count: number) => Effect.succeed(
      Array.from({ length: count }, (_, i) => ({
        id: `question-${i + 1}`,
        questionText: `Test question ${i + 1}`,
        answers: ['Answer A', 'Answer B', 'Answer C', 'Answer D'],
        correctAnswerIndex: 0,
        questionNumber: i + 1,
        totalQuestions: count
      }))
    )
  })

  it('should create a new session with correct structure', async () => {
    const program = Effect.gen(function* () {
      const sessionService = yield* SessionService
      const session = yield* sessionService.createNewSession(DEFAULT_GAME_SETTINGS)
      
      expect(session).toBeDefined()
      expect(session.id).toBeDefined()
      expect(typeof session.id).toBe('string')
      expect(session.questions).toBeDefined()
      expect(Array.isArray(session.questions)).toBe(true)
      expect(session.questions.length).toBe(DEFAULT_GAME_SETTINGS.maxQuestions)
      expect(session.currentQuestionIndex).toBe(0)
      expect(session.correctAnswers).toBe(0)
      expect(session.totalAnswered).toBe(0)
      expect(session.isCompleted).toBe(false)
      expect(session.isEarlyWin).toBe(false)
      expect(session.startedAt).toBeInstanceOf(Date)
      expect(session.completedAt).toBeUndefined()
    })

    await Effect.runPromise(program.pipe(
      Effect.provide(SessionService.Default),
      Effect.provide(mockQuestionDataService)
    ))
  })

  it('should process correct answers correctly', async () => {
    const program = Effect.gen(function* () {
      const sessionService = yield* SessionService
      const session = yield* sessionService.createNewSession(DEFAULT_GAME_SETTINGS)
      
      const correctAnswer = {
        questionId: 'question-1',
        selectedAnswerIndex: 0,
        isCorrect: true,
        answeredAt: new Date()
      }
      
      const updatedSession = sessionService.processAnswer(session, correctAnswer, DEFAULT_GAME_SETTINGS)
      
      expect(updatedSession.correctAnswers).toBe(1)
      expect(updatedSession.totalAnswered).toBe(1)
      expect(updatedSession.currentQuestionIndex).toBe(1)
      expect(updatedSession.isCompleted).toBe(false)
      expect(updatedSession.isEarlyWin).toBe(false)
    })

    await Effect.runPromise(program.pipe(
      Effect.provide(SessionService.Default),
      Effect.provide(mockQuestionDataService)
    ))
  })

  it('should process incorrect answers correctly', async () => {
    const program = Effect.gen(function* () {
      const sessionService = yield* SessionService
      const session = yield* sessionService.createNewSession(DEFAULT_GAME_SETTINGS)
      
      const incorrectAnswer = {
        questionId: 'question-1',
        selectedAnswerIndex: 1,
        isCorrect: false,
        answeredAt: new Date()
      }
      
      const updatedSession = sessionService.processAnswer(session, incorrectAnswer, DEFAULT_GAME_SETTINGS)
      
      expect(updatedSession.correctAnswers).toBe(0)
      expect(updatedSession.totalAnswered).toBe(1)
      expect(updatedSession.currentQuestionIndex).toBe(1)
      expect(updatedSession.isCompleted).toBe(false)
      expect(updatedSession.isEarlyWin).toBe(false)
    })

    await Effect.runPromise(program.pipe(
      Effect.provide(SessionService.Default),
      Effect.provide(mockQuestionDataService)
    ))
  })

  it('should detect early win at 6 correct answers', async () => {
    const program = Effect.gen(function* () {
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
        session = sessionService.processAnswer(session, correctAnswer, DEFAULT_GAME_SETTINGS)
      }
      
      expect(session.correctAnswers).toBe(6)
      expect(session.totalAnswered).toBe(6)
      expect(session.isCompleted).toBe(true)
      expect(session.isEarlyWin).toBe(true)
      expect(session.completedAt).toBeInstanceOf(Date)
    })

    await Effect.runPromise(program.pipe(
      Effect.provide(SessionService.Default),
      Effect.provide(mockQuestionDataService)
    ))
  })

  it('should complete session after max questions', async () => {
    const program = Effect.gen(function* () {
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
        session = sessionService.processAnswer(session, answer, { ...DEFAULT_GAME_SETTINGS, maxQuestions: 3 })
      }
      
      expect(session.correctAnswers).toBe(2)
      expect(session.totalAnswered).toBe(3)
      expect(session.isCompleted).toBe(true)
      expect(session.isEarlyWin).toBe(false) // Only 2 correct, not 6
      expect(session.completedAt).toBeInstanceOf(Date)
    })

    await Effect.runPromise(program.pipe(
      Effect.provide(SessionService.Default),
      Effect.provide(mockQuestionDataService)
    ))
  })

  it('should calculate results correctly', async () => {
    const program = Effect.gen(function* () {
      const sessionService = yield* SessionService
      
      const session = {
        id: 'test-session',
        questions: ['q1', 'q2', 'q3', 'q4', 'q5'],
        currentQuestionIndex: 5,
        correctAnswers: 4,
        totalAnswered: 5,
        isCompleted: true,
        isEarlyWin: false,
        startedAt: new Date(),
        completedAt: new Date()
      }
      
      const result = sessionService.calculateResult(session)
      
      expect(result.sessionId).toBe('test-session')
      expect(result.totalQuestions).toBe(5)
      expect(result.correctAnswers).toBe(4)
      expect(result.percentage).toBe(80) // 4/5 = 80%
      expect(result.isEarlyWin).toBe(false)
      expect(result.completedAt).toBeInstanceOf(Date)
    })

    await Effect.runPromise(program.pipe(
      Effect.provide(SessionService.Default),
      Effect.provide(mockQuestionDataService)
    ))
  })

  it('should check session continuation correctly', async () => {
    const program = Effect.gen(function* () {
      const sessionService = yield* SessionService
      
      const activeSession = {
        id: 'test-session',
        questions: ['q1', 'q2', 'q3'],
        currentQuestionIndex: 1,
        correctAnswers: 1,
        totalAnswered: 1,
        isCompleted: false,
        isEarlyWin: false,
        startedAt: new Date()
      }
      
      const completedSession = {
        ...activeSession,
        isCompleted: true
      }
      
      const earlyWinSession = {
        ...activeSession,
        correctAnswers: 6,
        isEarlyWin: true
      }
      
      expect(sessionService.canContinue(activeSession, DEFAULT_GAME_SETTINGS)).toBe(true)
      expect(sessionService.canContinue(completedSession, DEFAULT_GAME_SETTINGS)).toBe(false)
      expect(sessionService.canContinue(earlyWinSession, DEFAULT_GAME_SETTINGS)).toBe(false)
    })

    await Effect.runPromise(program.pipe(
      Effect.provide(SessionService.Default),
      Effect.provide(mockQuestionDataService)
    ))
  })
})