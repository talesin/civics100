import React from 'react'
import { GameStats } from '@/types'
import { Card, XStack, YStack, Text } from '@/components/tamagui'
import { styled } from 'tamagui'

interface StatsSummaryProps {
  stats: GameStats
}

const HeaderIcon = styled(YStack, {
  width: 32,
  height: 32,
  borderRadius: '$3',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#a855f7', // purple-500 as fallback for gradient
})

const StatCard = styled(YStack, {
  padding: '$4',
  borderRadius: '$3',
  borderWidth: 1,
  minWidth: 0,
  flex: 1,
  alignItems: 'center',

  variants: {
    variant: {
      blue: {
        backgroundColor: '#eff6ff', // blue-50
        borderColor: '#dbeafe', // blue-100
      },
      green: {
        backgroundColor: '#f0fdf4', // green-50
        borderColor: '#dcfce7', // green-100
      },
      purple: {
        backgroundColor: '#faf5ff', // purple-50
        borderColor: '#f3e8ff', // purple-100
      },
      yellow: {
        backgroundColor: '#fefce8', // yellow-50
        borderColor: '#fef9c3', // yellow-100
      },
      orange: {
        backgroundColor: '#fff7ed', // orange-50
        borderColor: '#ffedd5', // orange-100
      },
    },
  },
} as const)

const StatValue = styled(Text, {
  fontSize: '$8', // text-2xl
  fontWeight: 'bold',
  marginBottom: '$1',

  '$sm': {
    fontSize: '$9', // text-3xl on sm+
  },

  variants: {
    variant: {
      blue: {
        color: '#2563eb', // blue-600
      },
      green: {
        color: '#16a34a', // green-600
      },
      purple: {
        color: '#9333ea', // purple-600
      },
      yellow: {
        color: '#ca8a04', // yellow-600
      },
      orange: {
        color: '#ea580c', // orange-600
      },
    },
  },
} as const)

const StatLabel = styled(Text, {
  fontSize: '$2', // text-xs
  fontWeight: '500',

  '$sm': {
    fontSize: '$3', // text-sm on sm+
  },

  variants: {
    variant: {
      blue: {
        color: '#1d4ed8', // blue-700
      },
      green: {
        color: '#15803d', // green-700
      },
      purple: {
        color: '#7e22ce', // purple-700
      },
      yellow: {
        color: '#a16207', // yellow-700
      },
      orange: {
        color: '#c2410c', // orange-700
      },
    },
  },
} as const)

const AchievementBadge = styled(XStack, {
  padding: '$4',
  borderRadius: '$3',
  borderWidth: 1,
  alignItems: 'center',
  animation: 'fast',

  variants: {
    variant: {
      green: {
        backgroundColor: '#f0fdf4', // green-50
        borderColor: '#bbf7d0', // green-200
      },
      yellow: {
        backgroundColor: '#fefce8', // yellow-50
        borderColor: '#fef08a', // yellow-200
      },
    },
  },
} as const)

const BadgeIcon = styled(YStack, {
  width: 24,
  height: 24,
  borderRadius: 999,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '$3',

  variants: {
    variant: {
      green: {
        backgroundColor: '#22c55e', // green-500
      },
      yellow: {
        backgroundColor: '#eab308', // yellow-500
      },
    },
  },
} as const)

const BadgeText = styled(Text, {
  fontSize: '$3',
  fontWeight: '500',

  variants: {
    variant: {
      green: {
        color: '#166534', // green-800
      },
      yellow: {
        color: '#854d0e', // yellow-800
      },
    },
  },
} as const)

export default function StatsSummary({ stats }: StatsSummaryProps) {
  if (stats.totalGames === 0) {
    return (
      <Card elevated padding="$6">
        <YStack alignItems="center">
          <Text
            fontSize="$5"
            fontWeight="600"
            color="$color"
            marginBottom="$2"
            tag="h3"
          >
            Your Statistics
          </Text>
          <Text color="$color" opacity={0.8}>
            No games played yet. Start your first civics test!
          </Text>
        </YStack>
      </Card>
    )
  }

  return (
    <Card elevated padding="$6">
      <XStack alignItems="center" justifyContent="space-between" marginBottom="$6">
        <Text
          fontSize="$5"
          fontWeight="bold"
          color="$color"
          tag="h3"
          $sm={{ fontSize: '$6' }}
        >
          Your Statistics
        </Text>
        <HeaderIcon>
          <svg width={20} height={20} fill="none" stroke="white" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </HeaderIcon>
      </XStack>

      <XStack flexWrap="wrap" gap="$4" $sm={{ gap: '$6' }}>
        <StatCard variant="blue">
          <StatValue variant="blue">{stats.totalGames}</StatValue>
          <StatLabel variant="blue">Games Played</StatLabel>
        </StatCard>

        <StatCard variant="green">
          <StatValue variant="green">{stats.averageScore}%</StatValue>
          <StatLabel variant="green">Average Score</StatLabel>
        </StatCard>

        <StatCard variant="purple">
          <StatValue variant="purple">{stats.bestScore}%</StatValue>
          <StatLabel variant="purple">Best Score</StatLabel>
        </StatCard>

        <StatCard variant="yellow">
          <StatValue variant="yellow">{stats.earlyWins}</StatValue>
          <StatLabel variant="yellow">Early Wins</StatLabel>
        </StatCard>

        <StatCard variant="orange">
          <StatValue variant="orange">{stats.earlyFailures}</StatValue>
          <StatLabel variant="orange">Early Failures</StatLabel>
        </StatCard>
      </XStack>

      {(stats.averageScore >= 60 || stats.bestScore === 100) === true ? (
        <YStack marginTop="$6" gap="$3">
          {(stats.averageScore >= 60) === true ? (
            <AchievementBadge variant="green">
              <BadgeIcon variant="green">
                <svg width={16} height={16} fill="none" stroke="white" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </BadgeIcon>
              <BadgeText variant="green">
                🎯 Great job! You&apos;re consistently passing the civics test.
              </BadgeText>
            </AchievementBadge>
          ) : null}

          {(stats.bestScore === 100) === true ? (
            <AchievementBadge variant="yellow">
              <BadgeIcon variant="yellow">
                <svg width={16} height={16} fill="none" stroke="white" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </BadgeIcon>
              <BadgeText variant="yellow">
                🏆 Perfect score achieved! You&apos;re a civics expert!
              </BadgeText>
            </AchievementBadge>
          ) : null}
        </YStack>
      ) : null}
    </Card>
  )
}
