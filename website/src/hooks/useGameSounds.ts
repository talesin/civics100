import { useCallback, useRef } from "react";

interface GameSounds {
  playCorrect: () => void;
  playIncorrect: () => void;
  playComplete: () => void;
  playEarlyWin: () => void;
}

export const useGameSounds = (): GameSounds => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (audioContextRef.current === null) {
      const AudioContextClass = window.AudioContext;
      const webkitAudioContext =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitAudioContext;
      const FinalAudioContext = AudioContextClass ?? webkitAudioContext;
      audioContextRef.current = new FinalAudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, type: OscillatorType = "sine") => {
      try {
        const audioContext = getAudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(
          frequency,
          audioContext.currentTime,
        );
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + duration,
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      } catch (error) {
        // Silently fail if audio context is not available
        console.debug("Audio not available:", error);
      }
    },
    [getAudioContext],
  );

  const playCorrect = useCallback(() => {
    // Happy ascending tone
    playTone(523.25, 0.2); // C5
    setTimeout(() => playTone(659.25, 0.2), 100); // E5
    setTimeout(() => playTone(783.99, 0.3), 200); // G5
  }, [playTone]);

  const playIncorrect = useCallback(() => {
    // Descending disappointed tone
    playTone(349.23, 0.3, "square"); // F4
    setTimeout(() => playTone(293.66, 0.4, "square"), 150); // D4
  }, [playTone]);

  const playComplete = useCallback(() => {
    // Victory fanfare
    playTone(523.25, 0.2); // C5
    setTimeout(() => playTone(659.25, 0.2), 100); // E5
    setTimeout(() => playTone(783.99, 0.2), 200); // G5
    setTimeout(() => playTone(1046.5, 0.4), 300); // C6
  }, [playTone]);

  const playEarlyWin = useCallback(() => {
    // Special early win celebration
    playTone(880, 0.15); // A5
    setTimeout(() => playTone(1174.66, 0.15), 80); // D6
    setTimeout(() => playTone(1396.91, 0.15), 160); // F6
    setTimeout(() => playTone(1760, 0.3), 240); // A6
  }, [playTone]);

  return {
    playCorrect,
    playIncorrect,
    playComplete,
    playEarlyWin,
  };
};
