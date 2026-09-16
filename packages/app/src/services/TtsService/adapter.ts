import { Effect } from 'effect'
import { TtsPlaybackError } from './adapter.shared'
import type { SpeechAdapter } from './adapter.shared'

// Types + the error class live in adapter.shared.ts (shared by both halves);
// re-exported here so index.ts keeps one import site.
export { TtsPlaybackError } from './adapter.shared'
export type { SpeakOptions, SpeechAdapter, TtsVoice } from './adapter.shared'

/**
 * WEB (and default) SpeechAdapter over `speechSynthesis`. adapter.native.ts
 * is substituted by Metro via the package-internal relative import in
 * service.ts — never expose this file through an exports-map subpath.
 */
const isSupported = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window

// Voice resolution: exact voiceURI match if provided, otherwise en-US, otherwise
// any English voice.
const selectVoice = (voiceURI: string | null): SpeechSynthesisVoice | null => {
  const voices = speechSynthesis.getVoices()
  if (voiceURI != null) {
    return voices.find((v) => v.voiceURI === voiceURI) ?? null
  }
  return (
    voices.find((v) => v.lang === 'en-US') ?? voices.find((v) => v.lang.startsWith('en')) ?? null
  )
}

export const platformAdapter: SpeechAdapter = {
  isSupported,
  getVoices: () =>
    Effect.sync(() =>
      isSupported()
        ? speechSynthesis
            .getVoices()
            .map((v) => ({ voiceURI: v.voiceURI, name: v.name, lang: v.lang }))
        : []
    ),
  onVoicesChanged: (listener) => {
    if (!isSupported()) return () => {}
    speechSynthesis.addEventListener('voiceschanged', listener)
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', listener)
    }
  },
  speakText: (text, options) =>
    Effect.async<void, TtsPlaybackError>((resume) => {
      if (!isSupported()) {
        resume(Effect.void)
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      const voice = selectVoice(options.voiceURI)
      if (voice !== null) {
        utterance.voice = voice
      }
      utterance.rate = options.rate
      utterance.pitch = 1

      utterance.onend = () => resume(Effect.void)
      utterance.onerror = () => resume(Effect.fail(new TtsPlaybackError()))

      speechSynthesis.speak(utterance)

      // Fiber interruption stops speech mid-utterance (replaces the old
      // cancelledRef machinery in the hook).
      return Effect.sync(() => speechSynthesis.cancel())
    }),
  cancel: () => {
    if (isSupported()) {
      speechSynthesis.cancel()
    }
  }
}
