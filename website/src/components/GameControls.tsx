import React from 'react'
import { GameSession } from '@/types'

interface GameControlsProps {
  session: GameSession
  onNext?: () => void
  onRestart?: () => void
  showNext?: boolean
  showRestart?: boolean
}

export default function GameControls({ 
  session, 
  onNext, 
  onRestart, 
  showNext = false, 
  showRestart = false 
}: GameControlsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Progress:</span> {session.totalAnswered} answered
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Correct:</span> {session.correctAnswers}
        </div>
      </div>

      <div className="flex space-x-3">
        {showNext && onNext && (
          <button
            onClick={onNext}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {session.currentQuestionIndex >= session.questions.length - 1 ? 'Finish' : 'Next Question'}
          </button>
        )}
        
        {showRestart && onRestart && (
          <button
            onClick={onRestart}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Restart Game
          </button>
        )}
      </div>

      {session.correctAnswers >= 6 && !session.isCompleted && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-green-800 dark:text-green-200 text-sm font-medium">
            🎉 You&apos;ve reached 6 correct answers! You can continue or finish now.
          </p>
        </div>
      )}
    </div>
  )
}