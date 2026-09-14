import { Effect } from 'effect'
import * as Speech from 'expo-speech'
import { TtsPlaybackError, type SpeechAdapter } from './adapter'

/**
 * Native SpeechAdapter (Phase 6) over expo-speech. Voice identifiers stand in
 * for the web voiceURI so the saved TtsSettings shape is unchanged; when no
 * voice is chosen the platform picks its en-US default. The native voice list
 * is fixed for the process, so onVoicesChanged never fires. Fiber interruption
 * stops speech mid-utterance, as on web. Resolved by Metro in place of
 * adapter.ts via the package-internal relative import in service.ts.
 */
export const platformAdapter: SpeechAdapter = {
  isSupported: () => true,
  getVoices: () =>
    Effect.promise(() => Speech.getAvailableVoicesAsync()).pipe(
      Effect.map((voices) =>
        voices.map((v) => ({ voiceURI: v.identifier, name: v.name, lang: v.language }))
      ),
      Effect.catchAllDefect(() => Effect.succeed([]))
    ),
  onVoicesChanged: () => () => {},
  speakText: (text, options) =>
    Effect.async<void, TtsPlaybackError>((resume) => {
      Speech.speak(text, {
        ...(options.voiceURI !== null ? { voice: options.voiceURI } : { language: 'en-US' }),
        rate: options.rate,
        pitch: 1,
        onDone: () => resume(Effect.void),
        onStopped: () => resume(Effect.void),
        onError: () => resume(Effect.fail(new TtsPlaybackError()))
      })

      return Effect.sync(() => {
        void Speech.stop()
      })
    }),
  cancel: () => {
    void Speech.stop()
  }
}
