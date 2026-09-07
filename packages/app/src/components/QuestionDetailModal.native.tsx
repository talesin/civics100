/**
 * Native stub half (Phase 5 user decision): a plain Tamagui modal showing the
 * question, its answer, and the core stats. The web half's focus trap, body
 * scroll lock, and history <table> are web-only; Phase 6 builds the real
 * native modal UX (history list, badges, recent-performance row).
 */
import { PairedQuestionNumber } from 'questionnaire'
import { styled } from 'tamagui'
import { XStack, YStack, Text, Button } from './tamagui'
import { X } from './icons'
import type { QuestionDetailModalProps } from './QuestionDetailModal.shared'

const Overlay = styled(YStack, {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 50
})

const ModalCard = styled(YStack, {
  backgroundColor: '$editorialPaper',
  borderRadius: 16,
  width: '100%',
  maxWidth: 768,
  padding: '$5',
  gap: '$5'
})

const HeaderTitle = styled(Text, {
  fontSize: '$6',
  fontWeight: '600',
  color: '$color'
})

const SectionLabel = styled(Text, {
  fontSize: '$2',
  fontWeight: '500',
  color: '$placeholderColor',
  marginBottom: '$2'
})

const QuestionText = styled(Text, {
  fontSize: '$5',
  color: '$color'
})

const AnswerText = styled(Text, {
  color: '$success',
  fontWeight: '500'
})

const StatsGrid = styled(XStack, {
  backgroundColor: '$backgroundHover',
  borderRadius: '$3',
  padding: '$4',
  flexWrap: 'wrap',
  gap: '$4'
})

const StatItem = styled(YStack, {
  minWidth: 80,
  flex: 1
})

const StatLabel = styled(Text, {
  fontSize: '$1',
  color: '$placeholderColor',
  marginBottom: '$1'
})

const StatValue = styled(Text, {
  fontSize: '$7',
  fontWeight: 'bold'
})

const CloseIconButton = styled(XStack, {
  padding: 4,
  borderRadius: 4,
  backgroundColor: 'transparent'
})

const PrimaryButton = styled(Button, {
  backgroundColor: '$primary',
  paddingVertical: '$2',
  paddingHorizontal: '$4',
  borderRadius: '$3'
})

const ButtonText = styled(Text, {
  color: 'white',
  fontWeight: '500'
})

const QuestionDetailModal = ({ question, pairedAnswers, onClose }: QuestionDetailModalProps) => {
  const history = pairedAnswers[PairedQuestionNumber(question.pairedQuestionNumber)] ?? []

  return (
    <Overlay onPress={onClose}>
      <ModalCard onPress={(e) => e.stopPropagation()}>
        <XStack justifyContent="space-between" alignItems="flex-start">
          <HeaderTitle>Question {question.questionNumber}</HeaderTitle>
          <CloseIconButton onPress={onClose} aria-label="Close modal">
            <X size={24} color="$editorialInk" />
          </CloseIconButton>
        </XStack>

        <YStack>
          <SectionLabel>Question</SectionLabel>
          <QuestionText>{question.questionText}</QuestionText>
        </YStack>

        <YStack>
          <SectionLabel>Correct Answer</SectionLabel>
          <AnswerText>{question.correctAnswerText}</AnswerText>
        </YStack>

        <StatsGrid>
          <StatItem>
            <StatLabel>Times Asked</StatLabel>
            <StatValue color="$editorialInk">{question.timesAsked}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Correct</StatLabel>
            <StatValue color="$themeSuccess">{question.timesCorrect}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Accuracy</StatLabel>
            <StatValue color="$themePrimary">
              {question.timesAsked > 0 ? `${Math.round(question.accuracy * 100)}%` : '-'}
            </StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Attempts</StatLabel>
            <StatValue color="$themePurple">{history.length}</StatValue>
          </StatItem>
        </StatsGrid>

        <XStack justifyContent="flex-end">
          <PrimaryButton onPress={onClose}>
            <ButtonText>Close</ButtonText>
          </PrimaryButton>
        </XStack>
      </ModalCard>
    </Overlay>
  )
}

export default QuestionDetailModal
