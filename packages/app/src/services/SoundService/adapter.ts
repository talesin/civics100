import { Effect } from 'effect'

/**
 * The platform-varying game-sound surface.
 *
 * This file is the WEB (and default) implementation: synthesized oscillator
 * tones over a single lazily-created AudioContext held in module closure
 * (service memoization via AppRuntime makes it an app-wide singleton).
 * adapter.native.ts is substituted by Metro via the package-internal relative
 * import in service.ts — never expose this file through an exports-map subpath.
 */
export interface SoundAdapter {
  readonly playCorrect: () => Effect.Effect<void>
  readonly playIncorrect: () => Effect.Effect<void>
  readonly playComplete: () => Effect.Effect<void>
  readonly playEarlyWin: () => Effect.Effect<void>
}

let audioContext: AudioContext | null = null

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  if (audioContext === null) {
    const FinalAudioContext =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (FinalAudioContext !== undefined) {
      audioContext = new FinalAudioContext()
    }
  }
  return audioContext
}

const playTone = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine'
): Effect.Effect<void> =>
  Effect.sync(() => {
    try {
      const ctx = getAudioContext()
      if (ctx === null) return

      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
      oscillator.type = type

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch (error) {
      // Silently fail if audio context is not available
      console.debug('Audio not available:', error)
    }
  })

// Tone sequences mirror the original setTimeout offsets (sleep = gap to next tone).
export const platformAdapter: SoundAdapter = {
  playCorrect: () =>
    // Happy ascending tone: C5, E5, G5 at 0/100/200ms
    Effect.gen(function* () {
      yield* playTone(523.25, 0.2)
      yield* Effect.sleep(100)
      yield* playTone(659.25, 0.2)
      yield* Effect.sleep(100)
      yield* playTone(783.99, 0.3)
    }),
  playIncorrect: () =>
    // Descending disappointed tone: F4, D4 at 0/150ms
    Effect.gen(function* () {
      yield* playTone(349.23, 0.3, 'square')
      yield* Effect.sleep(150)
      yield* playTone(293.66, 0.4, 'square')
    }),
  playComplete: () =>
    // Victory fanfare: C5, E5, G5, C6 at 0/100/200/300ms
    Effect.gen(function* () {
      yield* playTone(523.25, 0.2)
      yield* Effect.sleep(100)
      yield* playTone(659.25, 0.2)
      yield* Effect.sleep(100)
      yield* playTone(783.99, 0.2)
      yield* Effect.sleep(100)
      yield* playTone(1046.5, 0.4)
    }),
  playEarlyWin: () =>
    // Special early win celebration: A5, D6, F6, A6 at 0/80/160/240ms
    Effect.gen(function* () {
      yield* playTone(880, 0.15)
      yield* Effect.sleep(80)
      yield* playTone(1174.66, 0.15)
      yield* Effect.sleep(80)
      yield* playTone(1396.91, 0.15)
      yield* Effect.sleep(80)
      yield* playTone(1760, 0.3)
    })
}
