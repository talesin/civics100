import { describe, it, expect, beforeEach } from '@jest/globals'
import { Effect } from 'effect'
import { LocalStorageService, TestLocalStorageServiceLayer } from '@/services/LocalStorageService'
import { DEFAULT_GAME_SETTINGS } from '@/types'

// Get localStorage mock from setup
const localStorageMock = window.localStorage

describe('LocalStorageService', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('should save and retrieve game results', async () => {
    const program = Effect.gen(function* () {
      const storageService = yield* LocalStorageService

      const testResult = {
        sessionId: 'test-session-1',
        totalQuestions: 10,
        correctAnswers: 8,
        percentage: 80,
        isEarlyWin: false,
        completedAt: new Date()
      }

      yield* storageService.saveGameResult(testResult)
      const results = yield* storageService.getGameResults()

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(1)
      expect(results[0].sessionId).toBe('test-session-1')
      expect(results[0].totalQuestions).toBe(10)
      expect(results[0].correctAnswers).toBe(8)
      expect(results[0].percentage).toBe(80)
      expect(results[0].isEarlyWin).toBe(false)
      expect(results[0].completedAt).toBeInstanceOf(Date)
    })

    await Effect.runPromise(program.pipe(Effect.provide(LocalStorageService.Default)))
  })

  it('should save and retrieve game settings', async () => {
    const program = Effect.gen(function* () {
      const storageService = yield* LocalStorageService

      const testSettings = {
        maxQuestions: 15,
        winThreshold: 8,
        userState: 'NY',
        darkMode: true
      }

      yield* storageService.saveGameSettings(testSettings)
      const settings = yield* storageService.getGameSettings()

      expect(settings).toBeDefined()
      expect(settings.maxQuestions).toBe(15)
      expect(settings.winThreshold).toBe(8)
      expect(settings.userState).toBe('NY')
      expect(settings.darkMode).toBe(true)
    })

    await Effect.runPromise(program.pipe(Effect.provide(LocalStorageService.Default)))
  })

  it('should return default settings when none exist', async () => {
    const program = Effect.gen(function* () {
      const storageService = yield* LocalStorageService
      const settings = yield* storageService.getGameSettings()

      expect(settings).toEqual(DEFAULT_GAME_SETTINGS)
    })

    await Effect.runPromise(program.pipe(Effect.provide(LocalStorageService.Default)))
  })

  it('should return empty array when no results exist', async () => {
    const program = Effect.gen(function* () {
      const storageService = yield* LocalStorageService
      const results = yield* storageService.getGameResults()

      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBe(0)
    })

    await Effect.runPromise(program.pipe(Effect.provide(LocalStorageService.Default)))
  })

  it('should get recent results in reverse chronological order', async () => {
    const program = Effect.gen(function* () {
      const storageService = yield* LocalStorageService

      const results = [
        {
          sessionId: 'session-1',
          totalQuestions: 10,
          correctAnswers: 7,
          percentage: 70,
          isEarlyWin: false,
          completedAt: new Date('2023-01-01')
        },
        {
          sessionId: 'session-2',
          totalQuestions: 10,
          correctAnswers: 8,
          percentage: 80,
          isEarlyWin: false,
          completedAt: new Date('2023-01-02')
        },
        {
          sessionId: 'session-3',
          totalQuestions: 10,
          correctAnswers: 9,
          percentage: 90,
          isEarlyWin: false,
          completedAt: new Date('2023-01-03')
        }
      ]

      for (const result of results) {
        yield* storageService.saveGameResult(result)
      }

      const recentResults = yield* storageService.getRecentResults(2)

      expect(recentResults.length).toBe(2)
      expect(recentResults[0].sessionId).toBe('session-3') // Most recent first
      expect(recentResults[1].sessionId).toBe('session-2')
    })

    await Effect.runPromise(program.pipe(Effect.provide(LocalStorageService.Default)))
  })

  it('should calculate game statistics correctly', async () => {
    const program = Effect.gen(function* () {
      const storageService = yield* LocalStorageService

      const results = [
        {
          sessionId: 'session-1',
          totalQuestions: 10,
          correctAnswers: 8,
          percentage: 80,
          isEarlyWin: false,
          completedAt: new Date()
        },
        {
          sessionId: 'session-2',
          totalQuestions: 10,
          correctAnswers: 6,
          percentage: 60,
          isEarlyWin: true, // Early win
          completedAt: new Date()
        },
        {
          sessionId: 'session-3',
          totalQuestions: 10,
          correctAnswers: 10,
          percentage: 100,
          isEarlyWin: false,
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

    await Effect.runPromise(program.pipe(Effect.provide(LocalStorageService.Default)))
  })

  it('should handle empty stats correctly', async () => {
    const program = Effect.gen(function* () {
      const storageService = yield* LocalStorageService
      const stats = yield* storageService.getGameStats()

      expect(stats.totalGames).toBe(0)
      expect(stats.averageScore).toBe(0)
      expect(stats.bestScore).toBe(0)
      expect(stats.earlyWins).toBe(0)
    })

    await Effect.runPromise(program.pipe(Effect.provide(LocalStorageService.Default)))
  })

  it('should clear all data', async () => {
    const program = Effect.gen(function* () {
      const storageService = yield* LocalStorageService

      // Save some data first
      const testResult = {
        sessionId: 'test-session',
        totalQuestions: 10,
        correctAnswers: 8,
        percentage: 80,
        isEarlyWin: false,
        completedAt: new Date()
      }

      yield* storageService.saveGameResult(testResult)
      yield* storageService.saveGameSettings({ ...DEFAULT_GAME_SETTINGS, darkMode: true })

      // Verify data exists
      const resultsBefore = yield* storageService.getGameResults()
      const settingsBefore = yield* storageService.getGameSettings()
      expect(resultsBefore.length).toBe(1)
      expect(settingsBefore.darkMode).toBe(true)

      // Clear all data
      yield* storageService.clearAllData()

      // Verify data is cleared
      const resultsAfter = yield* storageService.getGameResults()
      const settingsAfter = yield* storageService.getGameSettings()
      expect(resultsAfter.length).toBe(0)
      expect(settingsAfter).toEqual(DEFAULT_GAME_SETTINGS)
    })

    await Effect.runPromise(program.pipe(Effect.provide(LocalStorageService.Default)))
  })
})
