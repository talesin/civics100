import React from 'react'
import { GameSession } from '@/types'
import { Card, XStack, YStack, Text, Button } from '@/components/tamagui'
import { styled } from 'tamagui'

interface GameControlsProps {
  session: GameSession
  onNext?: (() => void) | undefined
  onRestart?: (() => void) | undefined
  showNext: boolean
  showRestart: boolean
}

const PrimaryButton = styled(Button, {
  flex: 1,
  backgroundColor: '#2563eb', // blue-600
  paddingVertical: '$2',
  paddingHorizontal: '$4',
  borderRadius: '$3',

  hoverStyle: {
    backgroundColor: '#1d4ed8', // blue-700
  },

  pressStyle: {
    opacity: 0.9,
  },
})

const SecondaryButton = styled(Button, {
  backgroundColor: '#4b5563', // gray-600
  paddingVertical: '$2',
  paddingHorizontal: '$4',
  borderRadius: '$3',

  hoverStyle: {
    backgroundColor: '#374151', // gray-700
  },

  pressStyle: {
    opacity: 0.9,
  },
})

const ButtonText = styled(Text, {
  color: 'white',
  fontWeight: '500',
})

const SuccessMessage = styled(YStack, {
  marginTop: '$4',
  padding: '$3',
  backgroundColor: '#f0fdf4', // green-50
  borderWidth: 1,
  borderColor: '#bbf7d0', // green-200
  borderRadius: '$3',
})

const SuccessText = styled(Text, {
  color: '#166534', // green-800
  fontSize: '$3',
  fontWeight: '500',
})

export default function GameControls({
  session,
  onNext,
  onRestart,
  showNext = false,
  showRestart = false
}: GameControlsProps) {
  return (
    <Card elevated padding="$6">
      <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
        <Text fontSize="$3" color="$color" opacity={0.8}>
          <Text fontWeight="500">Progress:</Text> {session.totalAnswered} answered
        </Text>
        <Text fontSize="$3" color="$color" opacity={0.8}>
          <Text fontWeight="500">Correct:</Text> {session.correctAnswers}
        </Text>
      </XStack>

      <XStack gap="$3">
        {showNext === true && onNext !== undefined ? (
          <PrimaryButton onPress={onNext}>
            <ButtonText>
              {session.currentQuestionIndex >= session.questions.length - 1
                ? 'Finish'
                : 'Next Question'}
            </ButtonText>
          </PrimaryButton>
        ) : null}

        {showRestart === true && onRestart !== undefined ? (
          <SecondaryButton onPress={onRestart}>
            <ButtonText>Restart Game</ButtonText>
          </SecondaryButton>
        ) : null}
      </XStack>

      {session.correctAnswers >= session.settings.winThreshold && session.isCompleted === false ? (
        <SuccessMessage>
          <SuccessText>
            🎉 You&apos;ve reached {session.settings.winThreshold} correct answers! You can continue or finish now.
          </SuccessText>
        </SuccessMessage>
      ) : null}
    </Card>
  )
}
