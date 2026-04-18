import { useState, useCallback, useRef, useEffect } from 'react'

interface UseTextToSpeechOptions {
  readonly questionText: string
  readonly answers: ReadonlyArray<string>
  readonly questionId: string
}

interface UseTextToSpeechReturn {
  readonly speak: () => void
  readonly isSpeaking: boolean
  readonly isSupported: boolean
}

const PAUSE_BETWEEN_SEGMENTS_MS = 400

const isSupported = (): boolean =>
  typeof window !== 'undefined' && 'speechSynthesis' in window

const buildSegments = (questionText: string, answers: ReadonlyArray<string>): string[] => {
  const segments = [questionText]
  for (let i = 0; i < answers.length; i++) {
    segments.push(`${String.fromCharCode(65 + i)}. ${answers[i]}`)
  }
  return segments
}

export const useTextToSpeech = ({
  questionText,
  answers,
  questionId,
}: UseTextToSpeechOptions): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)
  const supported = isSupported()

  // Select an English voice when voices become available
  useEffect(() => {
    if (!supported) return

    const selectVoice = () => {
      const voices = speechSynthesis.getVoices()
      voiceRef.current =
        voices.find((v) => v.lang === 'en-US') ??
        voices.find((v) => v.lang.startsWith('en')) ??
        null
    }

    selectVoice()
    speechSynthesis.addEventListener('voiceschanged', selectVoice)
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', selectVoice)
    }
  }, [supported])

  const cancel = useCallback(() => {
    cancelledRef.current = true
    if (pauseTimeoutRef.current !== null) {
      clearTimeout(pauseTimeoutRef.current)
      pauseTimeoutRef.current = null
    }
    if (supported) {
      speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [supported])

  const speak = useCallback(() => {
    if (!supported) return

    if (isSpeaking) {
      cancel()
      return
    }

    const segments = buildSegments(questionText, answers)
    let currentIndex = 0
    cancelledRef.current = false
    setIsSpeaking(true)

    const speakSegment = () => {
      if (cancelledRef.current || currentIndex >= segments.length) {
        if (!cancelledRef.current) {
          setIsSpeaking(false)
        }
        return
      }

      const utterance = new SpeechSynthesisUtterance(segments[currentIndex])
      if (voiceRef.current !== null) {
        utterance.voice = voiceRef.current
      }
      utterance.rate = 0.95
      utterance.pitch = 1

      utterance.onend = () => {
        if (cancelledRef.current) return
        currentIndex += 1
        pauseTimeoutRef.current = setTimeout(speakSegment, PAUSE_BETWEEN_SEGMENTS_MS)
      }

      utterance.onerror = () => {
        if (!cancelledRef.current) {
          setIsSpeaking(false)
        }
      }

      speechSynthesis.speak(utterance)
    }

    speakSegment()
  }, [supported, isSpeaking, cancel, questionText, answers])

  // Cancel on question change or unmount
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [questionId, cancel])

  return { speak, isSpeaking, isSupported: supported }
}
