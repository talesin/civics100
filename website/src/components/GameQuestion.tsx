import React, { useState, useEffect } from 'react'
import { QuestionDisplay as GameQuestionType, QuestionAnswer } from '@/types'
import { useGameSounds } from '@/hooks/useGameSounds'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { Card, XStack, YStack, Text } from '@/components/tamagui'
import { styled } from 'tamagui'

interface GameQuestionProps {
  question: GameQuestionType
  onAnswer: (answer: QuestionAnswer) => void
  disabled?: boolean
}

const QuestionCard = styled(Card, {
  padding: '$6',
})

const ProgressText = styled(Text, {
  fontSize: '$2',
  fontWeight: '500',
  color: '#6b7280', // gray-500
})

const ProgressTrack = styled(YStack, {
  width: '100%',
  backgroundColor: '#e5e7eb', // gray-200
  borderRadius: 6,
  height: 12,
  overflow: 'hidden',
})

const ProgressBar = styled(YStack, {
  height: 12,
  borderRadius: 6,
  backgroundColor: '#3b82f6', // blue-500
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
  color: '#2563eb', // blue-600
  fontWeight: '500',
  marginBottom: '$3',
})

const KeyboardHintBox = styled(XStack, {
  marginTop: '$3',
  padding: '$3',
  backgroundColor: '#eff6ff', // blue-50
  borderRadius: '$3',
  borderWidth: 1,
  borderColor: '#bfdbfe', // blue-200
  justifyContent: 'center',
})

const KeyboardHintText = styled(Text, {
  fontSize: '$1',
  color: '#1d4ed8', // blue-700
  textAlign: 'center',
})

const FeedbackContainer = styled(YStack, {
  marginTop: '$4',
  padding: '$4',
  borderRadius: '$3',
})

const CorrectFeedback = styled(XStack, {
  backgroundColor: '#f0fdf4', // green-50
  borderWidth: 1,
  borderColor: '#bbf7d0', // green-200
  padding: '$4',
  borderRadius: '$3',
  alignItems: 'center',
})

const IncorrectFeedback = styled(YStack, {
  backgroundColor: '#fef2f2', // red-50
  borderWidth: 1,
  borderColor: '#fecaca', // red-200
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
        backgroundColor: '#22c55e', // green-500
      },
      error: {
        backgroundColor: '#ef4444', // red-500
      },
    },
  } as const,
})

const FeedbackText = styled(Text, {
  fontWeight: '600',

  variants: {
    variant: {
      success: {
        color: '#166534', // green-800
      },
      error: {
        color: '#991b1b', // red-800
      },
    },
  } as const,
})

const FeedbackDetail = styled(Text, {
  fontSize: '$2',
  color: '#b91c1c', // red-700
  marginTop: '$1',
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

// Button styles as React.CSSProperties
const getAnswerButtonStyles = (
  answerIndex: number,
  selectedAnswers: number[],
  hasAnswered: boolean,
  disabled: boolean,
  isMultipleChoice: boolean,
  correctIndices: number[]
): React.CSSProperties => {
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
        borderColor: '#3b82f6', // blue-500
        backgroundColor: '#eff6ff', // blue-50
        color: '#1e40af', // blue-800
      }
    }
    return {
      ...baseStyles,
      borderColor: '#d1d5db', // gray-300
      backgroundColor: 'white',
    }
  }

  if (hasAnswered) {
    if (isCorrectAnswer) {
      return {
        ...baseStyles,
        borderColor: '#22c55e', // green-500
        backgroundColor: '#f0fdf4', // green-50
        color: '#166534', // green-800
      }
    } else if (isSelected) {
      return {
        ...baseStyles,
        borderColor: '#ef4444', // red-500
        backgroundColor: '#fef2f2', // red-50
        color: '#991b1b', // red-800
      }
    } else {
      return {
        ...baseStyles,
        borderColor: '#d1d5db', // gray-300
        backgroundColor: '#f3f4f6', // gray-100
        color: '#6b7280', // gray-500
      }
    }
  }

  return {
    ...baseStyles,
    borderColor: '#d1d5db', // gray-300
    backgroundColor: '#f3f4f6', // gray-100
    color: '#6b7280', // gray-500
  }
}

export default function GameQuestion({ question, onAnswer, disabled = false }: GameQuestionProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([])
  const [hasAnswered, setHasAnswered] = useState(false)
  const { playCorrect, playIncorrect } = useGameSounds()

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

  // Keyboard navigation
  useKeyboardNavigation({
    onSelectAnswer: handleAnswerSelect,
    onNext: () => {}, // Will be handled by parent component
    onRestart: () => {}, // Will be handled by parent component
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
      {/* Progress and Question Number */}
      <YStack marginBottom="$4">
        <XStack
          flexDirection="column"
          marginBottom="$4"
          gap="$2"
          $sm={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <ProgressText>
            Question {question.questionNumber} of {question.totalQuestions}
          </ProgressText>
          <ProgressTrack>
            <ProgressBar
              width={`${(question.questionNumber / question.totalQuestions) * 100}%`}
              role="progressbar"
              aria-valuenow={question.questionNumber}
              aria-valuemin={1}
              aria-valuemax={question.totalQuestions}
              aria-label={`Question ${question.questionNumber} of ${question.totalQuestions}`}
            />
          </ProgressTrack>
        </XStack>

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
            style={getAnswerButtonStyles(index, selectedAnswers, hasAnswered, disabled, isMultipleChoice, correctIndices)}
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
