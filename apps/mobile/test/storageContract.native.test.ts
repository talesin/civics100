import { expect, it, jest } from '@jest/globals'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Effect } from 'effect'
// Under jest-expo's haste platform resolution this import chain picks
// backend.native.ts (AsyncStorage) — the same mechanism Metro uses on device.
import { LocalStorageService } from 'app/services/LocalStorageService'
import { describeStorageContract } from 'app/services/testing/storageContract'

describeStorageContract({
  label: 'native/AsyncStorage (jest-expo)',
  layer: LocalStorageService.Default,
  reset: async () => {
    await AsyncStorage.clear()
    jest.clearAllMocks()
  }
})

// Honest-signal check: prove the resolved layer actually writes through
// AsyncStorage (the web layer in this node env would report storage
// unavailable and no-op, so the contract itself would fail — this makes the
// failure mode explicit).
it('persists via AsyncStorage, not a web shim', async () => {
  await AsyncStorage.clear()
  jest.clearAllMocks()

  await Effect.runPromise(
    Effect.gen(function* () {
      const storageService = yield* LocalStorageService
      yield* storageService.saveGameResult({
        sessionId: 'native-probe',
        totalQuestions: 10,
        correctAnswers: 9,
        incorrectAnswers: 1,
        percentage: 90,
        isEarlyWin: false,
        isEarlyFail: false,
        completedAt: new Date()
      })
    }).pipe(Effect.provide(LocalStorageService.Default))
  )

  expect(AsyncStorage.setItem).toHaveBeenCalled()
  expect(await AsyncStorage.getItem('civics100_game_results')).not.toBeNull()
})
