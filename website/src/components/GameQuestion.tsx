import React, { useState, useEffect, useCallback } from 'react'
import { QuestionDisplay as GameQuestionType, QuestionAnswer } from '@/types'
import { useGameSounds } from '@/hooks/useGameSounds'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { Card, XStack, YStack, Text } from '@/components/tamagui'
import { styled } from 'tamagui'
import { useThemeContext } from '@/components/TamaguiProvider'

interface GameQuestionProps {
  readonly question: GameQuestionType
  readonly onAnswer: (answer: QuestionAnswer) => void
  readonly disabled?: boolean
}

const QuestionCard = styled(Card, {
  padding: '$6',
})

const QuestionTitle = styled(Text, {
  fontSize: '$6',
  fontWeight: 'bold',
  color: '$color',
  marginBottom: '$2',
  lineHeight: 28,
})

const MultipleChoiceHint = styled(Text, {
  fontSize: '$2',
  color: '$primary',
  fontWeight: '500',
  marginBottom: '$3',
})

const KeyboardHintBox = styled(XStack, {
  marginTop: '$4',
  padding: '$4',
  backgroundColor: '$backgroundHover',
  borderRadius: '$3',
  borderWidth: 1,
  borderColor: '$borderColor',
  justifyContent: 'center',
})

const KeyboardHintText = styled(Text, {
  fontSize: '$3',
  color: '$placeholderColor',
  textAlign: 'center',
})

const FeedbackContainer = styled(YStack, {
  marginTop: '$4',
  padding: '$4',
  borderRadius: '$3',
})

const CorrectFeedback = styled(XStack, {
  backgroundColor: '$green1',
  borderWidth: 1,
  borderColor: '$green2',
  padding: '$4',
  borderRadius: '$3',
  alignItems: 'center',
})

const IncorrectFeedback = styled(YStack, {
  backgroundColor: '$error1',
  borderWidth: 1,
  borderColor: '$error2',
  padding: '$4',
  borderRadius: '$3',
})

const FeedbackIconCircle = styled(YStack, {
  width: 24,
  height: 24,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '$3',

  variants: {
    variant: {
      success: {
        backgroundColor: '$success',
      },
      error: {
        backgroundColor: '$error',
      },
    },
  } as const,
})

const FeedbackText = styled(Text, {
  fontSize: '$5',
  fontWeight: '600',

  variants: {
    variant: {
      success: {
        color: '$green7',
      },
      error: {
        color: '$error',
      },
    },
  } as const,
})

const FeedbackDetail = styled(Text, {
  fontSize: '$4',
  color: '$error',
  marginTop: '$2',
})

/**
 * Validate user answer selection against question requirements
 * Uses the same logic as GameService.validateAnswerSelection
 */
const validateAnswerSelection = (
  selectedAnswers: number | ReadonlyArray<number>,
  correctAnswer: number | ReadonlyArray<number>,
  expectedAnswers?: number
): boolean => {
  // Handle legacy single answer format
  if (typeof selectedAnswers === 'number' && typeof correctAnswer === 'number') {
    return selectedAnswers === correctAnswer
  }

  // Handle multiple answer format
  const selectedArray = Array.isArray(selectedAnswers) ? selectedAnswers : [selectedAnswers]
  const correctArray = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]

  // Check if we have the expected number of answers
  if (expectedAnswers !== undefined && selectedArray.length !== expectedAnswers) {
    return false
  }

  // For multiple answers, check if all selected answers are correct
  // Note: For questions with multiple correct options (like Cabinet positions),
  // users only need to select the expected number of correct answers, not all correct answers
  return selectedArray.every((answer) => correctArray.includes(answer))
}

// Theme-aware answer button color definitions
const getAnswerButtonColors = (isDark: boolean) => ({
  // Default state (not answered, not selected)
  default: {
    border: isDark ? '#404040' : '#d1d5db',
    bg: isDark ? '#262626' : 'white',
    text: isDark ? '#e5e5e5' : '#1f2937',
  },
  // Selected state (multiple choice, before submit)
  selected: {
    border: isDark ? '#60a5fa' : '#3b82f6',
    bg: isDark ? '#1e3a5f' : '#eff6ff',
    text: isDark ? '#93c5fd' : '#1e40af',
  },
  // Correct answer (after submit)
  correct: {
    border: isDark ? '#4ade80' : '#22c55e',
    bg: isDark ? '#14532d' : '#f0fdf4',
    text: isDark ? '#86efac' : '#166534',
  },
  // Incorrect answer (after submit, user selected wrong)
  incorrect: {
    border: isDark ? '#f87171' : '#ef4444',
    bg: isDark ? '#7f1d1d' : '#fef2f2',
    text: isDark ? '#fecaca' : '#991b1b',
  },
  // Disabled/dimmed state (other options after answering)
  disabled: {
    border: isDark ? '#404040' : '#d1d5db',
    bg: isDark ? '#1a1a1a' : '#f3f4f6',
    text: isDark ? '#71717a' : '#6b7280',
  },
})

