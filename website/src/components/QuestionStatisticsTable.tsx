import React, { useCallback } from 'react'
import { QuestionStatistics, QuestionSortField } from '@/types'
import { YStack, Text } from '@/components/tamagui'
import { styled } from 'tamagui'

interface QuestionStatisticsTableProps {
  readonly statistics: ReadonlyArray<QuestionStatistics>
  readonly sortField: QuestionSortField
  readonly sortAscending: boolean
  readonly onSort: (field: QuestionSortField) => void
  readonly onQuestionClick: (stat: QuestionStatistics) => void
}

const EmptyContainer = styled(YStack, {
  paddingVertical: '$6',
  alignItems: 'center',
})

const EmptyText = styled(Text, {
  color: '$placeholderColor',
  fontSize: '$3',
})

const tableStyles: React.CSSProperties = {
  minWidth: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
}

const theadStyles: React.CSSProperties = {
  backgroundColor: 'var(--theme-background-hover)',
}

const thBaseStyles: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--editorial-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1px solid var(--editorial-rule)',
}

const thSortableStyles: React.CSSProperties = {
  ...thBaseStyles,
  cursor: 'pointer',
}

const tbodyStyles: React.CSSProperties = {
  backgroundColor: 'var(--theme-card-bg)',
}

const tdBaseStyles: React.CSSProperties = {
  padding: '16px',
  fontSize: 14,
  color: 'var(--editorial-ink)',
  borderBottom: '1px solid var(--editorial-rule)',
}

const tdNumberStyles: React.CSSProperties = {
  ...tdBaseStyles,
  whiteSpace: 'nowrap',
  fontWeight: 500,
}

const trStyles: React.CSSProperties = {
  cursor: 'pointer',
  transition: 'background-color 150ms',
}

const getAccuracyClass = (accuracy: number, timesAsked: number): string => {
  if (timesAsked === 0) return 'accuracy-none'
  if (accuracy >= 0.8) return 'accuracy-high'
  if (accuracy >= 0.6) return 'accuracy-mid'
  return 'accuracy-low'
}

const getProbabilityClass = (probability: number): string => {
  if (probability >= 8) return 'prob-very-high'
  if (probability >= 5) return 'prob-high'
  if (probability >= 2) return 'prob-mid'
  return 'prob-low'
}

const formatAccuracy = (accuracy: number) => `${Math.round(accuracy * 100)}%`
const formatProbability = (probability: number) => `${probability.toFixed(2)}%`

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const QuestionStatisticsTable = ({
  statistics,
  sortField,
  sortAscending,
  onSort,
  onQuestionClick
}: QuestionStatisticsTableProps): React.ReactElement | null => {
  const handleSortKeyDown = useCallback((field: QuestionSortField) => (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSort(field)
    }
  }, [onSort])

  const getSortIcon = (field: QuestionSortField) => {
    if (sortField !== field) {
      return (
        <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: 0.3 }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }

    if (sortAscending) {
      return (
        <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      )
    }

    return (
      <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
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
      <style>{`
        .stat-th-sortable:hover { background-color: var(--editorial-accent-subtle); }
        .stat-row-hover:hover { background-color: var(--theme-background-hover); }
      `}</style>
      <table style={tableStyles} aria-label="Question statistics">
        <thead style={theadStyles}>
          <tr>
            <th
              scope="col"
              style={thSortableStyles}
              onClick={() => onSort(QuestionSortField.QuestionNumber)}
              onKeyDown={handleSortKeyDown(QuestionSortField.QuestionNumber)}
              tabIndex={0}
              role="columnheader"
              aria-sort={sortField === QuestionSortField.QuestionNumber ? (sortAscending ? 'ascending' : 'descending') : 'none'}
              className="stat-th-sortable"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Question #</span>
                {getSortIcon(QuestionSortField.QuestionNumber)}
              </div>
            </th>

            <th scope="col" style={thBaseStyles}>Question</th>

            <th
              scope="col"
              style={thSortableStyles}
              onClick={() => onSort(QuestionSortField.TimesAsked)}
              onKeyDown={handleSortKeyDown(QuestionSortField.TimesAsked)}
              tabIndex={0}
              role="columnheader"
              aria-sort={sortField === QuestionSortField.TimesAsked ? (sortAscending ? 'ascending' : 'descending') : 'none'}
              className="stat-th-sortable"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Asked</span>
                {getSortIcon(QuestionSortField.TimesAsked)}
              </div>
            </th>

            <th scope="col" style={thBaseStyles}>Correct</th>

            <th
              scope="col"
              style={thSortableStyles}
              onClick={() => onSort(QuestionSortField.Accuracy)}
              onKeyDown={handleSortKeyDown(QuestionSortField.Accuracy)}
              tabIndex={0}
              role="columnheader"
              aria-sort={sortField === QuestionSortField.Accuracy ? (sortAscending ? 'ascending' : 'descending') : 'none'}
              className="stat-th-sortable"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>Accuracy</span>
                {getSortIcon(QuestionSortField.Accuracy)}
              </div>
            </th>

            <th
              scope="col"
              style={thSortableStyles}
              onClick={() => onSort(QuestionSortField.Probability)}
              onKeyDown={handleSortKeyDown(QuestionSortField.Probability)}
              tabIndex={0}
              role="columnheader"
              aria-sort={sortField === QuestionSortField.Probability ? (sortAscending ? 'ascending' : 'descending') : 'none'}
              className="stat-th-sortable"
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onQuestionClick(stat)
                }
              }}
              style={trStyles}
              tabIndex={0}
              className="stat-row-hover"
            >
              <th scope="row" style={tdNumberStyles}>
                {stat.questionNumber}
              </th>

              <td style={tdBaseStyles}>
                <div style={{ maxWidth: 448 }}>
                  <div style={{ fontWeight: 500 }}>{truncateText(stat.questionText, 80)}</div>
                  <div style={{ fontSize: 12, color: 'var(--editorial-muted)', marginTop: 4 }}>
                    Answer: {truncateText(stat.correctAnswerText, 60)}
                  </div>
                </div>
              </td>

              <td style={{ ...tdBaseStyles, whiteSpace: 'nowrap' }}>
                {stat.timesAsked > 0 ? stat.timesAsked : '-'}
              </td>

              <td style={{ ...tdBaseStyles, whiteSpace: 'nowrap' }}>
                {stat.timesCorrect > 0 ? stat.timesCorrect : '-'}
              </td>

              <td style={{ ...tdBaseStyles, whiteSpace: 'nowrap', fontWeight: 500 }}>
                {stat.timesAsked > 0 ? (
                  <span className={getAccuracyClass(stat.accuracy, stat.timesAsked)}>
                    {formatAccuracy(stat.accuracy)}
                  </span>
                ) : (
                  <span className="accuracy-none">-</span>
                )}
              </td>

              <td style={{ ...tdBaseStyles, whiteSpace: 'nowrap', fontWeight: 500 }}>
                <span className={getProbabilityClass(stat.selectionProbability)}>
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

export default QuestionStatisticsTable
