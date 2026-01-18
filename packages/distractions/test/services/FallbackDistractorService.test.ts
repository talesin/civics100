import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import type { Question } from 'civics2json'
import {
  FallbackDistractorService,
  TestFallbackDistractorServiceLayer
} from '../../src/services/FallbackDistractorService'

describe('FallbackDistractorService', () => {
  // Test fixture
  const createQuestion = (
    questionNumber: number,
    answerType: Question['answers']['_type'] = 'text'
  ): Question =>
    ({
      theme: 'AMERICAN GOVERNMENT',
      section: 'Principles of American Democracy',
      question: `Test question ${questionNumber}`,
      questionNumber,
      expectedAnswers: 1,
      answers: { _type: answerType, choices: ['Test answer'] }
    }) as Question

  describe('getFallbackDistractors', () => {
    it('should return fallback distractors for a known question', async () => {
      const question = createQuestion(1)

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* FallbackDistractorService
          return service.getFallbackDistractors(question)
        }).pipe(Effect.provide(FallbackDistractorService.Default))
      )

      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
    })

    it('should return empty array for unknown question', async () => {
      const question = createQuestion(999) // Non-existent question

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* FallbackDistractorService
          return service.getFallbackDistractors(question)
        }).pipe(Effect.provide(FallbackDistractorService.Default))
      )

      expect(result).toEqual([])
    })
  })

  describe('hasFallbackDistractors', () => {
    it('should return true for known questions', async () => {
      const question = createQuestion(1)

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* FallbackDistractorService
          return service.hasFallbackDistractors(question)
        }).pipe(Effect.provide(FallbackDistractorService.Default))
      )

      expect(result).toBe(true)
    })

    it('should return false for unknown questions', async () => {
      const question = createQuestion(999)

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* FallbackDistractorService
          return service.hasFallbackDistractors(question)
        }).pipe(Effect.provide(FallbackDistractorService.Default))
      )

      expect(result).toBe(false)
    })
  })

  describe('getFallbackCount', () => {
    it('should return positive count for known questions', async () => {
      const question = createQuestion(1)

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* FallbackDistractorService
          return service.getFallbackCount(question)
        }).pipe(Effect.provide(FallbackDistractorService.Default))
      )

      expect(result).toBeGreaterThan(0)
    })

    it('should return 0 for unknown questions', async () => {
      const question = createQuestion(999)

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* FallbackDistractorService
          return service.getFallbackCount(question)
        }).pipe(Effect.provide(FallbackDistractorService.Default))
      )

      expect(result).toBe(0)
    })
  })

  describe('getFallbackEntry', () => {
    it('should return entry with correct structure for known questions', async () => {
      const question = createQuestion(1)

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* FallbackDistractorService
          return service.getFallbackEntry(question)
        }).pipe(Effect.provide(FallbackDistractorService.Default))
      )

      expect(result).toBeDefined()
      expect(result?.questionNumber).toBe(1)
      expect(result?.answerType).toBeDefined()
      expect(Array.isArray(result?.correctAnswers)).toBe(true)
      expect(Array.isArray(result?.fallbackDistractors)).toBe(true)
    })

    it('should return undefined for unknown questions', async () => {
      const question = createQuestion(999)

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* FallbackDistractorService
          return service.getFallbackEntry(question)
        }).pipe(Effect.provide(FallbackDistractorService.Default))
      )

      expect(result).toBeUndefined()
    })
  })

  describe('TestFallbackDistractorServiceLayer', () => {
    it('should allow custom mock implementations', async () => {
      const question = createQuestion(1)
      const customDistractors = ['Mock 1', 'Mock 2', 'Mock 3']

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* FallbackDistractorService
          return service.getFallbackDistractors(question)
        }).pipe(
          Effect.provide(
            TestFallbackDistractorServiceLayer({
              getFallbackDistractors: () => customDistractors
            })
          )
        )
      )

      expect(result).toEqual(customDistractors)
    })
  })
})