// Button styles as React.CSSProperties
const getAnswerButtonStyles = (
  answerIndex: number,
  selectedAnswers: number[],
  hasAnswered: boolean,
  disabled: boolean,
  isMultipleChoice: boolean,
  correctIndices: number[],
  isDark: boolean
): React.CSSProperties => {
  const colors = getAnswerButtonColors(isDark)

  const baseStyles: React.CSSProperties = {
    width: '100%',
    textAlign: 'left',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'solid',
    transition: 'all 200ms',
    cursor: hasAnswered || disabled ? 'default' : 'pointer',
    display: 'block',
  }

  const isSelected = selectedAnswers.includes(answerIndex)
  const isCorrectAnswer = correctIndices.includes(answerIndex)

  if (!hasAnswered && !disabled) {
    if (isSelected && isMultipleChoice) {
      return {
        ...baseStyles,
        borderColor: colors.selected.border,
        backgroundColor: colors.selected.bg,
        color: colors.selected.text,
      }
    }
    return {
      ...baseStyles,
      borderColor: colors.default.border,
      backgroundColor: colors.default.bg,
      color: colors.default.text,
    }
  }

  if (hasAnswered) {
    if (isCorrectAnswer) {
      return {
        ...baseStyles,
        borderColor: colors.correct.border,
        backgroundColor: colors.correct.bg,
        color: colors.correct.text,
      }
    } else if (isSelected) {
      return {
        ...baseStyles,
        borderColor: colors.incorrect.border,
        backgroundColor: colors.incorrect.bg,
        color: colors.incorrect.text,
      }
    } else {
      return {
        ...baseStyles,
        borderColor: colors.disabled.border,
        backgroundColor: colors.disabled.bg,
        color: colors.disabled.text,
      }
    }
  }

  return {
    ...baseStyles,
    borderColor: colors.disabled.border,
    backgroundColor: colors.disabled.bg,
    color: colors.disabled.text,
  }
}

