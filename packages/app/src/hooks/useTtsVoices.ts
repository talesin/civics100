import { useEffect, useState } from 'react'
import { Effect } from 'effect'
import { AppRuntime } from '../services/ServiceLayer'
import { TtsService } from '../services/TtsService'
import type { TtsVoice } from '../services/TtsService'

/**
 * Returns the list of available English speech synthesis voices.
 * Updates reactively when voices load asynchronously (voiceschanged event).
 */
export const useTtsVoices = (): readonly TtsVoice[] => {
  const [voices, setVoices] = useState<readonly TtsVoice[]>([])

  useEffect(() => {
    const tts = AppRuntime.runSync(TtsService)
    if (!tts.isSupported()) return

    const update = (): void => {
      void Effect.runPromise(tts.getVoices()).then((all) => {
        setVoices(all.filter((v) => v.lang.startsWith('en')))
      })
    }

    update()
    return tts.onVoicesChanged(update)
  }, [])

  return voices
}
