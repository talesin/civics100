import { useEffect, useState } from 'react'
import { useTheme } from 'tamagui'
import { GameStats } from '../types'
import { Text, XStack, YStack } from './tamagui'
import { TrendingUp } from './icons'

interface StatsSummaryProps {
  readonly stats: GameStats
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const start = display
    const delta = value - start
    if (delta === 0) return undefined
    const duration = 900
    const startedAt = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(start + delta * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <>
      {display}
      {suffix}
    </>
  )
}

// The old CSS grid `repeat(auto-fit, minmax(120px, 1fr))` becomes flex-wrap:
// at the layout's 900px max width auto-fit yields 5 equal columns (flexBasis
// 20%), and under the $xs breakpoint it yields 2 (flexBasis 50%). borderRight
// stays index-based (all but the last item), exactly like the web original.
// clamp(2rem, 5vw, 3rem) resolves to 48px desktop / 32px at $xs widths;
// lineHeight and letterSpacing (-0.02em) are numeric px per size.
export default function StatsSummary({ stats }: StatsSummaryProps) {
  const theme = useTheme()
  const muted = theme.editorialMuted?.get() as string

  if (stats.totalGames === 0) {
    return (
      <YStack borderTopWidth={1} borderTopColor="$editorialRule" paddingTop={32}>
        <XStack alignItems="center" gap={10} marginBottom={24}>
          <TrendingUp size={16} color={muted} strokeWidth={1.5} />
          <Text
            tag="h3"
            fontFamily="$serif"
            fontSize={20}
            fontWeight="500"
            color="$editorialInk"
            letterSpacing={-0.2}
          >
            Your Statistics
          </Text>
        </XStack>
        <YStack borderTopWidth={1} borderTopColor="$editorialRule" paddingTop={20}>
          <Text tag="p" fontSize={14} color="$editorialMuted">
            No tests taken yet. Start your first civics test to track your progress.
          </Text>
        </YStack>
      </YStack>
    )
  }

  const statItems = [
    { value: stats.totalGames, suffix: '', label: 'Tests Taken' },
    { value: stats.averageScore, suffix: '%', label: 'Average Score', accent: stats.averageScore >= 60 },
    { value: stats.bestScore, suffix: '%', label: 'Best Score', accent: stats.bestScore === 100 },
    { value: stats.earlyWins, suffix: '', label: 'Early Wins' },
    { value: stats.earlyFailures, suffix: '', label: 'Early Failures' }
  ]

  return (
    <YStack borderTopWidth={1} borderTopColor="$editorialRule" paddingTop={32}>
      <XStack alignItems="center" gap={10} marginBottom={24}>
        <TrendingUp size={16} color={muted} strokeWidth={1.5} />
        <Text
          tag="h3"
          fontFamily="$serif"
          fontSize={20}
          fontWeight="500"
          color="$editorialInk"
          letterSpacing={-0.2}
        >
          Your Statistics
        </Text>
      </XStack>

      <YStack borderTopWidth={1} borderTopColor="$editorialRule" />

      <XStack flexWrap="wrap" borderBottomWidth={1} borderBottomColor="$editorialRule">
        {statItems.map((item, i) => (
          <YStack
            key={item.label}
            flexBasis="20%"
            flexGrow={0}
            flexShrink={0}
            $xs={{ flexBasis: '50%' }}
            paddingTop={20}
            paddingBottom={20}
            paddingRight={i < statItems.length - 1 ? 16 : 0}
            borderRightWidth={i < statItems.length - 1 ? 1 : 0}
            borderRightColor="$editorialRule"
          >
            <Text
              fontFamily="$serif"
              fontSize={48}
              fontWeight="400"
              lineHeight={48}
              letterSpacing={-0.96}
              $xs={{ fontSize: 32, lineHeight: 32, letterSpacing: -0.64 }}
              color={item.accent === true ? '$editorialAccent' : '$editorialInk'}
              marginBottom={6}
            >
              <AnimatedNumber value={item.value} suffix={item.suffix} />
            </Text>
            {/* lineHeight 21 + marginTop 3 reproduce the 24px line box (and its
                baseline position) the old inline label got from the body's
                16px/1.5 line-height strut. */}
            <Text
              fontSize={11}
              fontWeight="600"
              lineHeight={21}
              marginTop={3}
              letterSpacing={0.88}
              textTransform="uppercase"
              color="$editorialMuted"
            >
              {item.label}
            </Text>
          </YStack>
        ))}
      </XStack>

      {(stats.averageScore >= 60 || stats.bestScore === 100) === true ? (
        <YStack paddingTop={16} gap={8}>
          {stats.averageScore >= 60 ? (
            <Text tag="p" fontSize={13} color="$editorialMuted" lineHeight={19.5}>
              <Text fontSize={13} color="$editorialAccent" fontWeight="600">
                Consistently passing
              </Text>
              {' — you are consistently passing the civics test with an average score of '}
              <Text fontSize={13} color="$editorialInk" fontWeight="700">
                {stats.averageScore}%
              </Text>
              .
            </Text>
          ) : null}
          {stats.bestScore === 100 ? (
            <Text tag="p" fontSize={13} color="$editorialMuted" lineHeight={19.5}>
              <Text fontSize={13} color="$editorialAccent" fontWeight="600">
                Perfect score achieved
              </Text>
              {' — you have answered every question correctly in a single session.'}
            </Text>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  )
}
