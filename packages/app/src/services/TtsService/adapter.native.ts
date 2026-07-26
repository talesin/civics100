import { Effect } from 'effect'
import type { SpeechAdapter } from './adapter'

/**
 * Native SpeechAdapter — Phase-3 honest stub (isSupported: false, so UI hides
 * speech controls). Phase 6 replaces the internals with expo-speech in this
 * same file. Resolved by Metro in place of adapter.ts via the package-internal
 * relative import in service.ts.
 */
export const platformAdapter: SpeechAdapter = {
  isSupported: () => false,
  getVoices: () => Effect.succeed([]),
  onVoicesChanged: () => () => {},
  speakText: () => Effect.void,
  cancel: () => {}
}
