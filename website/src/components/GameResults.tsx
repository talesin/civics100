import React from 'react'
import { GameResult } from '@/types'
import { Card, XStack, YStack, Text, Button } from '@/components/tamagui'
import { styled } from 'tamagui'

interface GameResultsProps {
  result: GameResult
  onPlayAgain: () => void
  onViewHistory: () => void
}

const ResultCard = styled(Card, {
  padding: '$6',
  alignItems: 'center',
})

const IconCircle = styled(YStack, {
  width: 80,
  height: 80,
  borderRadius: 40,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '$4',

  variants: {
    variant: {
      success: {
        backgroundColor: '#dcfce7', // green-100
      },
      failure: {
        backgroundColor: '#fee2e2', // red-100
      },
    },
  } as const,
})

const Title = styled(Text, {
  fontSize: '$7',
  fontWeight: 'bold',
  color: '$color',
  marginBottom: '$2',
})

const ResultMessage = styled(Text, {
  fontSize: '$5',
  fontWeight: '500',
})

const StatCardsContainer = styled(XStack, {
  gap: '$4',
  marginBottom: '$6',
  width: '100%',
  justifyContent: 'center',
})

const StatCard = styled(YStack, {
  backgroundColor: '#f9fafb', // gray-50
  borderRadius: '$3',
  padding: '$4',
  alignItems: 'center',
  flex: 1,
  maxWidth: 160,
})

const StatValue = styled(Text, {
  fontSize: '$8',
  fontWeight: 'bold',
})

const StatLabel = styled(Text, {
  fontSize: '$2',
  color: '#4b5563', // gray-600
  marginTop: '$1',
})

const ProgressContainer = styled(YStack, {
  width: '100%',
  marginBottom: '$4',
})

const ProgressTrack = styled(YStack, {
  backgroundColor: '#e5e7eb', // gray-200
  borderRadius: 6,
  height: 12,
  width: '100%',
  marginBottom: '$2',
  overflow: 'hidden',
})

const ProgressBar = styled(YStack, {
  height: 12,
  borderRadius: 6,

  variants: {
    variant: {
      success: {
        backgroundColor: '#22c55e', // green-500
      },
      failure: {
        backgroundColor: '#ef4444', // red-500
      },
    },
  } as const,
})

const ProgressText = styled(Text, {
  fontSize: '$2',
  color: '#4b5563', // gray-600
  textAlign: 'center',
})

const AchievementBanner = styled(XStack, {
  backgroundColor: '#fefce8', // yellow-50
  borderWidth: 1,
  borderColor: '#fde68a', // yellow-200
  borderRadius: '$3',
  padding: '$4',
  marginBottom: '$4',
  width: '100%',
})

const AchievementText = styled(Text, {
  fontSize: '$2',
  color: '#854d0e', // yellow-800
})

const ButtonContainer = styled(XStack, {
  gap: '$4',
  justifyContent: 'center',
})

const PrimaryButton = styled(Button, {
  backgroundColor: '#2563eb', // blue-600
  paddingVertical: '$3',
  paddingHorizontal: '$5',
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
  paddingVertical: '$3',
  paddingHorizontal: '$5',
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

const Footer = styled(YStack, {
  marginTop: '$4',
  paddingTop: '$4',
  borderTopWidth: 1,
  borderTopColor: '#e5e7eb', // gray-200
  width: '100%',
  alignItems: 'center',
})

const FooterText = styled(Text, {
  fontSize: '$1',
  color: '#6b7280', // gray-500
})

export default function GameResults({ result, onPlayAgain, onViewHistory }: GameResultsProps) {
  const getResultMessage = () => {
    if (result.isEarlyFail === true) {
      return '📚 Test ended - You answered 9 questions incorrectly. Keep studying and try again!'
    } else if (result.isEarlyWin === true) {
      return `🎉 Excellent! You passed with ${result.correctAnswers} correct answers!`
    } else if (result.percentage >= 60) {
      return '✅ Congratulations! You passed the civics test!'
    } else {
      return '📚 Keep studying! You need 60% to pass.'
    }
  }

  const getResultColor = (): string => {
    if (result.isEarlyFail === true) {
      return '#dc2626' // red-600
    } else if (result.isEarlyWin === true || result.percentage >= 60) {
      return '#16a34a' // green-600
    } else {
      return '#dc2626' // red-600
    }
  }

  const getScoreColor = (): string => {
    if (result.percentage >= 80) return '#16a34a' // green-600
    if (result.percentage >= 60) return '#2563eb' // blue-600
    return '#dc2626' // red-600
  }

  const isSuccess = result.isEarlyFail !== true && (result.isEarlyWin === true || result.percentage >= 60)

  return (
    <ResultCard elevated>
      <YStack marginBottom="$4" alignItems="center">
        {isSuccess ? (
          <IconCircle variant="success" data-testid="result-icon-success">
            <svg
              width={40}
              height={40}
              fill="none"
              stroke="#16a34a"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </IconCircle>
        ) : (
          <IconCircle variant="failure" data-testid="result-icon-failure">
            <svg
              width={40}
              height={40}
              fill="none"
              stroke="#dc2626"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </IconCircle>
        )}
        <Title>Game Complete!</Title>
        <ResultMessage color={getResultColor()}>
          {getResultMessage()}
        </ResultMessage>
      </YStack>

      <StatCardsContainer>
        <StatCard>
          <StatValue color={getScoreColor()}>{result.percentage}%</StatValue>
          <StatLabel>Final Score</StatLabel>
        </StatCard>

        <StatCard>
          <StatValue color="$color">
            {result.correctAnswers}/{result.totalQuestions}
          </StatValue>
          <StatLabel>Correct Answers</StatLabel>
        </StatCard>
      </StatCardsContainer>

      <ProgressContainer>
        <ProgressTrack>
          <ProgressBar
            data-testid="progress-bar"
            variant={result.percentage >= 60 ? 'success' : 'failure'}
            width={`${Math.min(result.percentage, 100)}%`}
          />
        </ProgressTrack>
        <ProgressText>
          Passing score: 60% • You scored: {result.percentage}%
        </ProgressText>
      </ProgressContainer>

      {result.isEarlyWin === true ? (
        <AchievementBanner>
          <AchievementText>
            🌟 Early Win Achievement! You answered {result.correctAnswers} questions correctly and chose to finish early.
          </AchievementText>
        </AchievementBanner>
      ) : null}

      <ButtonContainer>
        <PrimaryButton onPress={onPlayAgain}>
          <ButtonText>Play Again</ButtonText>
        </PrimaryButton>
        <SecondaryButton onPress={onViewHistory}>
          <ButtonText>View History</ButtonText>
        </SecondaryButton>
      </ButtonContainer>

      <Footer>
        <FooterText>
          Session completed at {result.completedAt.toLocaleString()}
        </FooterText>
      </Footer>
    </ResultCard>
  )
}