export default function GameQuestion({ question, onAnswer, disabled = false }: GameQuestionProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [hasAnswered, setHasAnswered] = useState(false)
  const { playCorrect, playIncorrect } = useGameSounds()
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const isMultipleChoice = (question.expectedAnswers ?? 1) > 1
  const expectedCount = question.expectedAnswers ?? 1

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered || disabled) return

    if (isMultipleChoice) {
      // Handle multiple choice selection
      const newSelection = selectedAnswers.includes(answerIndex)
        ? selectedAnswers.filter(i => i !== answerIndex)
        : [...selectedAnswers, answerIndex]

      setSelectedAnswers(newSelection)

      // Don't submit until we have the expected number of answers
      if (newSelection.length !== expectedCount) {
        return
      }

      submitAnswer(newSelection)
    } else {
      // Handle single choice selection
      setSelectedAnswers([answerIndex])
      submitAnswer([answerIndex])
    }
  }

  const submitAnswer = (selectedIndices: number[]) => {
    setHasAnswered(true)

    // Validate answer using proper multi-answer validation logic
    const correctIndices = Array.isArray(question.correctAnswerIndex)
      ? question.correctAnswerIndex
      : [question.correctAnswerIndex]

    const isCorrect = validateAnswerSelection(
      selectedIndices,
      correctIndices,
      question.expectedAnswers
    )

    // Play sound feedback
    if (isCorrect) {
      playCorrect()
    } else {
      playIncorrect()
    }

    const answer: QuestionAnswer = {
      questionId: question.id,
      selectedAnswerIndex: isMultipleChoice ? selectedIndices : selectedIndices[0] ?? 0,
      isCorrect,
      answeredAt: new Date()
    }

    onAnswer(answer)
  }

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswers([])
    setHasAnswered(false)
  }, [question.id])

  // Stable no-op callback for keyboard navigation
  const noOp = useCallback(() => {}, [])

  // Keyboard navigation
  useKeyboardNavigation({
    onSelectAnswer: handleAnswerSelect,
    onNext: noOp, // Will be handled by parent component
    onRestart: noOp, // Will be handled by parent component
    isAnswered: hasAnswered,
    totalAnswers: question.answers.length,
    disabled: disabled || hasAnswered
  })

  const correctIndices = Array.isArray(question.correctAnswerIndex)
    ? question.correctAnswerIndex
    : [question.correctAnswerIndex]

  const isCorrect = hasAnswered && validateAnswerSelection(
    selectedAnswers,
    correctIndices,
    question.expectedAnswers
  )

  return (
    <QuestionCard elevated>
      {/* Question Text */}
      <YStack marginBottom="$4">
        <QuestionTitle>
          {question.questionText}
        </QuestionTitle>

        {/* Multiple choice instruction */}
        {isMultipleChoice === true ? (
          <MultipleChoiceHint>
            Select {expectedCount} answer{expectedCount > 1 ? 's' : ''} ({selectedAnswers.length}/{expectedCount} selected)
          </MultipleChoiceHint>
        ) : null}
      </YStack>

      {/* Answer Options */}
      <YStack
        gap="$3"
        role={isMultipleChoice ? "group" : "radiogroup"}
        aria-labelledby="question-text"
        aria-required={true}
      >
        {question.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(index)}
            disabled={hasAnswered || disabled}
            style={getAnswerButtonStyles(index, selectedAnswers, hasAnswered, disabled, isMultipleChoice, correctIndices, isDark)}
            role={isMultipleChoice ? "checkbox" : "radio"}
            aria-checked={selectedAnswers.includes(index)}
            aria-describedby={hasAnswered ? 'answer-feedback' : undefined}
            data-answer-index={index}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{
                flexShrink: 0,
                width: 32,
                height: 32,
                borderRadius: isMultipleChoice ? 6 : 16,
                borderWidth: 2,
                borderStyle: 'solid',
                borderColor: 'currentColor',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 'bold',
              }}>
                {isMultipleChoice && selectedAnswers.includes(index) ? '✓' : String.fromCharCode(65 + index)}
              </span>
              <span style={{ fontSize: 14, textAlign: 'left', lineHeight: 1.5, flex: 1 }}>
                {answer}
              </span>
            </div>
          </button>
        ))}
      </YStack>

      {/* Keyboard Hint */}
      {hasAnswered === false && disabled === false ? (
        <KeyboardHintBox>
          <KeyboardHintText>
            Use keyboard: 1-4 or A-D to {isMultipleChoice === true ? 'toggle' : 'select'} answers
            {isMultipleChoice === true ? ` (need ${expectedCount - selectedAnswers.length} more)` : ''}
          </KeyboardHintText>
        </KeyboardHintBox>
      ) : null}

      {/* Answer Feedback */}
      {hasAnswered === true ? (
        <FeedbackContainer
          id="answer-feedback"
          role="status"
          aria-live="polite"
        >
          {isCorrect ? (
            <CorrectFeedback>
              <FeedbackIconCircle variant="success">
                <svg
                  width={16}
                  height={16}
                  fill="none"
                  stroke="white"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </FeedbackIconCircle>
              <FeedbackText variant="success">
                Correct! Well done!
              </FeedbackText>
            </CorrectFeedback>
          ) : (
            <IncorrectFeedback>
              <XStack alignItems="flex-start">
                <FeedbackIconCircle variant="error" marginTop={2}>
                  <svg
                    width={16}
                    height={16}
                    fill="none"
                    stroke="white"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </FeedbackIconCircle>
                <YStack>
                  <FeedbackText variant="error">
                    Incorrect
                  </FeedbackText>
                  <FeedbackDetail>
                    {isMultipleChoice
                      ? `The correct answers are: ${correctIndices.map(i => question.answers[i]).join(', ')}`
                      : `The correct answer is: ${correctIndices.map(i => question.answers[i]).join(', ')}`
                    }
                  </FeedbackDetail>
                </YStack>
              </XStack>
            </IncorrectFeedback>
          )}
        </FeedbackContainer>
      ) : null}
    </QuestionCard>
  )
}
