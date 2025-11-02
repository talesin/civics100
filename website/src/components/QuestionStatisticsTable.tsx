import React from 'react'
import { QuestionStatistics, QuestionSortField } from '@/types'

interface QuestionStatisticsTableProps {
  statistics: ReadonlyArray<QuestionStatistics>
  sortField: QuestionSortField
  sortAscending: boolean
  onSort: (field: QuestionSortField) => void
  onQuestionClick: (stat: QuestionStatistics) => void
}

export default function QuestionStatisticsTable({
  statistics,
  sortField,
  sortAscending,
  onSort,
  onQuestionClick
}: QuestionStatisticsTableProps) {
  const getSortIcon = (field: QuestionSortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )
    }

    if (sortAscending) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 15l7-7 7 7"
          />
        </svg>
      )
    }

    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return 'text-green-600 dark:text-green-400'
    if (accuracy >= 0.6) return 'text-blue-600 dark:text-blue-400'
    if (accuracy > 0) return 'text-orange-600 dark:text-orange-400'
    return 'text-gray-500 dark:text-gray-400'
  }

  const getProbabilityColor = (probability: number) => {
    if (probability >= 8) return 'text-red-600 dark:text-red-400'
    if (probability >= 5) return 'text-orange-600 dark:text-orange-400'
    if (probability >= 2) return 'text-blue-600 dark:text-blue-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const formatAccuracy = (accuracy: number) => {
    return `${Math.round(accuracy * 100)}%`
  }

  const formatProbability = (probability: number) => {
    return `${probability.toFixed(2)}%`
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (statistics.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>No questions match your current filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => onSort(QuestionSortField.QuestionNumber)}
            >
              <div className="flex items-center space-x-1">
                <span>Question #</span>
                {getSortIcon(QuestionSortField.QuestionNumber)}
              </div>
            </th>

            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Question
            </th>

            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => onSort(QuestionSortField.TimesAsked)}
            >
              <div className="flex items-center space-x-1">
                <span>Asked</span>
                {getSortIcon(QuestionSortField.TimesAsked)}
              </div>
            </th>

            <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Correct
            </th>

            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => onSort(QuestionSortField.Accuracy)}
            >
              <div className="flex items-center space-x-1">
                <span>Accuracy</span>
                {getSortIcon(QuestionSortField.Accuracy)}
              </div>
            </th>

            <th
              className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => onSort(QuestionSortField.Probability)}
            >
              <div className="flex items-center space-x-1">
                <span>Next Time %</span>
                {getSortIcon(QuestionSortField.Probability)}
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {statistics.map((stat) => (
            <tr
              key={stat.pairedQuestionNumber}
              onClick={() => onQuestionClick(stat)}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
            >
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {stat.questionNumber}
              </td>

              <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                <div className="max-w-md">
                  <div className="font-medium">{truncateText(stat.questionText, 80)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Answer: {truncateText(stat.correctAnswerText, 60)}
                  </div>
                </div>
              </td>

              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {stat.timesAsked > 0 ? stat.timesAsked : '-'}
              </td>

              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {stat.timesCorrect > 0 ? stat.timesCorrect : '-'}
              </td>

              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                {stat.timesAsked > 0 ? (
                  <span className={getAccuracyColor(stat.accuracy)}>
                    {formatAccuracy(stat.accuracy)}
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">-</span>
                )}
              </td>

              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <span className={getProbabilityColor(stat.selectionProbability)}>
                  {formatProbability(stat.selectionProbability)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
