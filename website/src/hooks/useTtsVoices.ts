import { useState, useEffect } from 'react'

/**
 * Returns the list of available English speech synthesis voices.
 * Updates reactively when voices load asynchronously (voiceschanged event).
 */
export const useTtsVoices = (): SpeechSynthesisVoice[] => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    const update = () => {
      const all = speechSynthesis.getVoices()
      setVoices(all.filter((v) => v.lang.startsWith('en')))
    }

    update()
    speechSynthesis.addEventListener('voiceschanged', update)
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', update)
    }
  }, [])

  return voices
}
