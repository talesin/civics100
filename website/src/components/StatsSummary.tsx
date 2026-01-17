import React, { useMemo } from 'react'
import { GameStats } from '@/types'
import { Card, XStack, YStack, Text } from '@/components/tamagui'
import { styled } from 'tamagui'
import { useThemeContext } from '@/components/TamaguiProvider'

interface StatsSummaryProps {
  readonly stats: GameStats
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
})

const StatValue = styled(Text, {
  fontSize: '$8',
  fontWeight: 'bold',
  marginBottom: '$1',

  '$sm': {
    fontSize: '$9',
  },
})

const StatLabel = styled(Text, {
  fontSize: '$2',
  fontWeight: '500',

  '$sm': {
    fontSize: '$3',
  },
})

const AchievementBadge = styled(XStack, {
  padding: '$4',
  borderRadius: '$3',
  borderWidth: 1,
  alignItems: 'center',
  animation: 'fast',
})

const BadgeIcon = styled(YStack, {
  width: 24,
  height: 24,
  borderRadius: 999,
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '$3',
})

const BadgeText = styled(Text, {
  fontSize: '$3',
  fontWeight: '500',
})

// Theme-aware color definitions - muted, subtle palette
const getStatCardColors = (isDark: boolean) => ({
  blue: {
    bg: isDark ? '#1e293b' : '#f1f5f9',
    border: isDark ? '#334155' : '#e2e8f0',
    value: isDark ? '#7dd3fc' : '#0369a1',
    label: isDark ? '#94a3b8' : '#475569',
  },
  green: {
    bg: isDark ? '#1a2e1a' : '#f1f8f1',
    border: isDark ? '#2d4a2d' : '#d4e7d4',
    value: isDark ? '#86efac' : '#15803d',
    label: isDark ? '#94a3b8' : '#475569',
  },
  purple: {
    bg: isDark ? '#2d2438' : '#f5f3ff',
    border: isDark ? '#3d3252' : '#e4e0f0',
    value: isDark ? '#c4b5fd' : '#7c3aed',
    label: isDark ? '#94a3b8' : '#475569',
  },
  yellow: {
    bg: isDark ? '#2d2a1a' : '#fefce8',
    border: isDark ? '#4a4528' : '#fef3c7',
    value: isDark ? '#fde047' : '#a16207',
    label: isDark ? '#94a3b8' : '#475569',
  },
  orange: {
    bg: isDark ? '#2d221a' : '#fff7ed',
    border: isDark ? '#4a3628' : '#fed7aa',
    value: isDark ? '#fdba74' : '#c2410c',
    label: isDark ? '#94a3b8' : '#475569',
  },
})

const getAchievementColors = (isDark: boolean) => ({
  green: {
    bg: isDark ? '#1a2e1a' : '#f0fdf4',
    border: isDark ? '#2d4a2d' : '#bbf7d0',
    icon: isDark ? '#4ade80' : '#22c55e',
    text: isDark ? '#a3e4a3' : '#166534',
  },
  yellow: {
    bg: isDark ? '#2d2a1a' : '#fefce8',
    border: isDark ? '#4a4528' : '#fef08a',
    icon: isDark ? '#facc15' : '#eab308',
    text: isDark ? '#fde68a' : '#854d0e',
  },
})

export default function StatsSummary({ stats }: StatsSummaryProps) {
  const { theme } = useThemeContext()
  const isDark = theme === 'dark'

  const colors = useMemo(() => getStatCardColors(isDark), [isDark])
  const achievementColors = useMemo(() => getAchievementColors(isDark), [isDark])

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
        <StatCard backgroundColor={colors.blue.bg} borderColor={colors.blue.border}>
          <StatValue color={colors.blue.value}>{stats.totalGames}</StatValue>
          <StatLabel color={colors.blue.label}>Games Played</StatLabel>
        </StatCard>

        <StatCard backgroundColor={colors.green.bg} borderColor={colors.green.border}>
          <StatValue color={colors.green.value}>{stats.averageScore}%</StatValue>
          <StatLabel color={colors.green.label}>Average Score</StatLabel>
        </StatCard>

        <StatCard backgroundColor={colors.purple.bg} borderColor={colors.purple.border}>
          <StatValue color={colors.purple.value}>{stats.bestScore}%</StatValue>
          <StatLabel color={colors.purple.label}>Best Score</StatLabel>
        </StatCard>

        <StatCard backgroundColor={colors.yellow.bg} borderColor={colors.yellow.border}>
          <StatValue color={colors.yellow.value}>{stats.earlyWins}</StatValue>
          <StatLabel color={colors.yellow.label}>Early Wins</StatLabel>
        </StatCard>

        <StatCard backgroundColor={colors.orange.bg} borderColor={colors.orange.border}>
          <StatValue color={colors.orange.value}>{stats.earlyFailures}</StatValue>
          <StatLabel color={colors.orange.label}>Early Failures</StatLabel>
        </StatCard>
      </XStack>

      {(stats.averageScore >= 60 || stats.bestScore === 100) === true ? (
        <YStack marginTop="$6" gap="$3">
          {(stats.averageScore >= 60) === true ? (
            <AchievementBadge
              backgroundColor={achievementColors.green.bg}
              borderColor={achievementColors.green.border}
            >
              <BadgeIcon backgroundColor={achievementColors.green.icon}>
                <svg width={16} height={16} fill="none" stroke="white" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </BadgeIcon>
              <BadgeText color={achievementColors.green.text}>
                🎯 Great job! You&apos;re consistently passing the civics test.
              </BadgeText>
            </AchievementBadge>
          ) : null}

          {(stats.bestScore === 100) === true ? (
            <AchievementBadge
              backgroundColor={achievementColors.yellow.bg}
              borderColor={achievementColors.yellow.border}
            >
              <BadgeIcon backgroundColor={achievementColors.yellow.icon}>
                <svg width={16} height={16} fill="none" stroke="white" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
              </BadgeIcon>
              <BadgeText color={achievementColors.yellow.text}>
                🏆 Perfect score achieved! You&apos;re a civics expert!
              </BadgeText>
            </AchievementBadge>
          ) : null}
        </YStack>
      ) : null}
    </Card>
  )
}
