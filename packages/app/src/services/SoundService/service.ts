import { Effect, Layer } from 'effect'
// Platform split: Metro resolves adapter.native.ts here; web bundlers and
// ts-jest resolve adapter.ts. Keep this import package-internal.
import { platformAdapter } from './adapter'
import type { SoundAdapter } from './adapter'

export class SoundService extends Effect.Service<SoundService>()('SoundService', {
  effect: Effect.sync(() => platformAdapter)
}) {}

export const TestSoundServiceLayer = (fn?: Partial<SoundAdapter>) =>
  Layer.succeed(
    SoundService,
    SoundService.of({
      _tag: 'SoundService',
      playCorrect: fn?.playCorrect ?? (() => Effect.void),
      playIncorrect: fn?.playIncorrect ?? (() => Effect.void),
      playComplete: fn?.playComplete ?? (() => Effect.void),
      playEarlyWin: fn?.playEarlyWin ?? (() => Effect.void)
    })
  )
