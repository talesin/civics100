import { Effect, Option, Schema } from 'effect'
import type { PairedAnswers } from 'questionnaire'
import {
  GameResult,
  WebsiteGameSettings,
  DEFAULT_GAME_SETTINGS,
  TtsSettings,
  DEFAULT_TTS_SETTINGS
} from '../../types'
import type { StorageBackend } from './backend'
import {
  GameResultSchema,
  PairedAnswersSchema,
  STORAGE_KEYS,
  STORAGE_VERSION,
  TtsSettingsSchema,
  WebsiteGameSettingsSchema,
  safeJsonParse,
  safeJsonStringify
} from './schemas'

/**
 * The full LocalStorageService implementation, written once against
 * StorageBackend. Per-operation failures degrade to the same defaults on every
 * platform (empty results / default settings), matching the original
 * localStorage behavior.
 */
export const makeLocalStorage = (backend: StorageBackend) => {
  const migrateStorageIfNeeded = (): Effect.Effect<void, never, never> => {
    return Effect.gen(function* () {
      if (!(yield* backend.isAvailable())) return

      const currentVersion = yield* backend.getItem(STORAGE_KEYS.VERSION)

      if (currentVersion !== STORAGE_VERSION) {
        yield* backend.setItem(STORAGE_KEYS.VERSION, STORAGE_VERSION)
      }
    })
  }

  const saveGameResult = (result: GameResult): Effect.Effect<void, never, never> => {
    return Effect.gen(function* () {
      if (!(yield* backend.isAvailable())) return

      yield* migrateStorageIfNeeded()

      const existingResults = yield* getGameResults()
      const updatedResults = [...existingResults, result]

      const maxResults = 50
      const resultsToKeep = updatedResults.slice(-maxResults)

      const jsonString = yield* safeJsonStringify(resultsToKeep)
      if (jsonString !== undefined) {
        yield* backend.setItem(STORAGE_KEYS.GAME_RESULTS, jsonString)
      }
    })
  }

  const getGameResults = (): Effect.Effect<readonly GameResult[], never, never> => {
    return Effect.gen(function* () {
      if (!(yield* backend.isAvailable())) return []

      yield* migrateStorageIfNeeded()

      const json = yield* backend.getItem(STORAGE_KEYS.GAME_RESULTS)

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
      if (!(yield* backend.isAvailable())) return

      yield* migrateStorageIfNeeded()

      const jsonString = yield* safeJsonStringify(settings)
      if (jsonString !== undefined) {
        yield* backend.setItem(STORAGE_KEYS.GAME_SETTINGS, jsonString)
      }
    })
  }

  const getGameSettings = (): Effect.Effect<WebsiteGameSettings, never, never> => {
    return Effect.gen(function* () {
      if (!(yield* backend.isAvailable())) return DEFAULT_GAME_SETTINGS

      yield* migrateStorageIfNeeded()

      const json = yield* backend.getItem(STORAGE_KEYS.GAME_SETTINGS)

      const parsed = safeJsonParse(json)
      const rawSettings = Option.getOrElse(parsed, () => ({}))

      // Use schema to validate and decode settings, fallback to defaults if invalid
      const settingsOption = Schema.decodeUnknownOption(WebsiteGameSettingsSchema)(rawSettings)

      if (Option.isSome(settingsOption)) {
        const decoded = settingsOption.value
        return {
          maxQuestions: decoded.maxQuestions,
          winThreshold: decoded.winThreshold,
          userState: decoded.userState,
          userDistrict: Option.isSome(decoded.userDistrict)
            ? decoded.userDistrict.value
            : undefined,
          questionNumbers: Option.isSome(decoded.questionNumbers)
            ? decoded.questionNumbers.value
            : undefined
        }
      }

      return DEFAULT_GAME_SETTINGS
    })
  }

  const hasSavedSettings = (): Effect.Effect<boolean, never, never> => {
    return Effect.gen(function* () {
      if (!(yield* backend.isAvailable())) return false

      const json = yield* backend.getItem(STORAGE_KEYS.GAME_SETTINGS)

      return json !== null
    })
  }

  const saveTtsSettings = (settings: TtsSettings): Effect.Effect<void, never, never> => {
    return Effect.gen(function* () {
      if (!(yield* backend.isAvailable())) return

      yield* migrateStorageIfNeeded()

      const jsonString = yield* safeJsonStringify(settings)
      if (jsonString !== undefined) {
        yield* backend.setItem(STORAGE_KEYS.TTS_SETTINGS, jsonString)
      }
    })
  }

  const getTtsSettings = (): Effect.Effect<TtsSettings, never, never> => {
    return Effect.gen(function* () {
      if (!(yield* backend.isAvailable())) return DEFAULT_TTS_SETTINGS

      yield* migrateStorageIfNeeded()

      const json = yield* backend.getItem(STORAGE_KEYS.TTS_SETTINGS)

      const parsed = safeJsonParse(json)
      const raw = Option.getOrElse(parsed, () => ({}))

      const decoded = Schema.decodeUnknownOption(TtsSettingsSchema)(raw)
      if (Option.isSome(decoded)) {
        return decoded.value
      }

      return DEFAULT_TTS_SETTINGS
    })
  }

  const clearAllData = (): Effect.Effect<void, never, never> => {
    return Effect.gen(function* () {
      if (!(yield* backend.isAvailable())) return

      yield* Effect.forEach(Object.values(STORAGE_KEYS), (key) => backend.removeItem(key), {
        discard: true
      })
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
      const averageScore = Math.round(
        results.reduce((sum, r) => sum + r.percentage, 0) / totalGames
      )
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
      if (!(yield* backend.isAvailable())) return

      yield* migrateStorageIfNeeded()

      const jsonString = yield* safeJsonStringify(pairedAnswers)
      if (jsonString !== undefined) {
        yield* backend.setItem(STORAGE_KEYS.PAIRED_ANSWERS, jsonString)
      }
    })
  }

  const getPairedAnswers = (): Effect.Effect<PairedAnswers, never, never> => {
    return Effect.gen(function* () {
      if (!(yield* backend.isAvailable())) return {}

      yield* migrateStorageIfNeeded()

      const json = yield* backend.getItem(STORAGE_KEYS.PAIRED_ANSWERS)

      const parsed = safeJsonParse(json)
      const rawAnswers = Option.getOrElse(parsed, () => ({}))

      // Validate and decode with schema
      const decodedOption = Schema.decodeUnknownOption(PairedAnswersSchema)(rawAnswers)

      if (Option.isSome(decodedOption)) {
        // Type cast rationale: Effect Schema cannot produce branded types (PairedQuestionNumber).
        // The schema validates the structure as Record<string, Array<{ts: Date, correct: boolean}>>,
        // which matches the shape of PairedAnswers. The branded type information is lost in
        // storage serialization anyway. The cast is safe because:
        // 1. Schema validates all keys are strings (would satisfy PairedQuestionNumber brand)
        // 2. Schema validates all values are valid AnswerHistory arrays
        // 3. Empty records and malformed data are handled by the Option.isNone path
        return decodedOption.value as PairedAnswers
      }

      // Return empty PairedAnswers for invalid/missing data
      // Cast is safe: empty record satisfies Record<PairedQuestionNumber, AnswerHistory>
      return {} as PairedAnswers
    })
  }

  return {
    saveGameResult,
    getGameResults,
    saveGameSettings,
    getGameSettings,
    hasSavedSettings,
    saveTtsSettings,
    getTtsSettings,
    savePairedAnswers,
    getPairedAnswers,
    clearAllData,
    getRecentResults,
    getGameStats,
    checkStorageAvailable: backend.isAvailable
  }
}
