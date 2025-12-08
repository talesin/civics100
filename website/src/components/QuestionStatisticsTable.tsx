import React, { useMemo } from 'react'
import { QuestionStatistics, QuestionSortField } from '@/types'
import { YStack, Text } from '@/components/tamagui'
import { styled } from 'tamagui'
import { useThemeContext } from '@/components/TamaguiProvider'

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
  color: '$placeholderColor',
  fontSize: '$3',
})

// Base table styles (non-theme-dependent)
const tableStyles: React.CSSProperties = {
  minWidth: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
}

const trStyles: React.CSSProperties = {
  cursor: 'pointer',
  transition: 'background-color 150ms',
}

// Theme-aware style generators
const getTheadStyles = (isDark: boolean): React.CSSProperties => ({
  backgroundColor: isDark ? '#262626' : '#f9fafb',
})

const getThStyles = (isDark: boolean): React.CSSProperties => ({
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 500,
  color: isDark ? '#d1d5db' : '#374151',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: `1px solid ${isDark ? '#404040' : '#e5e7eb'}`,
})

const getThSortableStyles = (isDark: boolean): React.CSSProperties => ({
  ...getThStyles(isDark),
  cursor: 'pointer',
})

const getTbodyStyles = (isDark: boolean): React.CSSProperties => ({
  backgroundColor: isDark ? '#1a1a1a' : 'white',
})

const getTdStyles = (isDark: boolean): React.CSSProperties => ({
  padding: '16px',
  fontSize: 14,
  color: isDark ? '#e5e5e5' : '#1f2937',
  borderBottom: `1px solid ${isDark ? '#404040' : '#e5e7eb'}`,
})

const getTdNumberStyles = (isDark: boolean): React.CSSProperties => ({
  ...getTdStyles(isDark),
  whiteSpace: 'nowrap',
  fontWeight: 500,
})

const getHoverColors = (isDark: boolean) => ({
  thHover: isDark ? '#333333' : '#f3f4f6',
  rowHover: isDark ? '#262626' : '#f9fafb',
})

const getAccuracyColors = (isDark: boolean) => ({
  high: isDark ? '#4ade80' : '#16a34a',    // green
  medium: isDark ? '#60a5fa' : '#2563eb',   // blue
  low: isDark ? '#fb923c' : '#ea580c',      // orange
  none: isDark ? '#a1a1aa' : '#6b7280',     // gray
})

const getProbabilityColors = (isDark: boolean) => ({
  veryHigh: isDark ? '#f87171' : '#dc2626', // red
  high: isDark ? '#fb923c' : '#ea580c',     // orange
  medium: isDark ? '#60a5fa' : '#2563eb',   // blue
  low: isDark ? '#9ca3af' : '#4b5563',      // gray
})

const getMutedColor = (isDark: boolean): string => isDark ? '#a1a1aa' : '#6b7280'

export default function QuestionStatisticsTable({
  statistics,
  sortField,
  sortAscending,
  onSort,
  onQuestionClick
}: QuestionStatisticsTableProps) {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  // Memoize theme-aware styles
  const theadStyles = useMemo(() => getTheadStyles(isDark), [isDark])
  const thStyles = useMemo(() => getThStyles(isDark), [isDark])
  const thSortableStyles = useMemo(() => getThSortableStyles(isDark), [isDark])
  const tbodyStyles = useMemo(() => getTbodyStyles(isDark), [isDark])
  const tdStyles = useMemo(() => getTdStyles(isDark), [isDark])
  const tdNumberStyles = useMemo(() => getTdNumberStyles(isDark), [isDark])
  const hoverColors = useMemo(() => getHoverColors(isDark), [isDark])
  const accuracyColors = useMemo(() => getAccuracyColors(isDark), [isDark])
  const probabilityColors = useMemo(() => getProbabilityColors(isDark), [isDark])
  const mutedColor = useMemo(() => getMutedColor(isDark), [isDark])

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
    if (accuracy >= 0.8) return accuracyColors.high
    if (accuracy >= 0.6) return accuracyColors.medium
    if (accuracy > 0) return accuracyColors.low
    return accuracyColors.none
  }

  const getProbabilityColor = (probability: number): string => {
    if (probability >= 8) return probabilityColors.veryHigh
    if (probability >= 5) return probabilityColors.high
    if (probability >= 2) return probabilityColors.medium
    return probabilityColors.low
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
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = hoverColors.thHover }}
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
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = hoverColors.thHover }}
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
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = hoverColors.thHover }}
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
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = hoverColors.thHover }}
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
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = hoverColors.rowHover }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <td style={tdNumberStyles}>
                {stat.questionNumber}
              </td>

              <td style={tdStyles}>
                <div style={{ maxWidth: 448 }}>
                  <div style={{ fontWeight: 500 }}>{truncateText(stat.questionText, 80)}</div>
                  <div style={{ fontSize: 12, color: mutedColor, marginTop: 4 }}>
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
                  <span style={{ color: mutedColor }}>-</span>
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
