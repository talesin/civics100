import { Effect, Layer } from 'effect'
import { DEFAULT_GAME_SETTINGS, DEFAULT_TTS_SETTINGS } from '../../types'
// Platform split: Metro (and jest-expo) resolve backend.native.ts here; web
// bundlers and ts-jest resolve backend.ts. This relative import is the seam —
// keep it package-internal (see backend.ts).
import { platformBackend } from './backend'
import { makeLocalStorage } from './makeService'

export class LocalStorageService extends Effect.Service<LocalStorageService>()(
  'LocalStorageService',
  {
    effect: Effect.sync(() => makeLocalStorage(platformBackend))
  }
) {}

export const TestLocalStorageServiceLayer = (fn?: {
  saveGameResult?: LocalStorageService['saveGameResult']
  getGameResults?: LocalStorageService['getGameResults']
  saveGameSettings?: LocalStorageService['saveGameSettings']
  getGameSettings?: LocalStorageService['getGameSettings']
  hasSavedSettings?: LocalStorageService['hasSavedSettings']
  saveTtsSettings?: LocalStorageService['saveTtsSettings']
  getTtsSettings?: LocalStorageService['getTtsSettings']
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
      hasSavedSettings: fn?.hasSavedSettings ?? (() => Effect.succeed(false)),
      saveTtsSettings: fn?.saveTtsSettings ?? (() => Effect.succeed(void 0)),
      getTtsSettings: fn?.getTtsSettings ?? (() => Effect.succeed(DEFAULT_TTS_SETTINGS)),
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
      checkStorageAvailable: fn?.checkStorageAvailable ?? (() => Effect.succeed(false))
    })
  )
