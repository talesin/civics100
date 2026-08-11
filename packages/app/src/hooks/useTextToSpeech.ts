import { useCallback, useEffect, useRef, useState } from 'react'
import { Effect, Fiber } from 'effect'
import { AppRuntime } from '../services/ServiceLayer'
import { TtsService } from '../services/TtsService'

interface UseTextToSpeechOptions {
  readonly questionText: string
  readonly answers: ReadonlyArray<string>
  readonly questionId: string
  readonly voiceURI?: string | null
  readonly rate?: number
}

interface UseTextToSpeechReturn {
  readonly speak: () => void
  readonly isSpeaking: boolean
  readonly isSupported: boolean
}

const PAUSE_BETWEEN_SEGMENTS_MS = 400

const DEFAULT_RATE = 0.95

const buildSegments = (questionText: string, answers: ReadonlyArray<string>): readonly string[] => [
  questionText,
  ...answers.map((answer, i) => `${String.fromCharCode(65 + i)}. ${answer}`)
]

/**
 * Reads the question and answers aloud via TtsService. React keeps the
 * isSpeaking state and question-change/unmount cancellation; the segment chain
 * (with 400ms pauses) runs in a forked Effect fiber, and cancellation is fiber
 * interruption (which stops speech via the adapter's interruption handler).
 */
export const useTextToSpeech = ({
  questionText,
  answers,
  questionId,
  voiceURI,
  rate = DEFAULT_RATE
}: UseTextToSpeechOptions): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const fiberRef = useRef<Fiber.RuntimeFiber<void> | null>(null)
  // Guard SSR: don't build the runtime during server render. Lazy useState
  // initializer = the render-safe once-only init (the value is needed during
  // render for `isSupported`, so a ref would violate react-hooks/refs).
  const [tts] = useState<TtsService | null>(() =>
    typeof window === 'undefined' ? null : AppRuntime.runSync(TtsService)
  )
  const supported = tts !== null && tts.isSupported()

  const cancel = useCallback(() => {
    const fiber = fiberRef.current
    fiberRef.current = null
    if (fiber !== null) {
      void Effect.runPromise(Fiber.interrupt(fiber))
    }
    tts?.cancel()
    setIsSpeaking(false)
  }, [tts])

  const speak = useCallback(() => {
    if (tts === null || !tts.isSupported()) return

    // Toggle: speaking again while a chain is in flight cancels it.
    if (fiberRef.current !== null) {
      cancel()
      return
    }

    const segments = buildSegments(questionText, answers)
    setIsSpeaking(true)

    const program = Effect.forEach(
      segments,
      (text, i) =>
        (i === 0 ? Effect.void : Effect.sleep(PAUSE_BETWEEN_SEGMENTS_MS)).pipe(
          Effect.andThen(tts.speakText(text, { voiceURI: voiceURI ?? null, rate }))
        ),
      { discard: true }
      // A playback error stops the remaining segments (fail-fast), matching the
      // original onerror behavior.
    ).pipe(Effect.catchAll(() => Effect.void))

    const fiber = AppRuntime.runFork(program)
    fiberRef.current = fiber
    fiber.addObserver(() => {
      // Only clean up if this fiber is still the active one (cancel/speak may
      // have replaced it before the observer fires).
      if (fiberRef.current === fiber) {
        fiberRef.current = null
        setIsSpeaking(false)
      }
    })
  }, [tts, cancel, questionText, answers, voiceURI, rate])

  // Cancel on question change or unmount
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [questionId, cancel])

  return { speak, isSpeaking, isSupported: supported }
}
