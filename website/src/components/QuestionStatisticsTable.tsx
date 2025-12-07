import React from 'react'
import { QuestionStatistics, QuestionSortField } from '@/types'
import { YStack, Text } from '@/components/tamagui'
import { styled } from 'tamagui'

interface QuestionStatisticsTableProps {
  statistics: ReadonlyArray<QuestionStatistics>
  sortField: QuestionSortField
  sortAscending: boolean
  onSort: (field: QuestionSortField) => void
  onQuestionClick: (stat: QuestionStatistics) => void
}

const EmptyContainer = styled(YStack, {
  paddingVertical: '$6',
  alignItems: 'center',
})

const EmptyText = styled(Text, {
  color: '#6b7280', // gray-500
  fontSize: '$3',
})

// Table styles
const tableStyles: React.CSSProperties = {
  minWidth: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
}

const theadStyles: React.CSSProperties = {
  backgroundColor: '#f9fafb', // gray-50
}

const thStyles: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 500,
  color: '#374151', // gray-700
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid #e5e7eb', // gray-200
}

const thSortableStyles: React.CSSProperties = {
  ...thStyles,
  cursor: 'pointer',
}

const tbodyStyles: React.CSSProperties = {
  backgroundColor: 'white',
}

const trStyles: React.CSSProperties = {
  cursor: 'pointer',
  transition: 'background-color 150ms',
}

const tdStyles: React.CSSProperties = {
  padding: '16px',
  fontSize: 14,
  color: '#1f2937', // gray-900
  borderBottom: '1px solid #e5e7eb', // gray-200
}

const tdNumberStyles: React.CSSProperties = {
  ...tdStyles,
  whiteSpace: 'nowrap',
  fontWeight: 500,
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
        <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.3 }}>
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
        <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 0.8) return '#16a34a' // green-600
    if (accuracy >= 0.6) return '#2563eb' // blue-600
    if (accuracy > 0) return '#ea580c' // orange-600
    return '#6b7280' // gray-500
  }

  const getProbabilityColor = (probability: number): string => {
    if (probability >= 8) return '#dc2626' // red-600
    if (probability >= 5) return '#ea580c' // orange-600
    if (probability >= 2) return '#2563eb' // blue-600
    return '#4b5563' // gray-600
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
      <EmptyContainer>
        <EmptyText>No questions match your current filters.</EmptyText>
      </EmptyContainer>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyles}>
        <thead style={theadStyles}>
          <tr>
            <th
              style={thSortableStyles}
              onClick={() => onSort(QuestionSortField.QuestionNumber)}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6' }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Question #</span>
                {getSortIcon(QuestionSortField.QuestionNumber)}
              </div>
            </th>

            <th style={thStyles}>
              Question
            </th>

            <th
              style={thSortableStyles}
              onClick={() => onSort(QuestionSortField.TimesAsked)}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6' }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Asked</span>
                {getSortIcon(QuestionSortField.TimesAsked)}
              </div>
            </th>

            <th style={thStyles}>
              Correct
            </th>

            <th
              style={thSortableStyles}
              onClick={() => onSort(QuestionSortField.Accuracy)}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6' }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Accuracy</span>
                {getSortIcon(QuestionSortField.Accuracy)}
              </div>
            </th>

            <th
              style={thSortableStyles}
              onClick={() => onSort(QuestionSortField.Probability)}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f3f4f6' }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Next Time %</span>
                {getSortIcon(QuestionSortField.Probability)}
              </div>
            </th>
          </tr>
        </thead>
        <tbody style={tbodyStyles}>
          {statistics.map((stat) => (
            <tr
              key={stat.pairedQuestionNumber}
              onClick={() => onQuestionClick(stat)}
              style={trStyles}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f9fafb' }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <td style={tdNumberStyles}>
                {stat.questionNumber}
              </td>

              <td style={tdStyles}>
                <div style={{ maxWidth: 448 }}>
                  <div style={{ fontWeight: 500 }}>{truncateText(stat.questionText, 80)}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
                    Answer: {truncateText(stat.correctAnswerText, 60)}
                  </div>
                </div>
              </td>

              <td style={{ ...tdStyles, whiteSpace: 'nowrap' }}>
                {stat.timesAsked > 0 ? stat.timesAsked : '-'}
              </td>

              <td style={{ ...tdStyles, whiteSpace: 'nowrap' }}>
                {stat.timesCorrect > 0 ? stat.timesCorrect : '-'}
              </td>

              <td style={{ ...tdStyles, whiteSpace: 'nowrap', fontWeight: 500 }}>
                {stat.timesAsked > 0 ? (
                  <span style={{ color: getAccuracyColor(stat.accuracy) }}>
                    {formatAccuracy(stat.accuracy)}
                  </span>
                ) : (
                  <span style={{ color: '#6b7280' }}>-</span>
                )}
              </td>

              <td style={{ ...tdStyles, whiteSpace: 'nowrap', fontWeight: 500 }}>
                <span style={{ color: getProbabilityColor(stat.selectionProbability) }}>
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
