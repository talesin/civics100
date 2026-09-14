import { Effect } from 'effect'
import { createAudioPlayer, type AudioPlayer, type AudioSource } from 'expo-audio'
import type { SoundAdapter } from './adapter'
import completeWav from '../../../assets/sounds/complete.wav'
import correctWav from '../../../assets/sounds/correct.wav'
import earlyWinWav from '../../../assets/sounds/early-win.wav'
import incorrectWav from '../../../assets/sounds/incorrect.wav'

/**
 * Native SoundAdapter (Phase 6) over expo-audio. React Native has no
 * oscillator, so the web adapter's tone sequences are rendered once by
 * `scripts/render-sounds.mjs` into `assets/sounds/*.wav` and bundled as Metro
 * assets. One player per sound, created lazily and kept for the app's life
 * (the service is an AppRuntime singleton); replaying rewinds it. Respects the
 * iOS silent switch (no `playsInSilentMode`), like any game's effects.
 * Resolved by Metro in place of adapter.ts via the package-internal relative
 * import in service.ts.
 */
const players = new Map<string, AudioPlayer>()

const play = (key: string, source: AudioSource): Effect.Effect<void> =>
  Effect.sync(() => {
    try {
      let player = players.get(key)
      if (player === undefined) {
        player = createAudioPlayer(source)
        players.set(key, player)
      }
      const current = player
      void current.seekTo(0).then(() => current.play())
    } catch (error) {
      // Silently fail if audio is unavailable (mirrors the web adapter)
      console.debug('Audio not available:', error)
    }
  })

export const platformAdapter: SoundAdapter = {
  playCorrect: () => play('correct', correctWav),
  playIncorrect: () => play('incorrect', incorrectWav),
  playComplete: () => play('complete', completeWav),
  playEarlyWin: () => play('early-win', earlyWinWav)
}
