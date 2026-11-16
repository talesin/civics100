import AsyncStorage from '@react-native-async-storage/async-storage'
import { Effect } from 'effect'
import type { StorageBackend } from './backend'

/**
 * Native StorageBackend over AsyncStorage. Resolved by Metro (and jest-expo)
 * in place of backend.ts via the platform-extension mechanism — this only
 * works because service.ts reaches it through a package-internal relative
 * import (never add this path to the package's exports map).
 *
 * AsyncStorage is always available on device; per-operation failures degrade
 * to the same defaults as the web backend (errors → null/ignore).
 */
export const platformBackend: StorageBackend = {
  isAvailable: () => Effect.succeed(true),
  getItem: (key) =>
    Effect.tryPromise({
      try: () => AsyncStorage.getItem(key),
      catch: () => null
    }).pipe(Effect.catchAll(() => Effect.succeed(null))),
  setItem: (key, value) =>
    Effect.tryPromise({
      try: () => AsyncStorage.setItem(key, value),
      catch: () => void 0
    }).pipe(Effect.catchAll(() => Effect.succeed(void 0))),
  removeItem: (key) =>
    Effect.tryPromise({
      try: () => AsyncStorage.removeItem(key),
      catch: () => void 0
    }).pipe(Effect.catchAll(() => Effect.succeed(void 0)))
}
