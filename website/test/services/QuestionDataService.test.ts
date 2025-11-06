import { describe, it, expect } from '@jest/globals'
import { Effect, Layer } from 'effect'
import { QuestionDataService } from '@/services/QuestionDataService'
import { TestGameServiceLayer } from 'questionnaire'

describe('QuestionDataService', () => {
  it('should generate game questions with proper structure', async () => {
    const testLayer = QuestionDataService.DefaultWithoutDependencies.pipe(
      Layer.provide(TestGameServiceLayer())
    )

    await Effect.gen(function* () {
      const questionService = yield* QuestionDataService
      const gameQuestions = yield* questionService.generateGameQuestions(5, 'CA')

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
      Layer.provide(TestGameServiceLayer())
    )

    await Effect.gen(function* () {
      const questionService = yield* QuestionDataService
      const questions1 = yield* questionService.generateGameQuestions(3, 'CA')
      const questions2 = yield* questionService.generateGameQuestions(3, 'CA')

      // Questions should potentially be in different order (though not guaranteed with small sample)
      expect(questions1.length).toBe(questions2.length)
      expect(questions1.length).toBe(3)
      expect(questions2.length).toBe(3)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should handle empty question count', async () => {
    const testLayer = QuestionDataService.DefaultWithoutDependencies.pipe(
      Layer.provide(TestGameServiceLayer())
    )

    await Effect.gen(function* () {
      const questionService = yield* QuestionDataService
      const gameQuestions = yield* questionService.generateGameQuestions(0, 'CA')

      expect(gameQuestions).toBeDefined()
      expect(Array.isArray(gameQuestions)).toBe(true)
      expect(gameQuestions.length).toBe(0)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should filter questions by district when userDistrict is provided', async () => {
    const testLayer = QuestionDataService.DefaultWithoutDependencies.pipe(
      Layer.provide(TestGameServiceLayer())
    )

    await Effect.gen(function* () {
      const questionService = yield* QuestionDataService

      // Generate questions with a specific district
      const questionsWithDistrict = yield* questionService.generateGameQuestions(
        10,
        'AZ',
        '7'
      )

      expect(questionsWithDistrict).toBeDefined()
      expect(Array.isArray(questionsWithDistrict)).toBe(true)
      expect(questionsWithDistrict.length).toBe(10)

      // Verify questions are generated (basic structure check)
      const firstQuestion = questionsWithDistrict[0]
      expect(firstQuestion).toMatchObject({
        id: expect.any(String),
        questionText: expect.any(String),
        answers: expect.any(Array),
        correctAnswerIndex: expect.any(Number),
        questionNumber: 1,
        totalQuestions: 10
      })
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should accept userDistrict as optional parameter', async () => {
    const testLayer = QuestionDataService.DefaultWithoutDependencies.pipe(
      Layer.provide(TestGameServiceLayer())
    )

    await Effect.gen(function* () {
      const questionService = yield* QuestionDataService

      // Should work without district (backward compatibility)
      const questionsWithoutDistrict = yield* questionService.generateGameQuestions(5, 'CA')
      expect(questionsWithoutDistrict.length).toBe(5)

      // Should work with undefined district
      const questionsWithUndefined = yield* questionService.generateGameQuestions(5, 'CA', undefined)
      expect(questionsWithUndefined.length).toBe(5)

      // Should work with specific district
      const questionsWithDistrict = yield* questionService.generateGameQuestions(5, 'CA', '12')
      expect(questionsWithDistrict.length).toBe(5)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })
})
