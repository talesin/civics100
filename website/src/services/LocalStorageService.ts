import { Effect, Layer, Option, Schema } from 'effect'
import { GameResult, WebsiteGameSettings, DEFAULT_GAME_SETTINGS } from '@/types'
import type { PairedAnswers } from 'questionnaire'

const STORAGE_KEYS = {
  GAME_RESULTS: 'civics100_game_results',
  GAME_SETTINGS: 'civics100_game_settings',
  PAIRED_ANSWERS: 'civics100_paired_answers',
  VERSION: 'civics100_storage_version'
} as const

const STORAGE_VERSION = '1.0.0'

const safeJsonParse = (json: string | null): Option.Option<unknown> =>
  Schema.decodeUnknownOption(Schema.parseJson())(json)

const safeJsonStringify = <T>(value: T): Effect.Effect<string, never, never> => {
  return Effect.try({
    try: () => JSON.stringify(value),
    catch: () => ''
  }).pipe(Effect.catchAll(() => Effect.succeed('')))
}

const checkStorageAvailable = (): boolean => {
  if (typeof window === 'undefined') return false

  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

const migrateStorageIfNeeded = (): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return

    const currentVersion = yield* Effect.try({
      try: () => localStorage.getItem(STORAGE_KEYS.VERSION),
      catch: () => null
    }).pipe(Effect.catchAll(() => Effect.succeed(null)))

    if (currentVersion !== STORAGE_VERSION) {
      yield* Effect.try({
        try: () => localStorage.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION),
        catch: () => void 0
      }).pipe(Effect.catchAll(() => Effect.succeed(void 0)))
    }
  })
}

const saveGameResult = (result: GameResult): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return

    yield* migrateStorageIfNeeded()

    const existingResults = yield* getGameResults()
    const updatedResults = [...existingResults, result]

    const maxResults = 50
    const resultsToKeep = updatedResults.slice(-maxResults)

    const jsonString = yield* safeJsonStringify(resultsToKeep)
    if (jsonString) {
      yield* Effect.try({
        try: () => localStorage.setItem(STORAGE_KEYS.GAME_RESULTS, jsonString),
        catch: () => void 0
      }).pipe(Effect.catchAll(() => Effect.succeed(void 0)))
    }
  })
}

const getGameResults = (): Effect.Effect<readonly GameResult[], never, never> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return []

    yield* migrateStorageIfNeeded()

    const json = yield* Effect.try({
      try: () => localStorage.getItem(STORAGE_KEYS.GAME_RESULTS),
      catch: () => null
    }).pipe(Effect.catchAll(() => Effect.succeed(null)))
    const parsed = safeJsonParse(json)

    const results = Option.getOrElse(parsed, () => [])

    if (!Array.isArray(results)) {
      return []
    }

    return results.map((r: unknown) => {
      const result = r as Record<string, unknown>
      return {
        sessionId: (result['sessionId'] as string) || '',
        totalQuestions: (result['totalQuestions'] as number) || 0,
        correctAnswers: (result['correctAnswers'] as number) || 0,
        percentage: (result['percentage'] as number) || 0,
        isEarlyWin: (result['isEarlyWin'] as boolean) || false,
        completedAt:
          result['completedAt'] !== undefined
            ? new Date(result['completedAt'] as string)
            : new Date()
      }
    })
  })
}

const saveGameSettings = (settings: WebsiteGameSettings): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return

    yield* migrateStorageIfNeeded()

    const jsonString = yield* safeJsonStringify(settings)
    if (jsonString) {
      yield* Effect.try({
        try: () => localStorage.setItem(STORAGE_KEYS.GAME_SETTINGS, jsonString),
        catch: () => void 0
      }).pipe(Effect.catchAll(() => Effect.succeed(void 0)))
    }
  })
}

const getGameSettings = (): Effect.Effect<WebsiteGameSettings, never, never> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return DEFAULT_GAME_SETTINGS

    yield* migrateStorageIfNeeded()

    const json = yield* Effect.try({
      try: () => localStorage.getItem(STORAGE_KEYS.GAME_SETTINGS),
      catch: () => null
    }).pipe(Effect.catchAll(() => Effect.succeed(null)))
    const parsed = safeJsonParse(json)

    const settings = Option.getOrElse(parsed, () => DEFAULT_GAME_SETTINGS)
    const settingsRecord = settings as Record<string, unknown>

    return {
      maxQuestions:
        (settingsRecord['maxQuestions'] as number) ?? DEFAULT_GAME_SETTINGS.maxQuestions,
      winThreshold:
        (settingsRecord['winThreshold'] as number) ?? DEFAULT_GAME_SETTINGS.winThreshold,
      userState:
        (settingsRecord['userState'] as import('civics2json').StateAbbreviation) ??
        DEFAULT_GAME_SETTINGS.userState,
      darkMode: (settingsRecord['darkMode'] as boolean) ?? DEFAULT_GAME_SETTINGS.darkMode
    }
  })
}

