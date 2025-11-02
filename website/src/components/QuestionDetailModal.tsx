import React, { useEffect } from 'react'
import { QuestionStatistics } from '@/types'
import type { PairedAnswers } from 'questionnaire'
import { PairedQuestionNumber } from 'questionnaire'
import { MASTERY_THRESHOLD, NEEDS_PRACTICE_THRESHOLD } from '@/services/StatisticsService'

interface QuestionDetailModalProps {
  question: QuestionStatistics
  pairedAnswers: PairedAnswers
  onClose: () => void
}

export default function QuestionDetailModal({
  question,
  pairedAnswers,
  onClose
}: QuestionDetailModalProps) {
  const history = pairedAnswers[PairedQuestionNumber(question.pairedQuestionNumber)] ?? []

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Determine mastery status
  const isMastered = (() => {
    if (history.length < MASTERY_THRESHOLD) {
      return false
    }
    const recentAnswers = history.slice(-MASTERY_THRESHOLD)
    return recentAnswers.every((answer) => answer.correct === true)
  })()

  const getStatusBadge = () => {
    if (question.timesAsked === 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
          Never Asked
        </span>
      )
    } else if (isMastered === true) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          ✅ Mastered
        </span>
      )
    } else if (question.accuracy < NEEDS_PRACTICE_THRESHOLD) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          Needs Practice
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          In Progress
        </span>
      )
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getRecentPerformance = () => {
    if (history.length === 0) return []
    const recent = history.slice(-5).reverse()
    return recent
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-start">
          <div className="flex-1 pr-4">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Question {question.questionNumber}
              </h2>
              {getStatusBadge()}
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Paired ID: {question.pairedQuestionNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Question and Answer */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Question
            </h3>
            <p className="text-gray-900 dark:text-white text-lg">{question.questionText}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Correct Answer
            </h3>
            <p className="text-green-700 dark:text-green-300 font-medium">
              {question.correctAnswerText}
            </p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Times Asked</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {question.timesAsked}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Correct</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {question.timesCorrect}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Accuracy</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {question.timesAsked > 0 ? `${Math.round(question.accuracy * 100)}%` : '-'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Next Time %</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {question.selectionProbability.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Recent Performance */}
          {history.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Recent Performance (Last 5)
              </h3>
              <div className="flex space-x-2">
                {getRecentPerformance().map((answer, index) => (
                  <div
                    key={index}
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      answer.correct === true
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                        : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                    }`}
                  >
                    {answer.correct === true ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Full History */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              Complete History
            </h3>
            {history.length > 0 ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {[...history].reverse().map((answer, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {history.length - index}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(answer.ts)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                          {answer.correct === true ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              ✅ Correct
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              ❌ Incorrect
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No attempts yet. This question has never been asked.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
