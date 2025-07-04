import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import {
  SimilarityService,
  TestSimilarityServiceLayer,
  SimilarityError
} from '../../src/services/SimilarityService'

describe('SimilarityService', () => {
  it('should return true for similar strings', async () => {
    const testLayer = TestSimilarityServiceLayer({
      isSimilar: (s1: string, s2: string) => Effect.succeed(s1 === s2)
    })

    await Effect.gen(function* () {
      const service = yield* SimilarityService
      const result = yield* service.isSimilar('hello', 'hello')
      expect(result).toBe(true)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should return false for different strings', async () => {
    const testLayer = TestSimilarityServiceLayer({
      isSimilar: (s1: string, s2: string) => Effect.succeed(s1 === s2)
    })

    await Effect.gen(function* () {
      const service = yield* SimilarityService
      const result = yield* service.isSimilar('hello', 'world')
      expect(result).toBe(false)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should return a SimilarityError on failure', async () => {
    const testLayer = TestSimilarityServiceLayer({
      isSimilar: () => Effect.fail(new SimilarityError({ message: 'API error' }))
    })

    await Effect.gen(function* () {
      const service = yield* SimilarityService
      const result = yield* Effect.flip(service.isSimilar('a', 'b'))
      expect(result).toBeInstanceOf(SimilarityError)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })
})
