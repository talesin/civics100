import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import {
  PoolMappingService,
  TestPoolMappingServiceLayer,
  type PoolMapping,
  type StaticPoolData
} from '../../src/services/PoolMappingService'
import type { QuestionType } from '../../src/services/QuestionClassifierService'

describe('PoolMappingService', () => {
  it('should return the correct pool mapping for a given question type', async () => {
    const testLayer = TestPoolMappingServiceLayer({
      getPoolsForQuestionType: (questionType: QuestionType): PoolMapping => {
        if (questionType === 'president') {
          return { primary: ['presidents'], secondary: ['vicePresidents'] }
        }
        return { primary: [] }
      }
    })

    await Effect.gen(function* () {
      const service = yield* PoolMappingService
      const mapping = service.getPoolsForQuestionType('president')
      expect(mapping).toEqual({ primary: ['presidents'], secondary: ['vicePresidents'] })

      const emptyMapping = service.getPoolsForQuestionType('abstract')
      expect(emptyMapping).toEqual({ primary: [] })
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should return the static pool data', async () => {
    const mockData: StaticPoolData = {
      presidents: ['President A', 'President B'],
      vicePresidents: [],
      wars: [],
      branches: [],
      cabinet: [],
      states: [],
      territories: [],
      capitals: [],
      oceans: [],
      rivers: [],
      representatives: [],
      senators: [],
      rights: [],
      documents: []
    }

    const testLayer = TestPoolMappingServiceLayer({
      getStaticPoolData: () => mockData
    })

    await Effect.gen(function* () {
      const service = yield* PoolMappingService
      const data = service.getStaticPoolData()
      expect(data).toEqual(mockData)
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })

  it('should return distractors from pools, excluding answers', async () => {
    const testLayer = TestPoolMappingServiceLayer({
      getDistractorsFromPools: (mapping: PoolMapping, excludeAnswers: readonly string[] = []) => {
        const pools: Record<string, readonly string[]> = {
          presidents: ['Washington', 'Lincoln', 'Roosevelt'],
          vicePresidents: ['Adams', 'Jefferson']
        }

        const distractors = mapping.primary.flatMap((poolName) => pools[poolName] ?? [])
        return distractors.filter((d) => !excludeAnswers.includes(d))
      }
    })

    await Effect.gen(function* () {
      const service = yield* PoolMappingService
      const mapping: PoolMapping = { primary: ['presidents'] }

      const distractors = service.getDistractorsFromPools(mapping, ['Lincoln'])

      expect(distractors).toEqual(['Washington', 'Roosevelt'])
      expect(distractors).not.toContain('Lincoln')
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })
})
