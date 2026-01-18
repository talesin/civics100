import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import {
  SimilarityService,
  TestSimilarityServiceLayer,
  SimilarityError,
  isSimilar
} from '../../src/services/SimilarityService'

describe('SimilarityService', () => {
  it('should return true for similar strings', async () => {
    const testLayer = TestSimilarityServiceLayer({
      isSimilar: (answer: string, distractor: string) => Effect.succeed(answer === distractor)
    })

    await Effect.gen(function* () {
      const service = yield* SimilarityService
      const result = yield* service.isSimilar('hello', 'hello')
      expect(result).toBe(true)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should return false for different strings', async () => {
    const testLayer = TestSimilarityServiceLayer({
      isSimilar: (answer: string, distractor: string) => Effect.succeed(answer === distractor)
    })

    await Effect.gen(function* () {
      const service = yield* SimilarityService
      const result = yield* service.isSimilar('hello', 'world')
      expect(result).toBe(false)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should return a SimilarityError on failure', async () => {
    const testLayer = TestSimilarityServiceLayer({
      isSimilar: (_answer: string, _distractor: string) =>
        Effect.fail(new SimilarityError({ message: 'API error' }))
    })

    await Effect.gen(function* () {
      const service = yield* SimilarityService
      const result = yield* Effect.flip(service.isSimilar('a', 'b'))
      expect(result).toBeInstanceOf(SimilarityError)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })
})

describe('isSimilar with government forms (threshold = 0.7)', () => {
  // These tests use the real isSimilar function to verify the threshold behavior
  const isSimilarFn = isSimilar() // Uses default threshold of 0.7

  it('should NOT mark "Theocracy" as similar to "Republic"', async () => {
    const result = await Effect.runPromise(isSimilarFn('Republic', 'Theocracy'))
    expect(result).toBe(false)
  })

  it('should NOT mark "Parliamentary democracy" as similar to "Representative democracy"', async () => {
    const result = await Effect.runPromise(
      isSimilarFn('Representative democracy', 'Parliamentary democracy')
    )
    expect(result).toBe(false)
  })

  it('should NOT mark "Direct democracy" as similar to "Representative democracy"', async () => {
    const result = await Effect.runPromise(
      isSimilarFn('Representative democracy', 'Direct democracy')
    )
    expect(result).toBe(false)
  })

  it('should NOT mark "Oligarchy" as similar to "Republic"', async () => {
    const result = await Effect.runPromise(isSimilarFn('Republic', 'Oligarchy'))
    expect(result).toBe(false)
  })

  it('should NOT mark "Constitutional monarchy" as similar to "Constitution-based federal republic"', async () => {
    const result = await Effect.runPromise(
      isSimilarFn('Constitution-based federal republic', 'Constitutional monarchy')
    )
    expect(result).toBe(false)
  })

  it('should mark exact matches as similar', async () => {
    const result = await Effect.runPromise(isSimilarFn('Republic', 'Republic'))
    expect(result).toBe(true)
  })

  it('should mark case-insensitive exact matches as similar', async () => {
    const result = await Effect.runPromise(isSimilarFn('republic', 'REPUBLIC'))
    expect(result).toBe(true)
  })
})
