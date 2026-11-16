import { GameResult } from '../types'
import { Card, XStack, YStack, Text, Button } from './tamagui'
import { styled, useTheme } from 'tamagui'
import { CheckCircle, XCircle, Star } from './icons'

interface GameResultsProps {
  readonly result: GameResult
  readonly onPlayAgain: () => void
  readonly onViewHistory: () => void
}

const ResultCard = styled(Card, {
  padding: '$6',
  alignItems: 'center'
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
        backgroundColor: '$green2'
      },
      failure: {
        backgroundColor: '$error1'
      }
    }
  } as const
})

const Title = styled(Text, {
  fontSize: '$7',
  fontWeight: 'bold',
  color: '$color',
  marginBottom: '$2'
})

const ResultMessage = styled(Text, {
  fontSize: '$5',
  fontWeight: '500'
})

const StatCardsContainer = styled(XStack, {
  gap: '$4',
  marginBottom: '$6',
  width: '100%',
  justifyContent: 'center'
})

const StatCard = styled(YStack, {
  backgroundColor: '$backgroundHover',
  borderRadius: '$3',
  padding: '$4',
  alignItems: 'center',
  flex: 1,
  maxWidth: 160
})

const StatValue = styled(Text, {
  fontSize: '$8',
  fontWeight: 'bold'
})

const StatLabel = styled(Text, {
  fontSize: '$5',
  color: '$placeholderColor',
  marginTop: '$1'
})

const ProgressContainer = styled(YStack, {
  width: '100%',
  marginBottom: '$4'
})

const ProgressTrack = styled(YStack, {
  backgroundColor: '$borderColor',
  borderRadius: 6,
  height: 12,
  width: '100%',
  marginBottom: '$2',
  overflow: 'hidden'
})

const ProgressBar = styled(YStack, {
  height: 12,
  borderRadius: 6,

  variants: {
    variant: {
      success: {
        backgroundColor: '$success'
      },
      failure: {
        backgroundColor: '$error'
      }
    }
  } as const
})

const ProgressText = styled(Text, {
  fontSize: '$5',
  color: '$placeholderColor',
  textAlign: 'center'
})

const AchievementBanner = styled(XStack, {
  backgroundColor: '$warning1',
  borderWidth: 1,
  borderColor: '$warning2',
  borderRadius: '$3',
  padding: '$4',
  marginBottom: '$4',
  width: '100%',
  gap: '$2',
  alignItems: 'center'
})

const AchievementText = styled(Text, {
  fontSize: '$5',
  color: '$warning6',
  flex: 1
})

const ButtonContainer = styled(XStack, {
  gap: '$4',
  justifyContent: 'center'
})

const PrimaryButton = styled(Button, {
  backgroundColor: '$primary',
  paddingVertical: '$3',
  paddingHorizontal: '$5',
  borderRadius: '$3',

  hoverStyle: {
    backgroundColor: '$primaryHover'
  },

  pressStyle: {
    opacity: 0.9
  }
})

const SecondaryButton = styled(Button, {
  backgroundColor: '$backgroundPress',
  paddingVertical: '$3',
  paddingHorizontal: '$5',
  borderRadius: '$3',

  hoverStyle: {
    backgroundColor: '$backgroundHover'
  },

  pressStyle: {
    opacity: 0.9
  }
})

const PrimaryButtonText = styled(Text, {
  color: 'white',
  fontWeight: '500'
})

const SecondaryButtonText = styled(Text, {
  color: '$color',
  fontWeight: '500'
})

const Footer = styled(YStack, {
  marginTop: '$4',
  paddingTop: '$4',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
  width: '100%',
  alignItems: 'center'
})

const FooterText = styled(Text, {
  fontSize: '$5',
  color: '$placeholderColor'
})

export default function GameResults({ result, onPlayAgain, onViewHistory }: GameResultsProps) {
  const theme = useTheme()

  const getResultMessage = () => {
    if (result.isEarlyFail === true) {
      return 'Test ended — you answered 9 questions incorrectly. Keep studying and try again!'
    } else if (result.isEarlyWin === true) {
      return `Excellent! You passed with ${result.correctAnswers} correct answers!`
    } else if (result.percentage >= 60) {
      return 'Congratulations! You passed the civics test!'
    } else {
      return 'Keep studying! You need 60% to pass.'
    }
  }

  // Helpers return theme KEY names; Tamagui resolves them via the color prop.
  const getResultColor = (): '$themeSuccess' | '$themeError' => {
    if (result.isEarlyFail === true) {
      return '$themeError'
    } else if (result.isEarlyWin === true || result.percentage >= 60) {
      return '$themeSuccess'
    } else {
      return '$themeError'
    }
  }

  const getScoreColor = (): '$themeSuccess' | '$themePrimary' | '$themeError' => {
    if (result.percentage >= 80) return '$themeSuccess'
    if (result.percentage >= 60) return '$themePrimary'
    return '$themeError'
  }

  const isSuccess =
    result.isEarlyFail !== true && (result.isEarlyWin === true || result.percentage >= 60)

  return (
    <ResultCard elevated>
      <YStack marginBottom="$4" alignItems="center">
        {isSuccess ? (
          <IconCircle variant="success" data-testid="result-icon-success">
            <CheckCircle size={40} strokeWidth={1.5} color={theme.themeSuccess?.get() as string} />
          </IconCircle>
        ) : (
          <IconCircle variant="failure" data-testid="result-icon-failure">
            <XCircle size={40} strokeWidth={1.5} color={theme.themeError?.get() as string} />
          </IconCircle>
        )}
        <Title>Test Complete</Title>
        <ResultMessage color={getResultColor()}>{getResultMessage()}</ResultMessage>
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
        <ProgressText>Passing score: 60% • You scored: {result.percentage}%</ProgressText>
      </ProgressContainer>

      {result.isEarlyWin === true ? (
        <AchievementBanner>
          <Star size={16} strokeWidth={1.5} color={theme.warning?.get() as string} />
          <AchievementText>
            Early Win! You answered {result.correctAnswers} questions correctly and chose to finish
            early.
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
        <FooterText>Session completed at {result.completedAt.toLocaleString()}</FooterText>
      </Footer>
    </ResultCard>
  )
}