const clearAllData = (): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return

    yield* Effect.try({
      try: () => {
        Object.values(STORAGE_KEYS).forEach((key) => {
          localStorage.removeItem(key)
        })
      },
      catch: () => void 0
    }).pipe(Effect.catchAll(() => Effect.succeed(void 0)))
  })
}

const getRecentResults = (count: number): Effect.Effect<readonly GameResult[], never, never> => {
  return Effect.gen(function* () {
    const allResults = yield* getGameResults()
    return [...allResults].slice(-count).reverse()
  })
}

const getGameStats = (): Effect.Effect<
  {
    totalGames: number
    averageScore: number
    bestScore: number
    earlyWins: number
  },
  never,
  never
> => {
  return Effect.gen(function* () {
    const results = yield* getGameResults()

    if (results.length === 0) {
      return {
        totalGames: 0,
        averageScore: 0,
        bestScore: 0,
        earlyWins: 0
      }
    }

    const totalGames = results.length
    const averageScore = Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalGames)
    const bestScore = Math.max(...results.map((r) => r.percentage))
    const earlyWins = results.filter((r) => r.isEarlyWin).length

    return {
      totalGames,
      averageScore,
      bestScore,
      earlyWins
    }
  })
}

const savePairedAnswers = (pairedAnswers: PairedAnswers): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return

    yield* migrateStorageIfNeeded()

    const jsonString = yield* safeJsonStringify(pairedAnswers)
    if (jsonString) {
      yield* Effect.try({
        try: () => localStorage.setItem(STORAGE_KEYS.PAIRED_ANSWERS, jsonString),
        catch: () => void 0
      }).pipe(Effect.catchAll(() => Effect.succeed(void 0)))
    }
  })
}

const getPairedAnswers = (): Effect.Effect<PairedAnswers, never, never> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return {}

    yield* migrateStorageIfNeeded()

    const json = yield* Effect.try({
      try: () => localStorage.getItem(STORAGE_KEYS.PAIRED_ANSWERS),
      catch: () => null
    }).pipe(Effect.catchAll(() => Effect.succeed(null)))
    const parsed = safeJsonParse(json)

    const pairedAnswers = Option.getOrElse(parsed, () => ({}))
    return pairedAnswers as PairedAnswers
  })
}

export class LocalStorageService extends Effect.Service<LocalStorageService>()(
  'LocalStorageService',
  {
    effect: Effect.succeed({
      saveGameResult,
      getGameResults,
      saveGameSettings,
      getGameSettings,
      savePairedAnswers,
      getPairedAnswers,
      clearAllData,
      getRecentResults,
      getGameStats,
      checkStorageAvailable: () => checkStorageAvailable()
    })
  }
) {}

export const TestLocalStorageServiceLayer = (fn?: {
  saveGameResult?: LocalStorageService['saveGameResult']
  getGameResults?: LocalStorageService['getGameResults']
  saveGameSettings?: LocalStorageService['saveGameSettings']
  getGameSettings?: LocalStorageService['getGameSettings']
  savePairedAnswers?: LocalStorageService['savePairedAnswers']
  getPairedAnswers?: LocalStorageService['getPairedAnswers']
  clearAllData?: LocalStorageService['clearAllData']
  getRecentResults?: LocalStorageService['getRecentResults']
  getGameStats?: LocalStorageService['getGameStats']
  checkStorageAvailable?: LocalStorageService['checkStorageAvailable']
}) =>
  Layer.succeed(
    LocalStorageService,
    LocalStorageService.of({
      _tag: 'LocalStorageService',
      saveGameResult: fn?.saveGameResult ?? (() => Effect.succeed(void 0)),
      getGameResults: fn?.getGameResults ?? (() => Effect.succeed([])),
      saveGameSettings: fn?.saveGameSettings ?? (() => Effect.succeed(void 0)),
      getGameSettings: fn?.getGameSettings ?? (() => Effect.succeed(DEFAULT_GAME_SETTINGS)),
      savePairedAnswers: fn?.savePairedAnswers ?? (() => Effect.succeed(void 0)),
      getPairedAnswers: fn?.getPairedAnswers ?? (() => Effect.succeed({})),
      clearAllData: fn?.clearAllData ?? (() => Effect.succeed(void 0)),
      getRecentResults: fn?.getRecentResults ?? (() => Effect.succeed([])),
      getGameStats:
        fn?.getGameStats ??
        (() =>
          Effect.succeed({
            totalGames: 0,
            averageScore: 0,
            bestScore: 0,
            earlyWins: 0
          })),
      checkStorageAvailable: fn?.checkStorageAvailable ?? (() => false)
    })
  )
