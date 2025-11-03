import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import { GameService } from '../src/services/GameService'
import type { GameSession, UserAnswer, GameSettings } from '../src/types'

// Direct test of validation logic without full service dependencies
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

// Helper to create a test session
const createTestSession = (settings: GameSettings): GameSession => ({
  id: 'test-session',
  questions: Array.from({ length: settings.maxQuestions }, (_, i) => `q-${i}`),
  currentQuestionIndex: 0,
  correctAnswers: 0,
  incorrectAnswers: 0,
  totalAnswered: 0,
  isCompleted: false,
  isEarlyWin: false,
  isEarlyFail: false,
  startedAt: new Date(),
  pairedAnswers: {},
  settings
})

describe('GameService', () => {
  describe('validateAnswerSelection', () => {
    it('should validate single answer correctly', () => {
      // Single correct answer
      expect(validateAnswerSelection(0, 0)).toBe(true)
      expect(validateAnswerSelection(1, 0)).toBe(false)
    })

    it('should validate multiple answers correctly', () => {
      // Two correct answers
      expect(validateAnswerSelection([0, 2], [0, 2], 2)).toBe(true)
      expect(validateAnswerSelection([0, 1], [0, 2], 2)).toBe(false)
      expect(validateAnswerSelection([0], [0, 2], 2)).toBe(false) // Too few answers
      expect(validateAnswerSelection([0, 1, 2], [0, 2], 2)).toBe(false) // Too many answers

      // Validate with multiple correct options (like Cabinet positions)
      expect(validateAnswerSelection([1, 3], [0, 1, 2, 3, 4], 2)).toBe(true) // Any 2 from many correct
      expect(validateAnswerSelection([0, 4], [0, 1, 2, 3, 4], 2)).toBe(true) // Any 2 from many correct
      expect(validateAnswerSelection([1, 5], [0, 1, 2, 3, 4], 2)).toBe(false) // One invalid choice
    })

    it('should handle mixed format correctly', () => {
      // Single answer as array vs number
      expect(validateAnswerSelection([0], 0)).toBe(true)
      expect(validateAnswerSelection(0, [0])).toBe(true)
    })

    it('should validate expected answer count', () => {
      // Wrong number of selections
      expect(validateAnswerSelection([0], [0, 1], 2)).toBe(false)
      expect(validateAnswerSelection([0, 1, 2], [0, 1], 2)).toBe(false)

      // Correct number of selections
      expect(validateAnswerSelection([0, 1], [0, 1], 2)).toBe(true)
    })

    it('should handle order independence', () => {
      // Order should not matter for multiple answers
      expect(validateAnswerSelection([1, 0], [0, 1], 2)).toBe(true)
      expect(validateAnswerSelection([2, 0, 1], [0, 1, 2], 3)).toBe(true)
    })
  })

  describe('Early Exit Conditions with Different Thresholds', () => {
    const testLayer = GameService.Default

    it('should trigger early win at 12 correct for 20 questions (60% threshold)', async () => {
      await Effect.gen(function* () {
        const gameService = yield* GameService

        const settings: GameSettings = {
          maxQuestions: 20,
          winThreshold: 12, // 60% of 20
          userState: 'CA',
          userDistrict: undefined,
          questionNumbers: undefined
        }

        let session = createTestSession(settings)

        // Answer 12 questions correctly
        for (let i = 0; i < 12; i++) {
          const answer: UserAnswer = {
            questionId: `q-${i}`,
            selectedAnswerIndex: 0,
            isCorrect: true,
            answeredAt: new Date()
          }
          session = gameService.processGameAnswer(session, answer)
        }

        expect(session.correctAnswers).toBe(12)
        expect(session.incorrectAnswers).toBe(0)
        expect(session.isEarlyWin).toBe(true)
        expect(session.isEarlyFail).toBe(false)
        expect(session.isCompleted).toBe(true)
        expect(session.completedAt).toBeInstanceOf(Date)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should trigger early win at 30 correct for 50 questions (60% threshold)', async () => {
      await Effect.gen(function* () {
        const gameService = yield* GameService

        const settings: GameSettings = {
          maxQuestions: 50,
          winThreshold: 30, // 60% of 50
          userState: 'CA',
          userDistrict: undefined,
          questionNumbers: undefined
        }

        let session = createTestSession(settings)

        // Answer 30 questions correctly
        for (let i = 0; i < 30; i++) {
          const answer: UserAnswer = {
            questionId: `q-${i}`,
            selectedAnswerIndex: 0,
            isCorrect: true,
            answeredAt: new Date()
          }
          session = gameService.processGameAnswer(session, answer)
        }

        expect(session.correctAnswers).toBe(30)
        expect(session.incorrectAnswers).toBe(0)
        expect(session.isEarlyWin).toBe(true)
        expect(session.isEarlyFail).toBe(false)
        expect(session.isCompleted).toBe(true)
        expect(session.completedAt).toBeInstanceOf(Date)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should trigger early win at 60 correct for 100 questions (60% threshold)', async () => {
      await Effect.gen(function* () {
        const gameService = yield* GameService

        const settings: GameSettings = {
          maxQuestions: 100,
          winThreshold: 60, // 60% of 100
          userState: 'CA',
          userDistrict: undefined,
          questionNumbers: undefined
        }

        let session = createTestSession(settings)

        // Answer 60 questions correctly
        for (let i = 0; i < 60; i++) {
          const answer: UserAnswer = {
            questionId: `q-${i}`,
            selectedAnswerIndex: 0,
            isCorrect: true,
            answeredAt: new Date()
          }
          session = gameService.processGameAnswer(session, answer)
        }

        expect(session.correctAnswers).toBe(60)
        expect(session.incorrectAnswers).toBe(0)
        expect(session.isEarlyWin).toBe(true)
        expect(session.isEarlyFail).toBe(false)
        expect(session.isCompleted).toBe(true)
        expect(session.completedAt).toBeInstanceOf(Date)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should trigger early fail at 9 incorrect regardless of maxQuestions', async () => {
      await Effect.gen(function* () {
        const gameService = yield* GameService

        const testCases = [
          { maxQuestions: 20, winThreshold: 12 },
          { maxQuestions: 50, winThreshold: 30 },
          { maxQuestions: 100, winThreshold: 60 }
        ]

        for (const { maxQuestions, winThreshold } of testCases) {
          const settings: GameSettings = {
            maxQuestions,
            winThreshold,
            userState: 'CA',
            userDistrict: undefined,
            questionNumbers: undefined
          }

          let session = createTestSession(settings)

          // Answer 9 questions incorrectly
          for (let i = 0; i < 9; i++) {
            const answer: UserAnswer = {
              questionId: `q-${i}`,
              selectedAnswerIndex: 0,
              isCorrect: false,
              answeredAt: new Date()
            }
            session = gameService.processGameAnswer(session, answer)
          }

          expect(session.correctAnswers).toBe(0)
          expect(session.incorrectAnswers).toBe(9)
          expect(session.isEarlyWin).toBe(false)
          expect(session.isEarlyFail).toBe(true)
          expect(session.isCompleted).toBe(true)
          expect(session.completedAt).toBeInstanceOf(Date)
        }
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should NOT trigger early win one question before threshold', async () => {
      await Effect.gen(function* () {
        const gameService = yield* GameService

        const testCases = [
          { maxQuestions: 20, winThreshold: 12, earlyWinThreshold: 11 },
          { maxQuestions: 50, winThreshold: 30, earlyWinThreshold: 29 },
          { maxQuestions: 100, winThreshold: 60, earlyWinThreshold: 59 }
        ]

        for (const { maxQuestions, winThreshold, earlyWinThreshold } of testCases) {
          const settings: GameSettings = {
            maxQuestions,
            winThreshold,
            userState: 'CA',
            userDistrict: undefined,
            questionNumbers: undefined
          }

          let session = createTestSession(settings)

          // Answer one less than threshold correctly
          for (let i = 0; i < earlyWinThreshold; i++) {
            const answer: UserAnswer = {
              questionId: `q-${i}`,
              selectedAnswerIndex: 0,
              isCorrect: true,
              answeredAt: new Date()
            }
            session = gameService.processGameAnswer(session, answer)
          }

          expect(session.correctAnswers).toBe(earlyWinThreshold)
          expect(session.isEarlyWin).toBe(false)
          expect(session.isCompleted).toBe(false)
        }
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should NOT trigger early fail at 8 incorrect', async () => {
      await Effect.gen(function* () {
        const gameService = yield* GameService

        const settings: GameSettings = {
          maxQuestions: 20,
          winThreshold: 12,
          userState: 'CA',
          userDistrict: undefined,
          questionNumbers: undefined
        }

        let session = createTestSession(settings)

        // Answer 8 questions incorrectly
        for (let i = 0; i < 8; i++) {
          const answer: UserAnswer = {
            questionId: `q-${i}`,
            selectedAnswerIndex: 0,
            isCorrect: false,
            answeredAt: new Date()
          }
          session = gameService.processGameAnswer(session, answer)
        }

        expect(session.incorrectAnswers).toBe(8)
        expect(session.isEarlyFail).toBe(false)
        expect(session.isCompleted).toBe(false)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should complete after all questions regardless of score', async () => {
      await Effect.gen(function* () {
        const gameService = yield* GameService

        const settings: GameSettings = {
          maxQuestions: 10,
          winThreshold: 6,
          userState: 'CA',
          userDistrict: undefined,
          questionNumbers: undefined
        }

        let session = createTestSession(settings)

        // Answer 5 correctly, 5 incorrectly (not enough to pass or fail early)
        for (let i = 0; i < 10; i++) {
          const answer: UserAnswer = {
            questionId: `q-${i}`,
            selectedAnswerIndex: 0,
            isCorrect: i < 5,
            answeredAt: new Date()
          }
          session = gameService.processGameAnswer(session, answer)
        }

        expect(session.correctAnswers).toBe(5)
        expect(session.incorrectAnswers).toBe(5)
        expect(session.totalAnswered).toBe(10)
        expect(session.isEarlyWin).toBe(false)
        expect(session.isEarlyFail).toBe(false)
        expect(session.isCompleted).toBe(true)
        expect(session.completedAt).toBeInstanceOf(Date)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should prioritize early fail over early win when both conditions met', async () => {
      await Effect.gen(function* () {
        const gameService = yield* GameService

        const settings: GameSettings = {
          maxQuestions: 100,
          winThreshold: 10, // Very low threshold
          userState: 'CA',
          userDistrict: undefined,
          questionNumbers: undefined
        }

        let session = createTestSession(settings)

        // Answer 10 correct, 9 incorrect (both thresholds met)
        const answers: UserAnswer[] = [
          ...Array.from({ length: 10 }, (_, i) => ({
            questionId: `q-${i}`,
            selectedAnswerIndex: 0,
            isCorrect: true,
            answeredAt: new Date()
          })),
          ...Array.from({ length: 9 }, (_, i) => ({
            questionId: `q-${i + 10}`,
            selectedAnswerIndex: 0,
            isCorrect: false,
            answeredAt: new Date()
          }))
        ]

        for (const answer of answers) {
          session = gameService.processGameAnswer(session, answer)
        }

        // Early fail should take priority
        expect(session.isEarlyWin).toBe(false)
        expect(session.isEarlyFail).toBe(true)
        expect(session.isCompleted).toBe(true)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should calculate correct result for early win', async () => {
      await Effect.gen(function* () {
        const gameService = yield* GameService

        const settings: GameSettings = {
          maxQuestions: 20,
          winThreshold: 12,
          userState: 'CA',
          userDistrict: undefined,
          questionNumbers: undefined
        }

        let session = createTestSession(settings)

        // Answer 12 questions correctly for early win
        for (let i = 0; i < 12; i++) {
          const answer: UserAnswer = {
            questionId: `q-${i}`,
            selectedAnswerIndex: 0,
            isCorrect: true,
            answeredAt: new Date()
          }
          session = gameService.processGameAnswer(session, answer)
        }

        const result = gameService.calculateGameResult(session)

        expect(result.totalQuestions).toBe(12)
        expect(result.correctAnswers).toBe(12)
        expect(result.incorrectAnswers).toBe(0)
        expect(result.percentage).toBe(100)
        expect(result.isEarlyWin).toBe(true)
        expect(result.isEarlyFail).toBe(false)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should calculate correct result for early fail', async () => {
      await Effect.gen(function* () {
        const gameService = yield* GameService

        const settings: GameSettings = {
          maxQuestions: 20,
          winThreshold: 12,
          userState: 'CA',
          userDistrict: undefined,
          questionNumbers: undefined
        }

        let session = createTestSession(settings)

        // Answer 9 questions incorrectly for early fail
        for (let i = 0; i < 9; i++) {
          const answer: UserAnswer = {
            questionId: `q-${i}`,
            selectedAnswerIndex: 0,
            isCorrect: false,
            answeredAt: new Date()
          }
          session = gameService.processGameAnswer(session, answer)
        }

        const result = gameService.calculateGameResult(session)

        expect(result.totalQuestions).toBe(9)
        expect(result.correctAnswers).toBe(0)
        expect(result.incorrectAnswers).toBe(9)
        expect(result.percentage).toBe(0)
        expect(result.isEarlyWin).toBe(false)
        expect(result.isEarlyFail).toBe(true)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })
  })
})
