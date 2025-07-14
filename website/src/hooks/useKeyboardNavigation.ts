import { useEffect, useCallback } from "react";

interface KeyboardNavigationOptions {
  onSelectAnswer: (index: number) => void;
  onNext: () => void;
  onRestart: () => void;
  isAnswered: boolean;
  totalAnswers: number;
  disabled?: boolean;
}

// TODO look for efficiency/maintenance improvements
export const useKeyboardNavigation = ({
  onSelectAnswer,
  onNext,
  onRestart,
  isAnswered,
  totalAnswers,
  disabled = false,
}: KeyboardNavigationOptions) => {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (disabled) return;

      // Prevent default behavior for game controls
      if (
        ["1", "2", "3", "4", "a", "b", "c", "d", "enter", " ", "r"].includes(
          event.key.toLowerCase()
        )
      ) {
        event.preventDefault();
      }

      // Answer selection with numbers (1-4)
      if (!isAnswered) {
        const numberKey = parseInt(event.key);
        if (numberKey >= 1 && numberKey <= totalAnswers) {
          onSelectAnswer(numberKey - 1);
          return;
        }

        // Answer selection with letters (A-D)
        const letterKey = event.key.toLowerCase();
        if (["a", "b", "c", "d"].includes(letterKey)) {
          const answerIndex = letterKey.charCodeAt(0) - "a".charCodeAt(0);
          if (answerIndex < totalAnswers) {
            onSelectAnswer(answerIndex);
            return;
          }
        }
      }

      // Navigation controls
      if (event.key === "Enter" || event.key === " ") {
        if (isAnswered) {
          onNext();
        }
        return;
      }

      // Restart with 'R' key
      if (event.key.toLowerCase() === "r") {
        onRestart();
        return;
      }

      // Help with '?' key
      if (event.key === "?" || event.key === "/") {
        // Could show help modal in future
        console.log(
          "Keyboard shortcuts: 1-4 or A-D to select answers, Enter/Space for next, R to restart"
        );
        return;
      }
    },
    [onSelectAnswer, onNext, onRestart, isAnswered, totalAnswers, disabled]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return {
    // Could return additional keyboard state if needed
  };
};
