import { useEffect, useState } from 'react'
import { Effect } from 'effect'
import { styled, useTheme, Text as TamaguiText } from 'tamagui'
import { EditorialButton, LoadingSpinner, Text, XStack, YStack } from '../components/tamagui'
import { FileText, Star } from '../components/icons'
import ScoreRing from '../components/ScoreRing'
import StatsSummary from '../components/StatsSummary'
import { confirmDialog } from '../confirmDialog'
import { LocalStorageService } from '../services/LocalStorageService'
import type { GameResult, GameStats } from '../types'

export interface ResultsScreenProps {
  /** "Take New Test" / "Take Your First Test". */
  readonly onNavigateToGame: () => void
  /** "View Question Stats". */
  readonly onNavigateToStatistics: () => void
}

const PASS_PERCENTAGE = 60

const EMPTY_STATS: GameStats = {
  totalGames: 0,
  averageScore: 0,
  bestScore: 0,
  earlyWins: 0,
  earlyFailures: 0
}

type BadgeResult = 'pass' | 'fail' | 'warn'

const getBadgeResult = (result: GameResult): BadgeResult => {
  if (result.isEarlyFail === true || result.isEarlyWin === true) return 'warn'
  if (result.percentage >= PASS_PERCENTAGE) return 'pass'
  return 'fail'
}

const getBadgeLabel = (result: GameResult): string => {
  if (result.isEarlyFail === true) return 'Early Fail'
  if (result.isEarlyWin === true) return 'Early Win'
  if (result.percentage >= PASS_PERCENTAGE) return 'Passed'
  return 'Failed'
}

// Port of .badge/.badge-pass/.badge-fail/.badge-warn (globals.css).
const ResultBadge = styled(Text, {
  tag: 'span',
  paddingVertical: 2,
  paddingHorizontal: 10,
  borderRadius: 9999,
  fontSize: 12,
  fontWeight: '500',

  variants: {
    result: {
      pass: {
        backgroundColor: '$themeSuccessBg',
        color: '$themeSuccessText'
      },
      fail: {
        backgroundColor: '$themeErrorBg',
        color: '$themeErrorText'
      },
      warn: {
        backgroundColor: '$themeWarningBg',
        color: '$themeWarningText'
      }
    }
  } as const
})

const Eyebrow = styled(Text, {
  tag: 'p',
  fontSize: 11,
  fontWeight: '600',
  letterSpacing: 1.32, // 0.12em at 11px
  textTransform: 'uppercase',
  color: '$editorialAccent',
  marginBottom: 10
})

// clamp(2rem, 5vw, 2.75rem) resolves to 44px at the desktop baseline and 32px
// under $xs; letterSpacing -0.02em is px per size. The old unitless
// line-height 1.1 laid out as 48.39px / 35.19px (Chrome floors the computed
// value to 1/64px), whereas explicit 48.4px rounds up to 48.41 and pushed the
// desktop page 1px taller — so the floored values are spelled out.
const PageTitle = styled(Text, {
  tag: 'h1',
  fontFamily: '$serif',
  fontSize: 44,
  lineHeight: 48.39,
  fontWeight: '500',
  color: '$editorialInk',
  letterSpacing: -0.88,

  $xs: {
    fontSize: 32,
    lineHeight: 35.19,
    letterSpacing: -0.64
  }
})

const SectionTitle = styled(Text, {
  tag: 'h3',
  fontFamily: '$serif',
  fontSize: 22,
  fontWeight: '500',
  color: '$editorialInk',
  letterSpacing: -0.22 // -0.01em at 22px
})

const Rule = styled(YStack, {
  borderTopWidth: 1,
  borderTopColor: '$editorialRule'
})

// Text-based single element so the label inherits its colour (EditorialButton
// reasoning). The `.focus-ring` utility the old <button> carried only applies
// under prefers-contrast: high, so the 3px outline lives in focusVisibleStyle.
const ClearDataButton = styled(TamaguiText, {
  tag: 'button',
  backgroundColor: 'transparent',
  borderWidth: 0,
  paddingVertical: 6,
  paddingHorizontal: 4,
  fontSize: 13,
  color: '$editorialMuted',
  textDecorationLine: 'underline',
  cursor: 'pointer',

  focusVisibleStyle: {
    outlineWidth: 3,
    outlineStyle: 'solid',
    outlineColor: '$editorialMuted',
    outlineOffset: 3
  }
})

