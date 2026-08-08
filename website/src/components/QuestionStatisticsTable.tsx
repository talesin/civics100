import React, { useCallback } from 'react'
import { QuestionStatistics, QuestionSortField } from '@/types'
import { YStack, Text } from '@/components/tamagui'
import { styled, useTheme } from 'tamagui'

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

const trStyles: React.CSSProperties = {
  cursor: 'pointer',
  transition: 'background-color 150ms',
}

// Ports of the .accuracy-* / .prob-* color utilities. fontSize/fontWeight are
// set explicitly to the values the spans used to inherit from their <td>.
const AccuracyText = styled(Text, {
  tag: 'span',
  fontSize: 14,
  fontWeight: '500',

  variants: {
    level: {
      high: { color: '$themeSuccess' },
      mid: { color: '$themePrimary' },
      low: { color: '$themeWarning' },
      none: { color: '$editorialMuted' },
    },
  } as const,
})

const ProbabilityText = styled(Text, {
  tag: 'span',
  fontSize: 14,
  fontWeight: '500',

  variants: {
    level: {
      veryHigh: { color: '$themeError' },
      high: { color: '$themeWarning' },
      mid: { color: '$themePrimary' },
      low: { color: '$editorialMuted' },
    },
  } as const,
})

type AccuracyLevel = 'high' | 'mid' | 'low' | 'none'
type ProbabilityLevel = 'veryHigh' | 'high' | 'mid' | 'low'

const getAccuracyLevel = (accuracy: number, timesAsked: number): AccuracyLevel => {
  if (timesAsked === 0) return 'none'
  if (accuracy >= 0.8) return 'high'
  if (accuracy >= 0.6) return 'mid'
  return 'low'
}

const getProbabilityLevel = (probability: number): ProbabilityLevel => {
  if (probability >= 8) return 'veryHigh'
  if (probability >= 5) return 'high'
  if (probability >= 2) return 'mid'
  return 'low'
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
  const theme = useTheme()

  // Theme-aware styles for the native <table> skeleton (real table semantics
  // can't be expressed with Tamagui stacks); .get() emits CSS variable refs.
  const theadStyles: React.CSSProperties = {
    backgroundColor: theme.backgroundHover?.get() as string,
  }

  const thBaseStyles: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 500,
    color: theme.editorialMuted?.get() as string,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: `1px solid ${theme.editorialRule?.get() as string}`,
  }

  const thSortableStyles: React.CSSProperties = {
    ...thBaseStyles,
    cursor: 'pointer',
  }

  const tbodyStyles: React.CSSProperties = {
    backgroundColor: theme.themeCardBg?.get() as string,
  }

  const tdBaseStyles: React.CSSProperties = {
    padding: '16px',
    fontSize: 14,
    color: theme.editorialInk?.get() as string,
    borderBottom: `1px solid ${theme.editorialRule?.get() as string}`,
  }

  const tdNumberStyles: React.CSSProperties = {
    ...tdBaseStyles,
    whiteSpace: 'nowrap',
    fontWeight: 500,
  }

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
      {/* Hover styles for native th/tr (no Tamagui hoverStyle on table
          elements); colors resolve through the Tamagui theme variables. */}
      <style>{`
        .stat-th-sortable:hover { background-color: ${theme.editorialAccentSubtle?.get() as string}; }
        .stat-row-hover:hover { background-color: ${theme.backgroundHover?.get() as string}; }
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
                  <div style={{ fontSize: 12, color: theme.editorialMuted?.get() as string, marginTop: 4 }}>
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
                  <AccuracyText level={getAccuracyLevel(stat.accuracy, stat.timesAsked)}>
                    {formatAccuracy(stat.accuracy)}
                  </AccuracyText>
                ) : (
                  <AccuracyText level="none">-</AccuracyText>
                )}
              </td>

              <td style={{ ...tdBaseStyles, whiteSpace: 'nowrap', fontWeight: 500 }}>
                <ProbabilityText level={getProbabilityLevel(stat.selectionProbability)}>
                  {formatProbability(stat.selectionProbability)}
                </ProbabilityText>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default QuestionStatisticsTable
