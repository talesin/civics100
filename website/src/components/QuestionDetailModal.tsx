import React, { useEffect, useMemo } from 'react'
import { QuestionStatistics } from '@/types'
import type { PairedAnswers } from 'questionnaire'
import { PairedQuestionNumber } from 'questionnaire'
import { MASTERY_THRESHOLD, NEEDS_PRACTICE_THRESHOLD } from '@/services/StatisticsService'
import { XStack, YStack, Text, Button } from '@/components/tamagui'
import { styled } from 'tamagui'
import { useThemeContext } from '@/components/TamaguiProvider'

interface QuestionDetailModalProps {
  question: QuestionStatistics
  pairedAnswers: PairedAnswers
  onClose: () => void
}

// Overlay styles - using native div since Tamagui doesn't support position: fixed
const overlayStyles: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 50,
  padding: 16,
}

// Note: Modal container styles are now defined dynamically in the component
// to support theme-aware colors

const Header = styled(XStack, {
  // Note: sticky positioning handled via inline styles on web
  top: 0,
  backgroundColor: '$background',
  borderBottomWidth: 1,
  borderBottomColor: '$borderColor',
  paddingHorizontal: '$5',
  paddingVertical: '$4',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
})

const HeaderTitle = styled(Text, {
  fontSize: '$6',
  fontWeight: '600',
  color: '$color',
})

const HeaderSubtitle = styled(Text, {
  fontSize: '$2',
  color: '$placeholderColor',
})

const CloseButton = styled(Button, {
  backgroundColor: 'transparent',
  padding: '$1',

  hoverStyle: {
    opacity: 0.7,
  },
})

const Content = styled(YStack, {
  paddingHorizontal: '$5',
  paddingVertical: '$5',
  gap: '$5',
})

const SectionLabel = styled(Text, {
  fontSize: '$2',
  fontWeight: '500',
  color: '$placeholderColor',
  marginBottom: '$2',
})

const QuestionText = styled(Text, {
  fontSize: '$5',
  color: '$color',
})

const AnswerText = styled(Text, {
  color: '$success',
  fontWeight: '500',
})

const StatsGrid = styled(XStack, {
  backgroundColor: '$backgroundHover',
  borderRadius: '$3',
  padding: '$4',
  flexWrap: 'wrap',
  gap: '$4',
})

const StatItem = styled(YStack, {
  minWidth: 80,
  flex: 1,
})

const StatLabel = styled(Text, {
  fontSize: '$1',
  color: '$placeholderColor',
  marginBottom: '$1',
})

const StatValue = styled(Text, {
  fontSize: '$7',
  fontWeight: 'bold',
})

const PerformanceCircle = styled(YStack, {
  width: 48,
  height: 48,
  borderRadius: 24,
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    variant: {
      correct: {
        backgroundColor: '$green2',
      },
      incorrect: {
        backgroundColor: '$error1',
      },
    },
  } as const,
})

const PerformanceIcon = styled(Text, {
  fontSize: '$4',

  variants: {
    variant: {
      correct: {
        color: '$success',
      },
      incorrect: {
        color: '$error',
      },
    },
  } as const,
})

const Footer = styled(XStack, {
  // Note: sticky positioning handled via inline styles on web
  bottom: 0,
  backgroundColor: '$backgroundHover',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
  paddingHorizontal: '$5',
  paddingVertical: '$4',
  justifyContent: 'flex-end',
})

const PrimaryButton = styled(Button, {
  backgroundColor: '$primary',
  paddingVertical: '$2',
  paddingHorizontal: '$4',
  borderRadius: '$3',

  hoverStyle: {
    backgroundColor: '$primaryHover',
  },
})

const ButtonText = styled(Text, {
  color: 'white',
  fontWeight: '500',
})

const Badge = styled(XStack, {
  paddingHorizontal: '$3',
  paddingVertical: '$1',
  borderRadius: 9999,
  alignItems: 'center',

  variants: {
    variant: {
      gray: {
        backgroundColor: '$backgroundPress',
      },
      green: {
        backgroundColor: '$green2',
      },
      orange: {
        backgroundColor: '$warning1',
      },
      blue: {
        backgroundColor: '$blue2',
      },
    },
  } as const,
})