export default function ResultsScreen({
  onNavigateToGame,
  onNavigateToStatistics
}: ResultsScreenProps) {
  const [results, setResults] = useState<GameResult[]>([])
  const [stats, setStats] = useState<GameStats>(EMPTY_STATS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const fetchData = Effect.gen(function* () {
      const storageService = yield* LocalStorageService
      const gameResults = yield* storageService.getGameResults()
      const gameStats = yield* storageService.getGameStats()

      if (mounted) {
        setResults([...gameResults])
        setStats(gameStats)
        setIsLoading(false)
      }
    })

    Effect.runPromise(fetchData.pipe(Effect.provide(LocalStorageService.Default))).catch(
      (error) => {
        if (mounted) {
          console.error(error)
          setIsLoading(false)
        }
      }
    )

    return () => {
      mounted = false
    }
  }, [])

  const handleClearData = () => {
    void confirmDialog(
      'Clear all data',
      'Are you sure you want to clear all your test results? This cannot be undone.'
    ).then((confirmed) => {
      if (!confirmed) return

      const clearData = Effect.gen(function* () {
        const storageService = yield* LocalStorageService
        yield* storageService.clearAllData()
        setResults([])
        setStats(EMPTY_STATS)
      })

      Effect.runPromise(clearData.pipe(Effect.provide(LocalStorageService.Default))).catch(
        console.error
      )
    })
  }

  const theme = useTheme()
  const accent = theme.editorialAccent?.get() as string

  if (isLoading) {
    return (
      <YStack alignItems="center" justifyContent="center" minHeight={384}>
        <LoadingSpinner />
      </YStack>
    )
  }

  return (
    <YStack gap={32} maxWidth={900} marginHorizontal="auto">
      {/* Both header halves keep the old divs' flex-shrink: 1 so the button
          pair shrinks to the phone-width row and wraps inside it instead of
          overflowing (Tamagui stacks default to flexShrink 0). */}
      <XStack justifyContent="space-between" alignItems="flex-end" flexWrap="wrap" gap={16}>
        <YStack flexShrink={1}>
          <Eyebrow>Archive</Eyebrow>
          <PageTitle>Your Test Results</PageTitle>
        </YStack>
        <XStack gap={8} flexWrap="wrap" alignItems="center" flexShrink={1}>
          <EditorialButton ghost onPress={onNavigateToStatistics}>
            View Question Stats
          </EditorialButton>
          <EditorialButton onPress={onNavigateToGame}>Take New Test</EditorialButton>
        </XStack>
      </XStack>

      <StatsSummary stats={stats} />

      {results.length === 0 ? (
        <YStack
          borderTopWidth={1}
          borderTopColor="$editorialRule"
          paddingTop={48}
          paddingHorizontal={16}
          paddingBottom={16}
        >
          <YStack
            width={56}
            height={56}
            backgroundColor="$editorialAccentSubtle"
            borderRadius={9999}
            alignItems="center"
            justifyContent="center"
            alignSelf="center"
            marginBottom={20}
          >
            <FileText size={26} strokeWidth={1.5} color={accent} />
          </YStack>
          <Eyebrow marginBottom={8} textAlign="center">
            Archive
          </Eyebrow>
          <SectionTitle marginBottom={10} textAlign="center">
            No Test Results Yet
          </SectionTitle>
          {/* lineHeight 22.39, not 22.4: the old `line-height: 1.6` floors to
              22.390625px per line (see PageTitle), and 22.4 rounds up, which
              shifted the third line down a pixel at phone width. */}
          <Text
            tag="p"
            color="$editorialMuted"
            marginBottom={24}
            fontSize={14}
            lineHeight={22.39}
            textAlign="center"
          >
            You haven&apos;t taken any civics tests yet. Take your first test to see your results
            here.
          </Text>
          <EditorialButton alignSelf="center" onPress={onNavigateToGame}>
            Take Your First Test
          </EditorialButton>
        </YStack>
      ) : (
        <YStack>
          <YStack borderTopWidth={1} borderTopColor="$editorialRule" paddingTop={20}>
            <Eyebrow>
              Archive · {results.length} {results.length === 1 ? 'Test' : 'Tests'}
            </Eyebrow>
            <SectionTitle marginBottom={16}>Test History</SectionTitle>
            <Rule />
          </YStack>
          <YStack>
            {results.map((result, index) => {
              const passed = result.percentage >= PASS_PERCENTAGE
              return (
                <YStack
                  key={result.sessionId}
                  paddingVertical={18}
                  borderBottomWidth={1}
                  borderBottomColor="$editorialRule"
                >
                  <XStack alignItems="center" justifyContent="space-between" gap={16}>
                    <YStack flex={1}>
                      <XStack alignItems="center" gap={10} marginBottom={8} flexWrap="wrap">
                        <Text
                          fontSize={13}
                          fontWeight="500"
                          color="$editorialInk"
                          letterSpacing={0.26}
                        >
                          Test #{results.length - index}
                        </Text>
                        <ResultBadge result={getBadgeResult(result)}>
                          {getBadgeLabel(result)}
                        </ResultBadge>
                        <Text fontSize={12} color="$editorialMuted">
                          {result.completedAt.toLocaleDateString()} at{' '}
                          {result.completedAt.toLocaleTimeString()}
                        </Text>
                      </XStack>
                      <XStack alignItems="baseline" gap={16} flexWrap="wrap">
                        <Text
                          fontFamily="$serif"
                          fontSize={24}
                          fontWeight="500"
                          lineHeight={24}
                          letterSpacing={-0.48}
                          color={passed ? '$editorialInk' : '$themeError'}
                        >
                          {result.percentage}%
                        </Text>
                        <Text color="$editorialMuted" fontSize={13}>
                          {result.correctAnswers}/{result.totalQuestions} correct
                        </Text>
                        {result.isEarlyWin === true ? (
                          <XStack alignItems="center" gap={4}>
                            <Star size={12} strokeWidth={1.5} color={accent} />
                            <Text color="$editorialAccent" fontSize={12}>
                              Early completion
                            </Text>
                          </XStack>
                        ) : null}
                      </XStack>
                    </YStack>
                    <ScoreRing percentage={result.percentage} passed={passed} />
                  </XStack>
                </YStack>
              )
            })}
          </YStack>
          <XStack paddingTop={16} justifyContent="flex-end">
            <ClearDataButton onPress={handleClearData}>Clear all data</ClearDataButton>
          </XStack>
        </YStack>
      )}
    </YStack>
  )
}
