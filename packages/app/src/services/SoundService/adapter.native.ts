import { Effect } from 'effect'
import type { SoundAdapter } from './adapter'

/**
 * Native SoundAdapter — Phase-3 honest no-op stub. Phase 6 replaces the
 * internals with expo-audio (and bundled sound assets — native has no Web
 * Audio synth) in this same file. Resolved by Metro in place of adapter.ts
 * via the package-internal relative import in service.ts.
 */
export const platformAdapter: SoundAdapter = {
  playCorrect: () => Effect.void,
  playIncorrect: () => Effect.void,
  playComplete: () => Effect.void,
  playEarlyWin: () => Effect.void
}
