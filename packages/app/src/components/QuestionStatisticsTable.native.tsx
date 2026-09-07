/**
 * Native stub half (Phase 5 user decision): a minimal question + accuracy
 * list stands in for the web <table> until Phase 6 builds the real native
 * list UX (sorting header, probability column, sticky header).
 */
import { styled } from 'tamagui'
import { XStack, YStack, Text } from './tamagui'
import { formatAccuracy, getAccuracyLevel, truncateText } from './QuestionStatisticsTable.shared'
import type { QuestionStatisticsTableProps } from './QuestionStatisticsTable.shared'

const EmptyContainer = styled(YStack, {
  paddingVertical: '$6',
  alignItems: 'center'
})

const EmptyText = styled(Text, {
  color: '$placeholderColor',
  fontSize: '$3'
})

const Row = styled(XStack, {
  alignItems: 'center',
  gap: '$3',
  paddingVertical: '$3',
  paddingHorizontal: '$4',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  backgroundColor: '$themeCardBg'
})

const QuestionNumber = styled(Text, {
  fontSize: 14,
  fontWeight: '500',
  color: '$editorialInk',
  minWidth: 32
})

const RowQuestionText = styled(Text, {
  fontSize: 14,
  fontWeight: '500',
  color: '$editorialInk'
})

const RowAnswerText = styled(Text, {
  fontSize: 12,
  color: '$editorialMuted',
  marginTop: 4
})

// Same variant keys as the web half's port of the .accuracy-* utilities.
const AccuracyText = styled(Text, {
  fontSize: 14,
  fontWeight: '500',

  variants: {
    level: {
      high: { color: '$themeSuccess' },
      mid: { color: '$themePrimary' },
      low: { color: '$themeWarning' },
      none: { color: '$editorialMuted' }
    }
  } as const
})

const QuestionStatisticsTable = ({ statistics, onQuestionClick }: QuestionStatisticsTableProps) => {
  if (statistics.length === 0) {
    return (
      <EmptyContainer>
        <EmptyText>No questions match your current filters.</EmptyText>
      </EmptyContainer>
    )
  }

  return (
    <YStack aria-label="Question statistics">
      {statistics.map((stat) => (
        <Row key={stat.pairedQuestionNumber} onPress={() => onQuestionClick(stat)}>
          <QuestionNumber>{stat.questionNumber}</QuestionNumber>
          <YStack flex={1}>
            <RowQuestionText>{truncateText(stat.questionText, 80)}</RowQuestionText>
            <RowAnswerText>Answer: {truncateText(stat.correctAnswerText, 60)}</RowAnswerText>
          </YStack>
          {stat.timesAsked > 0 ? (
            <AccuracyText level={getAccuracyLevel(stat.accuracy, stat.timesAsked)}>
              {formatAccuracy(stat.accuracy)}
            </AccuracyText>
          ) : (
            <AccuracyText level="none">-</AccuracyText>
          )}
        </Row>
      ))}
    </YStack>
  )
}

export default QuestionStatisticsTable
