import { Effect, Layer } from 'effect'
// Platform split: Metro resolves adapter.native.ts here; web bundlers and
// ts-jest resolve adapter.ts. Keep this import package-internal.
import { platformAdapter } from './adapter'
import type { SpeechAdapter } from './adapter'

export class TtsService extends Effect.Service<TtsService>()('TtsService', {
  effect: Effect.sync(() => platformAdapter)
}) {}

export const TestTtsServiceLayer = (fn?: Partial<SpeechAdapter>) =>
  Layer.succeed(
    TtsService,
    TtsService.of({
      _tag: 'TtsService',
      isSupported: fn?.isSupported ?? (() => false),
      getVoices: fn?.getVoices ?? (() => Effect.succeed([])),
      onVoicesChanged: fn?.onVoicesChanged ?? (() => () => {}),
      speakText: fn?.speakText ?? (() => Effect.void),
      cancel: fn?.cancel ?? (() => {})
    })
  )
