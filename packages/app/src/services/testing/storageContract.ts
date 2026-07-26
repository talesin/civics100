import { beforeEach, describe, expect, it } from '@jest/globals'
import { Effect } from 'effect'
import type { Layer } from 'effect'
import type { PairedAnswers, PairedQuestionNumber } from 'questionnaire'
import { DEFAULT_GAME_SETTINGS, DEFAULT_TTS_SETTINGS } from '../../types'
import type { GameResult, WebsiteGameSettings } from '../../types'
import { LocalStorageService } from '../LocalStorageService'

/**
 * Parameterized LocalStorageService contract suite. Each platform runner
 * (website jsdom + apps/mobile jest-expo) invokes this with its own resolved
 * platform layer — platform resolution happens in the RUNNER's harness, which
 * is exactly the thing being proven.
 *
 * Not exported from any barrel: reached only via the runners' `^app/(.*)$`
 * jest moduleNameMapper, so it never enters an app bundle graph.
 *
 * NOTE: `questionnaire` imports here are type-only (erased at transform) so the
 * native runner needs no questionnaire mock — the branded PairedQuestionNumber
 * is produced by cast instead of the runtime brand constructor.
 */
export interface StorageContractHarness {
  readonly label: string
  readonly layer: Layer.Layer<LocalStorageService>
  readonly reset: () => void | Promise<void>
}

