import { Effect } from 'effect'

/**
 * The platform-varying storage surface. The 13 LocalStorageService methods are
 * written once (makeService.ts) against this interface; only the backend is
 * platform-split.
 *
 * This file is the WEB (and default) implementation over `localStorage`.
 * backend.native.ts provides the AsyncStorage implementation; Metro (and
 * jest-expo) substitute it via the package-INTERNAL relative import in
 * service.ts — never expose this file through an exports-map subpath, or the
 * `.native` substitution breaks.
 */
export interface StorageBackend {
  readonly isAvailable: () => Effect.Effect<boolean>
  readonly getItem: (key: string) => Effect.Effect<string | null>
  readonly setItem: (key: string, value: string) => Effect.Effect<void>
  readonly removeItem: (key: string) => Effect.Effect<void>
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

export const platformBackend: StorageBackend = {
  isAvailable: () => Effect.sync(checkStorageAvailable),
  getItem: (key) =>
    Effect.try({
      try: () => localStorage.getItem(key),
      catch: () => null
    }).pipe(Effect.catchAll(() => Effect.succeed(null))),
  setItem: (key, value) =>
    Effect.try({
      try: () => localStorage.setItem(key, value),
      catch: () => void 0
    }).pipe(Effect.catchAll(() => Effect.succeed(void 0))),
  removeItem: (key) =>
    Effect.try({
      try: () => localStorage.removeItem(key),
      catch: () => void 0
    }).pipe(Effect.catchAll(() => Effect.succeed(void 0)))
}
