import React, { useState, useEffect } from 'react'
import { QuestionDisplay as GameQuestionType, QuestionAnswer } from '@/types'
import { useGameSounds } from '@/hooks/useGameSounds'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

interface GameQuestionProps {
  question: GameQuestionType
  onAnswer: (answer: QuestionAnswer) => void
  disabled?: boolean
}

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

  const getAnswerButtonClass = (answerIndex: number) => {
    const baseClass =
      'answer-button w-full text-left p-4 rounded-lg border transition-all duration-200 '
    
    const isSelected = selectedAnswers.includes(answerIndex)
    const correctIndices = Array.isArray(question.correctAnswerIndex) 
      ? question.correctAnswerIndex 
      : [question.correctAnswerIndex]
    const isCorrectAnswer = correctIndices.includes(answerIndex)

    if (!hasAnswered && !disabled) {
      if (isSelected && isMultipleChoice) {
        return (
          baseClass +
          'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
        )
      }
      return (
        baseClass +
        'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md'
      )
    }

    if (hasAnswered) {
      if (isCorrectAnswer === true) {
        return (
          baseClass +
          'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 animate-pulse-success'
        )
      } else if (isSelected) {
        return (
          baseClass +
          'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 animate-pulse-error'
        )
      } else {
        return (
          baseClass +
          'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
        )
      }
    }

    return (
      baseClass +
      'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
    )
  }

  return (
    <div className="card card-elevated">
      {/* Progress and Question Number */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
            Question {question.questionNumber} of {question.totalQuestions}
          </span>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className="progress-bar h-3 rounded-full transition-all duration-500"
              style={{
                width: `${(question.questionNumber / question.totalQuestions) * 100}%`
              }}
              role="progressbar"
              aria-valuenow={question.questionNumber}
              aria-valuemin={1}
              aria-valuemax={question.totalQuestions}
              aria-label={`Question ${question.questionNumber} of ${question.totalQuestions}`}
            />
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 text-balance leading-tight">
          {question.questionText}
        </h2>
        
        {/* Multiple choice instruction */}
        {isMultipleChoice && (
          <p className="text-sm text-blue-600 dark:text-blue-400 mb-4 font-medium">
            Select {expectedCount} answer{expectedCount > 1 ? 's' : ''} ({selectedAnswers.length}/{expectedCount} selected)
          </p>
        )}
      </div>

      {/* Answer Options */}
      <div
        className="space-y-3"
        role={isMultipleChoice ? "group" : "radiogroup"}
        aria-labelledby="question-text"
        aria-required="true"
      >
        {question.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(index)}
            disabled={hasAnswered || disabled}
            className={getAnswerButtonClass(index)}
            role={isMultipleChoice ? "checkbox" : "radio"}
            aria-checked={selectedAnswers.includes(index)}
            aria-describedby={hasAnswered ? 'answer-feedback' : undefined}
            data-answer-index={index}
          >
            <div className="flex items-start sm:items-center gap-3">
              <span className={`flex-shrink-0 w-8 h-8 ${isMultipleChoice ? 'rounded-md' : 'rounded-full'} border-2 border-current flex items-center justify-center text-sm font-bold transition-all duration-200`}>
                {isMultipleChoice && selectedAnswers.includes(index) ? '✓' : String.fromCharCode(65 + index)}
              </span>
              <span className="text-sm sm:text-base text-left leading-relaxed flex-1">
                {answer}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Keyboard Hint */}
      {!hasAnswered && !disabled && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
            💡 Use keyboard:{' '}
            <kbd className="bg-white dark:bg-gray-700 px-1 rounded text-xs">1-4</kbd> or{' '}
            <kbd className="bg-white dark:bg-gray-700 px-1 rounded text-xs">A-D</kbd> to {isMultipleChoice ? 'toggle' : 'select'} answers
            {isMultipleChoice && ` (need ${expectedCount - selectedAnswers.length} more)`}
          </p>
        </div>
      )}

      {/* Answer Feedback */}
      {hasAnswered && (
        <div
          id="answer-feedback"
          className="mt-6 p-4 rounded-lg animate-fade-in"
          role="status"
          aria-live="polite"
        >
          {(() => {
            const correctIndices = Array.isArray(question.correctAnswerIndex) 
              ? question.correctAnswerIndex 
              : [question.correctAnswerIndex]
            const isCorrect = validateAnswerSelection(
              selectedAnswers,
              correctIndices,
              question.expectedAnswers
            )
            return isCorrect
          })() ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-green-800 dark:text-green-200 font-semibold">
                  Correct! Well done!
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
                <div>
                  <span className="text-red-800 dark:text-red-200 font-semibold block">
                    Incorrect
                  </span>
                  <span className="text-red-700 dark:text-red-300 text-sm">
                    {(() => {
                      const correctIndices = Array.isArray(question.correctAnswerIndex) 
                        ? question.correctAnswerIndex 
                        : [question.correctAnswerIndex]
                      const correctAnswers = correctIndices.map(i => question.answers[i]).join(', ')
                      return isMultipleChoice 
                        ? `The correct answers are: ${correctAnswers}`
                        : `The correct answer is: ${correctAnswers}`
                    })()
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
