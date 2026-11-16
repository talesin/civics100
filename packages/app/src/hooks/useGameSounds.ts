import { useCallback, useMemo } from 'react'
import { Effect } from 'effect'
import { AppRuntime } from '../services/ServiceLayer'
import { SoundService } from '../services/SoundService'

interface GameSounds {
  playCorrect: () => void
  playIncorrect: () => void
  playComplete: () => void
  playEarlyWin: () => void
}

export const useGameSounds = (): GameSounds => {
  // Guard SSR: don't build the runtime during server render.
  const sound = useMemo(
    () => (typeof window === 'undefined' ? null : AppRuntime.runSync(SoundService)),
    []
  )

  const playCorrect = useCallback(() => {
    if (sound !== null) void Effect.runPromise(sound.playCorrect())
  }, [sound])

  const playIncorrect = useCallback(() => {
    if (sound !== null) void Effect.runPromise(sound.playIncorrect())
  }, [sound])

  const playComplete = useCallback(() => {
    if (sound !== null) void Effect.runPromise(sound.playComplete())
  }, [sound])

  const playEarlyWin = useCallback(() => {
    if (sound !== null) void Effect.runPromise(sound.playEarlyWin())
  }, [sound])

  return {
    playCorrect,
    playIncorrect,
    playComplete,
    playEarlyWin
  }
}
