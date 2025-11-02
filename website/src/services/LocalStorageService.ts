import { Effect, Layer, Option, Schema } from 'effect'
import { GameResult, WebsiteGameSettings, DEFAULT_GAME_SETTINGS } from '@/types'
import type { PairedAnswers } from 'questionnaire'

// Effect Schemas for runtime validation
const GameResultSchema = Schema.Struct({
  sessionId: Schema.NonEmptyString,
  totalQuestions: Schema.Number,
  correctAnswers: Schema.Number,
  incorrectAnswers: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  percentage: Schema.Number,
  isEarlyWin: Schema.Boolean,
  isEarlyFail: Schema.optionalWith(Schema.Boolean, { default: () => false }),
  completedAt: Schema.DateFromString
})

const WebsiteGameSettingsSchema = Schema.Struct({
  maxQuestions: Schema.Number,
  winThreshold: Schema.Number, 
  userState: Schema.String,
  darkMode: Schema.Boolean
})

const STORAGE_KEYS = {
  GAME_RESULTS: 'civics100_game_results',
  GAME_SETTINGS: 'civics100_game_settings',
  PAIRED_ANSWERS: 'civics100_paired_answers',
  VERSION: 'civics100_storage_version'
} as const

const STORAGE_VERSION = '1.0.0'

const safeJsonParse = (json: string | null): Option.Option<unknown> =>
  Schema.decodeUnknownOption(Schema.parseJson())(json)

const safeJsonStringify = <T>(value: T): Effect.Effect<string | undefined, never, never> => {
  return Effect.try({
    try: () => JSON.stringify(value),
    catch: () => undefined
  }).pipe(Effect.catchAll(() => Effect.succeed(undefined)))
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
      catch: () => undefined
    }).pipe(Effect.catchAll(() => Effect.succeed(undefined)))

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
    if (jsonString !== undefined) {
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
    const rawResults = Option.getOrElse(parsed, () => [])

    if (!Array.isArray(rawResults)) {
      return []
    }

    // Use schema to validate and transform each result, filtering out invalid ones
    const validResults = rawResults
      .map((rawResult) => Schema.decodeUnknownOption(GameResultSchema)(rawResult))
      .filter(Option.isSome)
      .map((option) => option.value)

    return validResults
  })
}

const saveGameSettings = (settings: WebsiteGameSettings): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return

    yield* migrateStorageIfNeeded()

    const jsonString = yield* safeJsonStringify(settings)
    if (jsonString !== undefined) {
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
    const rawSettings = Option.getOrElse(parsed, () => ({}))

    // Use schema to validate and decode settings, fallback to defaults if invalid
    const settingsOption = Schema.decodeUnknownOption(WebsiteGameSettingsSchema)(rawSettings)
    
    const decodedSettings = Option.getOrElse(settingsOption, () => DEFAULT_GAME_SETTINGS)
    
    // Type assertion needed due to StateAbbreviation type mismatch
    return decodedSettings as WebsiteGameSettings
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
    earlyFailures: number
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
        earlyWins: 0,
        earlyFailures: 0
      }
    }

    const totalGames = results.length
    const averageScore = Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / totalGames)
    const bestScore = Math.max(...results.map((r) => r.percentage))
    const earlyWins = results.filter((r) => r.isEarlyWin === true).length
    const earlyFailures = results.filter((r) => r.isEarlyFail === true).length

    return {
      totalGames,
      averageScore,
      bestScore,
      earlyWins,
      earlyFailures
    }
  })
}

const savePairedAnswers = (pairedAnswers: PairedAnswers): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    if (!checkStorageAvailable()) return

    yield* migrateStorageIfNeeded()

    const jsonString = yield* safeJsonStringify(pairedAnswers)
    if (jsonString !== undefined) {
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
    const rawAnswers = Option.getOrElse(parsed, () => ({}))

    // For now, return the raw answers as typed - can be improved later with proper schema
    return rawAnswers as PairedAnswers
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
            earlyWins: 0,
            earlyFailures: 0
          })),
      checkStorageAvailable: fn?.checkStorageAvailable ?? (() => false)
    })
  )
