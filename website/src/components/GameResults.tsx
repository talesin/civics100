import React from 'react'
import { GameResult } from '@/types'
import { Card, XStack, YStack, Text, Button } from '@/components/tamagui'
import { styled } from 'tamagui'
import { useThemeContext, themeColors } from '@/components/TamaguiProvider'

interface GameResultsProps {
  readonly result: GameResult
  readonly onPlayAgain: () => void
  readonly onViewHistory: () => void
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
        backgroundColor: '$green2',
      },
      failure: {
        backgroundColor: '$error1',
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
  backgroundColor: '$backgroundHover',
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
  color: '$placeholderColor',
  marginTop: '$1',
})

const ProgressContainer = styled(YStack, {
  width: '100%',
  marginBottom: '$4',
})

const ProgressTrack = styled(YStack, {
  backgroundColor: '$borderColor',
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
        backgroundColor: '$success',
      },
      failure: {
        backgroundColor: '$error',
      },
    },
  } as const,
})

const ProgressText = styled(Text, {
  fontSize: '$2',
  color: '$placeholderColor',
  textAlign: 'center',
})

const AchievementBanner = styled(XStack, {
  backgroundColor: '$warning1',
  borderWidth: 1,
  borderColor: '$warning2',
  borderRadius: '$3',
  padding: '$4',
  marginBottom: '$4',
  width: '100%',
})

const AchievementText = styled(Text, {
  fontSize: '$2',
  color: '$warning6',
})

const ButtonContainer = styled(XStack, {
  gap: '$4',
  justifyContent: 'center',
})

const PrimaryButton = styled(Button, {
  backgroundColor: '$primary',
  paddingVertical: '$3',
  paddingHorizontal: '$5',
  borderRadius: '$3',

  hoverStyle: {
    backgroundColor: '$primaryHover',
  },

  pressStyle: {
    opacity: 0.9,
  },
})

const SecondaryButton = styled(Button, {
  backgroundColor: '$backgroundPress',
  paddingVertical: '$3',
  paddingHorizontal: '$5',
  borderRadius: '$3',

  hoverStyle: {
    backgroundColor: '$backgroundHover',
  },

  pressStyle: {
    opacity: 0.9,
  },
})

const PrimaryButtonText = styled(Text, {
  color: 'white',
  fontWeight: '500',
})

const SecondaryButtonText = styled(Text, {
  color: '$color',
  fontWeight: '500',
})

const Footer = styled(YStack, {
  marginTop: '$4',
  paddingTop: '$4',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
  width: '100%',
  alignItems: 'center',
})

const FooterText = styled(Text, {
  fontSize: '$1',
  color: '$placeholderColor',
})

export default function GameResults({ result, onPlayAgain, onViewHistory }: GameResultsProps) {
  const { theme } = useThemeContext()
  const colors = themeColors[theme]

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
      return colors.error
    } else if (result.isEarlyWin === true || result.percentage >= 60) {
      return colors.success
    } else {
      return colors.error
    }
  }

  const getScoreColor = (): string => {
    if (result.percentage >= 80) return colors.success
    if (result.percentage >= 60) return colors.primary
    return colors.error
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
              stroke={colors.success}
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
              stroke={colors.error}
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
          <PrimaryButtonText>Play Again</PrimaryButtonText>
        </PrimaryButton>
        <SecondaryButton onPress={onViewHistory}>
          <SecondaryButtonText>View History</SecondaryButtonText>
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