const BadgeText = styled(Text, {
  fontSize: '$2',
  fontWeight: '500',

  variants: {
    variant: {
      gray: {
        color: '$color',
      },
      green: {
        color: '$green7',
      },
      orange: {
        color: '$warning6',
      },
      blue: {
        color: '$blue7',
      },
    },
  } as const,
})

const EmptyText = styled(Text, {
  color: '$placeholderColor',
  textAlign: 'center',
  paddingVertical: '$6',
})

// Table styles - only the static base style; theme-aware styles are computed in component
const tableStyles: React.CSSProperties = {
  minWidth: '100%',
  borderCollapse: 'separate',
  borderSpacing: 0,
}

export default function QuestionDetailModal({
  question,
  pairedAnswers,
  onClose
}: QuestionDetailModalProps) {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'
  const history = pairedAnswers[PairedQuestionNumber(question.pairedQuestionNumber)] ?? []

  // Theme-aware dynamic styles
  const dynamicModalStyles = useMemo((): React.CSSProperties => ({
    backgroundColor: isDark ? '#1a1a1a' : 'white',
    borderRadius: 16,
    maxWidth: 768,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  }), [isDark])

  const dynamicThStyles = useMemo((): React.CSSProperties => ({
    padding: '8px 16px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 500,
    color: isDark ? '#d1d5db' : '#374151',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    backgroundColor: isDark ? '#262626' : '#f9fafb',
  }), [isDark])

  const dynamicTdStyles = useMemo((): React.CSSProperties => ({
    padding: '8px 16px',
    fontSize: 14,
    borderTop: `1px solid ${isDark ? '#404040' : '#e5e7eb'}`,
  }), [isDark])

  const dynamicColors = useMemo(() => ({
    text: isDark ? '#e5e5e5' : '#111827',
    muted: isDark ? '#a1a1aa' : '#6b7280',
    success: isDark ? '#22c55e' : '#16a34a',
    primary: isDark ? '#60a5fa' : '#2563eb',
    purple: isDark ? '#a78bfa' : '#9333ea',
    successBg: isDark ? '#166534' : '#dcfce7',
    successText: isDark ? '#bbf7d0' : '#166534',
    errorBg: isDark ? '#7f1d1d' : '#fee2e2',
    errorText: isDark ? '#fecaca' : '#991b1b',
    border: isDark ? '#404040' : '#e5e7eb',
    iconStroke: isDark ? '#a1a1aa' : '#9ca3af',
  }), [isDark])

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Determine mastery status
  const isMastered = (() => {
    if (history.length < MASTERY_THRESHOLD) {
      return false
    }
    const recentAnswers = history.slice(-MASTERY_THRESHOLD)
    return recentAnswers.every((answer) => answer.correct === true)
  })()

  const getStatusBadge = () => {
    if (question.timesAsked === 0) {
      return (
        <Badge variant="gray">
          <BadgeText variant="gray">Never Asked</BadgeText>
        </Badge>
      )
    } else if (isMastered === true) {
      return (
        <Badge variant="green">
          <BadgeText variant="green">Mastered</BadgeText>
        </Badge>
      )
    } else if (question.accuracy < NEEDS_PRACTICE_THRESHOLD) {
      return (
        <Badge variant="orange">
          <BadgeText variant="orange">Needs Practice</BadgeText>
        </Badge>
      )
    } else {
      return (
        <Badge variant="blue">
          <BadgeText variant="blue">In Progress</BadgeText>
        </Badge>
      )
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getRecentPerformance = () => {
    if (history.length === 0) return []
    const recent = history.slice(-5).reverse()
    return recent
  }

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={dynamicModalStyles} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        {/* Header */}
        <Header>
          <YStack flex={1} paddingRight="$4">
            <XStack alignItems="center" gap="$3" marginBottom="$2">
              <HeaderTitle>
                Question {question.questionNumber}
              </HeaderTitle>
              {getStatusBadge()}
            </XStack>
            <HeaderSubtitle>
              Paired ID: {question.pairedQuestionNumber}
            </HeaderSubtitle>
          </YStack>
          <CloseButton onPress={onClose}>
            <svg width={24} height={24} fill="none" stroke={dynamicColors.iconStroke} viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </CloseButton>
        </Header>

        {/* Content */}
        <Content>
          {/* Question and Answer */}
          <YStack>
            <SectionLabel>Question</SectionLabel>
            <QuestionText>{question.questionText}</QuestionText>
          </YStack>

          <YStack>
            <SectionLabel>Correct Answer</SectionLabel>
            <AnswerText>{question.correctAnswerText}</AnswerText>
          </YStack>

          {/* Statistics */}
          <StatsGrid>
            <StatItem>
              <StatLabel>Times Asked</StatLabel>
              <StatValue color={dynamicColors.text}>{question.timesAsked}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Correct</StatLabel>
              <StatValue color={dynamicColors.success}>{question.timesCorrect}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Accuracy</StatLabel>
              <StatValue color={dynamicColors.primary}>
                {question.timesAsked > 0 ? `${Math.round(question.accuracy * 100)}%` : '-'}
              </StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Next Time %</StatLabel>
              <StatValue color={dynamicColors.purple}>{question.selectionProbability.toFixed(2)}%</StatValue>
            </StatItem>
          </StatsGrid>

          {/* Recent Performance */}
          {history.length > 0 ? (
            <YStack>
              <SectionLabel>Recent Performance (Last 5)</SectionLabel>
              <XStack gap="$2">
                {getRecentPerformance().map((answer, index) => (
                  <PerformanceCircle
                    key={index}
                    variant={answer.correct === true ? 'correct' : 'incorrect'}
                  >
                    <PerformanceIcon variant={answer.correct === true ? 'correct' : 'incorrect'}>
                      {answer.correct === true ? '✓' : '✗'}
                    </PerformanceIcon>
                  </PerformanceCircle>
                ))}
              </XStack>
            </YStack>
          ) : null}

          {/* Full History */}
          <YStack>
            <SectionLabel>Complete History</SectionLabel>
            {history.length > 0 ? (
              <YStack
                borderWidth={1}
                borderColor={dynamicColors.border}
                borderRadius="$3"
                overflow="hidden"
              >
                <table style={tableStyles}>
                  <thead>
                    <tr>
                      <th style={dynamicThStyles}>#</th>
                      <th style={dynamicThStyles}>Date & Time</th>
                      <th style={dynamicThStyles}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...history].reverse().map((answer, index) => (
                      <tr key={index}>
                        <td style={{ ...dynamicTdStyles, color: dynamicColors.muted, whiteSpace: 'nowrap' }}>
                          {history.length - index}
                        </td>
                        <td style={{ ...dynamicTdStyles, color: dynamicColors.text, whiteSpace: 'nowrap' }}>
                          {formatDate(answer.ts)}
                        </td>
                        <td style={dynamicTdStyles}>
                          {answer.correct === true ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 10px',
                              borderRadius: 9999,
                              fontSize: 12,
                              fontWeight: 500,
                              backgroundColor: dynamicColors.successBg,
                              color: dynamicColors.successText,
                            }}>
                              Correct
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '2px 10px',
                              borderRadius: 9999,
                              fontSize: 12,
                              fontWeight: 500,
                              backgroundColor: dynamicColors.errorBg,
                              color: dynamicColors.errorText,
                            }}>
                              Incorrect
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </YStack>
            ) : (
              <EmptyText>
                No attempts yet. This question has never been asked.
              </EmptyText>
            )}
          </YStack>
        </Content>

        {/* Footer */}
        <Footer>
          <PrimaryButton onPress={onClose}>
            <ButtonText>Close</ButtonText>
          </PrimaryButton>
        </Footer>
      </div>
    </div>
  )
}
