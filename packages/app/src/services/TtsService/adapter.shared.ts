import type { Effect } from 'effect'

/**
 * Platform-neutral voice descriptor (web: SpeechSynthesisVoice fields; native:
 * expo-speech voice identifier fields).
 */
export interface TtsVoice {
  readonly voiceURI: string
  readonly name: string
  readonly lang: string
}

export interface SpeakOptions {
  readonly voiceURI: string | null
  readonly rate: number
}

export class TtsPlaybackError {
  readonly _tag = 'TtsPlaybackError'
}

/**
 * The platform-varying speech surface. Segment sequencing and pause pacing are
 * UI policy and stay in the useTextToSpeech hook; the adapter owns the speech
 * primitives only.
 *
 * Lives in a NON-split module: both adapter halves import it. A `.native.ts`
 * half importing a value from './adapter' would resolve to ITSELF under
 * Metro's platform resolution (require cycle, undefined class at call time).
 */
export interface SpeechAdapter {
  readonly isSupported: () => boolean
  readonly getVoices: () => Effect.Effect<readonly TtsVoice[]>
  readonly onVoicesChanged: (listener: () => void) => () => void
  readonly speakText: (text: string, options: SpeakOptions) => Effect.Effect<void, TtsPlaybackError>
  readonly cancel: () => void
}
