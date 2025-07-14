import React, { useState, useEffect } from 'react'
import { GameQuestion as GameQuestionType, QuestionAnswer } from '@/types'
import { useGameSounds } from '@/hooks/useGameSounds'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

interface GameQuestionProps {
  question: GameQuestionType
  onAnswer: (answer: QuestionAnswer) => void
  disabled?: boolean
}

export default function GameQuestion({ question, onAnswer, disabled = false }: GameQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const { playCorrect, playIncorrect } = useGameSounds()

  const handleAnswerSelect = (answerIndex: number) => {
    if (hasAnswered || disabled) return
    
    setSelectedAnswer(answerIndex)
    setHasAnswered(true)
    
    const isCorrect = answerIndex === question.correctAnswerIndex
    
    // Play sound feedback
    if (isCorrect) {
      playCorrect()
    } else {
      playIncorrect()
    }
    
    const answer: QuestionAnswer = {
      questionId: question.id,
      selectedAnswerIndex: answerIndex,
      isCorrect,
      answeredAt: new Date()
    }
    
    onAnswer(answer)
  }

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null)
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
    const baseClass = "answer-button w-full text-left p-4 rounded-lg border transition-all duration-200 "
    
    if (!hasAnswered && !disabled) {
      return baseClass + "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md"
    }
    
    if (hasAnswered) {
      if (answerIndex === question.correctAnswerIndex) {
        return baseClass + "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 animate-pulse-success"
      } else if (answerIndex === selectedAnswer) {
        return baseClass + "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 animate-pulse-error"
      } else {
        return baseClass + "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
      }
    }
    
    return baseClass + "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Question {question.questionNumber} of {question.totalQuestions}
          </span>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 ml-4 overflow-hidden">
            <div 
              className="progress-bar h-2 rounded-full"
              style={{ width: `${(question.questionNumber / question.totalQuestions) * 100}%` }}
            />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {question.questionText}
        </h2>
      </div>

      <div className="space-y-3">
        {question.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelect(index)}
            disabled={hasAnswered || disabled}
            className={getAnswerButtonClass(index)}
          >
            <div className="flex items-center">
              <span className="mr-3 flex-shrink-0 w-6 h-6 rounded-full border-2 border-current flex items-center justify-center text-sm font-medium">
                {String.fromCharCode(65 + index)}
              </span>
              <span className="text-sm">{answer}</span>
            </div>
          </button>
        ))}
      </div>

      {hasAnswered && (
        <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {selectedAnswer === question.correctAnswerIndex ? (
              <span className="text-green-600 dark:text-green-400 font-medium">✓ Correct!</span>
            ) : (
              <span className="text-red-600 dark:text-red-400 font-medium">✗ Incorrect</span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}