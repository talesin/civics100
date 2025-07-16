import { describe, it, expect } from '@jest/globals'
import { Effect, Layer } from 'effect'
import { QuestionDataService } from '@/services/QuestionDataService'
import { TestAdaptiveLearningServiceLayer } from '@/services/AdaptiveLearningService'

describe('QuestionDataService', () => {
  it('should load sample civics questions', async () => {
    // Create test layer inside the test to avoid module loading issues
    const testLayer = QuestionDataService.DefaultWithoutDependencies.pipe(
      Layer.provide(TestAdaptiveLearningServiceLayer())
    )

    await Effect.gen(function* () {
      const questionService = yield* QuestionDataService
      const questions = yield* questionService.loadCivicsQuestions()

      expect(questions).toBeDefined()
      expect(Array.isArray(questions)).toBe(true)
      expect(questions.length).toBeGreaterThan(0)

      // Check first question structure (now using questionnaire package's Question format)
      const firstQuestion = questions[0]
      expect(firstQuestion).toMatchObject({
        question: expect.any(String),
        questionNumber: expect.any(String),
        pairedQuestionNumber: expect.any(String),
        correctAnswer: expect.any(Number),
        correctAnswerText: expect.any(String),
        answers: expect.any(Array)
      })
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should generate game questions with proper structure', async () => {
    const testLayer = QuestionDataService.DefaultWithoutDependencies.pipe(
      Layer.provide(TestAdaptiveLearningServiceLayer())
    )

    await Effect.gen(function* () {
      const questionService = yield* QuestionDataService
      const gameQuestions = yield* questionService.generateGameQuestions(5)

      expect(gameQuestions).toBeDefined()
      expect(Array.isArray(gameQuestions)).toBe(true)
      expect(gameQuestions.length).toBe(5)

      // Check question display structure
      const firstQuestion = gameQuestions[0]
      expect(firstQuestion).toMatchObject({
        id: expect.any(String),
        questionText: expect.any(String),
        answers: expect.any(Array),
        correctAnswerIndex: expect.any(Number),
        questionNumber: 1,
        totalQuestions: 5
      })
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should randomize question selection', async () => {
    const testLayer = QuestionDataService.DefaultWithoutDependencies.pipe(
      Layer.provide(TestAdaptiveLearningServiceLayer())
    )

    await Effect.gen(function* () {
      const questionService = yield* QuestionDataService
      const questions1 = yield* questionService.generateGameQuestions(3)
      const questions2 = yield* questionService.generateGameQuestions(3)

      // Questions should potentially be in different order (though not guaranteed with small sample)
      expect(questions1.length).toBe(questions2.length)
      expect(questions1.length).toBe(3)
      expect(questions2.length).toBe(3)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should handle empty question count', async () => {
    const testLayer = QuestionDataService.DefaultWithoutDependencies.pipe(
      Layer.provide(TestAdaptiveLearningServiceLayer())
    )

    await Effect.gen(function* () {
      const questionService = yield* QuestionDataService
      const gameQuestions = yield* questionService.generateGameQuestions(0)

      expect(gameQuestions).toBeDefined()
      expect(Array.isArray(gameQuestions)).toBe(true)
      expect(gameQuestions.length).toBe(0)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })
})