export const describeStorageContract = ({ label, layer, reset }: StorageContractHarness): void => {
  const run = <A>(program: Effect.Effect<A, never, LocalStorageService>): Promise<A> =>
    Effect.runPromise(program.pipe(Effect.provide(layer)))

  describe(`LocalStorageService contract [${label}]`, () => {
    beforeEach(async () => {
      await reset()
    })

    it('reports storage available', async () => {
      await run(
        Effect.gen(function* () {
          const storageService = yield* LocalStorageService
          const available = yield* storageService.checkStorageAvailable()
          expect(available).toBe(true)
        })
      )
    })

    it('saves and retrieves game results', async () => {
      await run(
        Effect.gen(function* () {
          const storageService = yield* LocalStorageService

          const testResult: GameResult = {
            sessionId: 'test-session-1',
            totalQuestions: 10,
            correctAnswers: 8,
            incorrectAnswers: 2,
            percentage: 80,
            isEarlyWin: false,
            isEarlyFail: false,
            completedAt: new Date()
          }

          yield* storageService.saveGameResult(testResult)
          const results = yield* storageService.getGameResults()

          expect(results).toBeDefined()
          expect(results).toHaveLength(1)
          expect(results?.[0]).toMatchObject({
            sessionId: 'test-session-1',
            totalQuestions: 10,
            correctAnswers: 8,
            percentage: 80,
            isEarlyWin: false,
            isEarlyFail: false,
            completedAt: expect.any(Date)
          })
        })
      )
    })

    it('saves and retrieves game settings', async () => {
      await run(
        Effect.gen(function* () {
          const storageService = yield* LocalStorageService

          const testSettings: WebsiteGameSettings = {
            maxQuestions: 15,
            winThreshold: 8,
            userState: 'NY'
          }

          yield* storageService.saveGameSettings(testSettings)
          const settings = yield* storageService.getGameSettings()

          expect(settings).toMatchObject({
            maxQuestions: 15,
            winThreshold: 8,
            userState: 'NY'
          })
        })
      )
    })

    it('returns default settings when none exist', async () => {
      await run(
        Effect.gen(function* () {
          const storageService = yield* LocalStorageService
          const settings = yield* storageService.getGameSettings()

          expect(settings).toEqual(DEFAULT_GAME_SETTINGS)
        })
      )
    })

    it('returns empty array when no results exist', async () => {
      await run(
        Effect.gen(function* () {
          const storageService = yield* LocalStorageService
          const results = yield* storageService.getGameResults()

          expect(results).toBeDefined()
          expect(Array.isArray(results)).toBe(true)
          expect(results.length).toBe(0)
        })
      )
    })

    it('gets recent results in reverse chronological order', async () => {
      await run(
        Effect.gen(function* () {
          const storageService = yield* LocalStorageService

          const results = [
            {
              sessionId: 'session-1',
              totalQuestions: 10,
              correctAnswers: 7,
              incorrectAnswers: 3,
              percentage: 70,
              isEarlyWin: false,
              isEarlyFail: false,
              completedAt: new Date('2023-01-01')
            },
            {
              sessionId: 'session-2',
              totalQuestions: 10,
              correctAnswers: 8,
              incorrectAnswers: 2,
              percentage: 80,
              isEarlyWin: false,
              isEarlyFail: false,
              completedAt: new Date('2023-01-02')
            },
            {
              sessionId: 'session-3',
              totalQuestions: 10,
              correctAnswers: 9,
              incorrectAnswers: 1,
              percentage: 90,
              isEarlyWin: false,
              isEarlyFail: false,
              completedAt: new Date('2023-01-03')
            }
          ]

          for (const result of results) {
            yield* storageService.saveGameResult(result)
          }

          const recentResults = yield* storageService.getRecentResults(2)

          expect(recentResults).toHaveLength(2)
          expect(recentResults?.[0]).toMatchObject({ sessionId: 'session-3' }) // Most recent first
          expect(recentResults?.[1]).toMatchObject({ sessionId: 'session-2' })
        })
      )
    })

    it('calculates game statistics correctly', async () => {
      await run(
        Effect.gen(function* () {
          const storageService = yield* LocalStorageService

          const results = [
            {
              sessionId: 'session-1',
              totalQuestions: 10,
              correctAnswers: 8,
              incorrectAnswers: 2,
              percentage: 80,
              isEarlyWin: false,
              isEarlyFail: false,
              completedAt: new Date()
            },
            {
              sessionId: 'session-2',
              totalQuestions: 10,
              correctAnswers: 6,
              incorrectAnswers: 4,
              percentage: 60,
              isEarlyWin: true, // Early win
              isEarlyFail: false,
              completedAt: new Date()
            },
            {
              sessionId: 'session-3',
              totalQuestions: 10,
              correctAnswers: 10,
              incorrectAnswers: 0,
              percentage: 100,
              isEarlyWin: false,
              isEarlyFail: false,
              completedAt: new Date()
            }
          ]

          for (const result of results) {
            yield* storageService.saveGameResult(result)
          }

          const stats = yield* storageService.getGameStats()

          expect(stats.totalGames).toBe(3)
          expect(stats.averageScore).toBe(80) // (80 + 60 + 100) / 3 = 80
          expect(stats.bestScore).toBe(100)
          expect(stats.earlyWins).toBe(1)
        })
      )
    })

    it('handles empty stats correctly', async () => {
      await run(
        Effect.gen(function* () {
          const storageService = yield* LocalStorageService
          const stats = yield* storageService.getGameStats()

          expect(stats.totalGames).toBe(0)
          expect(stats.averageScore).toBe(0)
          expect(stats.bestScore).toBe(0)
          expect(stats.earlyWins).toBe(0)
        })
      )
    })

    it('round-trips pairedAnswers with Date revival', async () => {
      await run(
        Effect.gen(function* () {
          const storageService = yield* LocalStorageService

          const pqn = '1-0' as PairedQuestionNumber
          const input: PairedAnswers = {
            [pqn]: [
              { ts: new Date('2026-04-19T10:00:00.000Z'), correct: true },
              { ts: new Date('2026-04-19T10:05:00.000Z'), correct: false }
            ]
          }

          yield* storageService.savePairedAnswers(input)
          const loaded = yield* storageService.getPairedAnswers()

          expect(Object.keys(loaded)).toEqual(['1-0'])
          const history = loaded[pqn]
          expect(history).toHaveLength(2)
          expect(history?.[0]?.correct).toBe(true)
          expect(history?.[0]?.ts).toBeInstanceOf(Date)
          expect(history?.[0]?.ts.toISOString()).toBe('2026-04-19T10:00:00.000Z')
          expect(history?.[1]?.correct).toBe(false)
        })
      )
    })

    it('returns empty pairedAnswers when none exist', async () => {
      await run(
        Effect.gen(function* () {
          const storageService = yield* LocalStorageService
          const loaded = yield* storageService.getPairedAnswers()
          expect(loaded).toEqual({})
        })
      )
    })

    it('round-trips TTS settings', async () => {
      await run(
        Effect.gen(function* () {
          const storageService = yield* LocalStorageService

          const defaults = yield* storageService.getTtsSettings()
          expect(defaults).toEqual(DEFAULT_TTS_SETTINGS)

          yield* storageService.saveTtsSettings({ voiceURI: 'test-voice', rate: 1.25 })
          const loaded = yield* storageService.getTtsSettings()

          expect(loaded).toEqual({ voiceURI: 'test-voice', rate: 1.25 })
        })
      )
    })

    it('clears all data', async () => {
      await run(
        Effect.gen(function* () {
          const storageService = yield* LocalStorageService

          // Save some data first
          const testResult = {
            sessionId: 'test-session',
            totalQuestions: 10,
            correctAnswers: 8,
            incorrectAnswers: 2,
            percentage: 80,
            isEarlyWin: false,
            isEarlyFail: false,
            completedAt: new Date()
          }

          yield* storageService.saveGameResult(testResult)
          yield* storageService.saveGameSettings({ ...DEFAULT_GAME_SETTINGS, maxQuestions: 50 })

          // Verify data exists
          const resultsBefore = yield* storageService.getGameResults()
          const settingsBefore = yield* storageService.getGameSettings()
          expect(resultsBefore.length).toBe(1)
          expect(settingsBefore.maxQuestions).toBe(50)

          // Clear all data
          yield* storageService.clearAllData()

          // Verify data is cleared
          const resultsAfter = yield* storageService.getGameResults()
          const settingsAfter = yield* storageService.getGameSettings()
          expect(resultsAfter.length).toBe(0)
          expect(settingsAfter).toEqual(DEFAULT_GAME_SETTINGS)
        })
      )
    })
  })
}
