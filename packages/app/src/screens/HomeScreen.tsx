import { useEffect, useState } from 'react'
import { Effect } from 'effect'
import { styled, useTheme } from 'tamagui'
import { EditorialButton, LoadingSpinner, Text, XStack, YStack } from '../components/tamagui'
import { BarChart2, BookOpen, CheckCircle, Keyboard, Volume2 } from '../components/icons'
import ExternalLink from '../components/ExternalLink'
import StatsSummary from '../components/StatsSummary'
import { LocalStorageService } from '../services/LocalStorageService'
import type { GameStats } from '../types'
import { Eyebrow, Rule } from './editorial'

export interface HomeScreenProps {
  /** "Start" when settings have been saved. */
  readonly onNavigateToGame: () => void
  /** "Start" before any settings exist. */
  readonly onNavigateToSettings: () => void
  /** "View Results". */
  readonly onNavigateToResults: () => void
}

const EMPTY_STATS: GameStats = {
  totalGames: 0,
  averageScore: 0,
  bestScore: 0,
  earlyWins: 0,
  earlyFailures: 0
}

const ABOUT_SECTIONS = [
  {
    title: 'Test Format',
    items: [
      'Up to 20 questions from a pool of 128',
      'Pass with 12 correct answers (60%)',
      'Questions from 2025 USCIS civics test',
      'Version M-1778 (09/25)'
    ]
  },
  {
    title: 'Topics Covered',
    items: ['American Government', 'American History', 'Symbols and Holidays']
  },
  {
    title: 'Dynamic Content',
    items: [
      'Current senators and representatives',
      'Updated from official government sources',
      'Track your progress over time'
    ]
  }
] as const

const SOURCES = [
  {
    href: 'https://www.uscis.gov/sites/default/files/document/questions-and-answers/2025-Civics-Test-128-Questions-and-Answers.pdf',
    label: 'USCIS 128 Civics Questions (2025)',
    desc: 'Official 2025 test questions for naturalization'
  },
  {
    href: 'https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates',
    label: 'USCIS Test Updates',
    desc: 'Current test changes and updates'
  },
  {
    href: 'https://www.senate.gov/senators/',
    label: 'U.S. Senate',
    desc: 'Current senators by state'
  },
  {
    href: 'https://www.house.gov/representatives',
    label: 'U.S. House of Representatives',
    desc: 'Current representatives by district'
  },
  {
    href: 'https://www.usa.gov/state-governments',
    label: 'USA.gov State Governments',
    desc: 'State government information and governors'
  }
] as const

// The framer-motion `fadeUp` variant (opacity 0 → 1, y 8 → 0, 280ms ease-out,
// delay i × 50ms) as Tamagui enterStyle on the fadeUp* driver keys; each
// section picks the key that carries its stagger step.
const FadeUp = styled(YStack, {
  animation: 'fadeUp',
  enterStyle: { opacity: 0, y: 8 },
  opacity: 1,
  y: 0
})

// clamp(2.5rem, 6vw, 4rem): 64px at the desktop baseline, 40px under $xs;
// line-height 1.1 floors to 70.39 / 44 (see editorial.ts).
const HeroTitle = styled(Text, {
  tag: 'h1',
  fontFamily: '$serif',
  fontSize: 64,
  lineHeight: 70.39,
  fontWeight: '500',
  letterSpacing: -1.28, // -0.02em at 64px
  color: '$editorialInk',
  marginBottom: 20,

  $xs: {
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.8
  }
})

// clamp(1rem, 2vw, 1.125rem): 18px desktop / 16px under $sm; 1.65 floors to
// 29.69 / 26.39.
const HeroLede = styled(Text, {
  tag: 'p',
  fontSize: 18,
  lineHeight: 29.69,
  color: '$editorialMuted',
  maxWidth: 560,
  marginBottom: 24,

  $sm: {
    fontSize: 16,
    lineHeight: 26.39
  }
})

// Port of the old cardStyle + the auto-fit grid: minmax(min(100%, 380px), 1fr)
// with a 20px gap only ever yields one or two columns for two cards, which
// flexBasis 380 + grow/shrink reproduces exactly (two per row iff 2 × 380 + 20
// fits, each then growing to half; otherwise full width, shrinking below 380
// on very narrow screens).
const Card = styled(YStack, {
  flexBasis: 380,
  flexGrow: 1,
  flexShrink: 1,
  minWidth: 0,
  backgroundColor: '$editorialPaper',
  borderWidth: 1,
  borderColor: '$editorialRule',
  borderRadius: 6,
  paddingVertical: 32,
  paddingHorizontal: 28
})

const CardIcon = styled(YStack, {
  width: 36,
  height: 36,
  borderRadius: 4,
  backgroundColor: '$editorialAccentSubtle',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 20
})

const CardTitle = styled(Text, {
  tag: 'h2',
  fontFamily: '$serif',
  fontSize: 22,
  fontWeight: '500',
  color: '$editorialInk',
  marginBottom: 10,
  letterSpacing: -0.22 // -0.01em at 22px
})

const CardBody = styled(Text, {
  tag: 'p',
  fontSize: 14,
  color: '$editorialMuted',
  lineHeight: 23.09, // 1.65 at 14px, floored
  marginBottom: 24,
  flex: 1
})

const Feature = styled(XStack, {
  alignItems: 'center',
  gap: 5
})

const FeatureText = styled(Text, {
  fontSize: 12,
  color: '$editorialMuted'
})

// The old h3 carried marginBottom 20 inside a centred flex row, which made its
// box 50px tall and sat the icon 10px below the text centre; the margin stays
// so the row keeps that geometry.
const SectionHeading = styled(Text, {
  tag: 'h3',
  fontFamily: '$serif',
  fontSize: 20,
  fontWeight: '500',
  color: '$editorialInk',
  marginBottom: 20,
  letterSpacing: -0.2 // -0.01em at 20px
})

// Port of the About grid: repeat(auto-fit, minmax(180px, 1fr)) with three
// cells. flexBasis 0 + grow gives the grid's exact equal thirds on one line;
// under $xs (≈ the 540px container where the grid drops to two columns) the
// cells take half each, the third staying half-width on its own row like the
// grid's; under $xxs (≈ the 360px container) one per row.
const AboutColumn = styled(YStack, {
  flexBasis: 0,
  flexGrow: 1,
  paddingVertical: 20,
  borderBottomWidth: 1,
  borderBottomColor: '$editorialRule',

  $xs: {
    flexBasis: '50%',
    flexGrow: 0
  },

  $xxs: {
    flexBasis: '100%'
  }
})

const AboutTitle = styled(Text, {
  tag: 'h4',
  fontSize: 11,
  fontWeight: '600',
  letterSpacing: 1.1, // 0.1em at 11px
  textTransform: 'uppercase',
  color: '$editorialAccent',
  marginBottom: 12
})

const AboutItem = styled(Text, {
  tag: 'li',
  fontSize: 13,
  color: '$editorialMuted',
  lineHeight: 19.5
})

const SourceItem = styled(YStack, {
  tag: 'li',
  gap: 2,
  paddingBottom: 10,
  borderBottomWidth: 1,
  borderBottomColor: '$editorialRule'
})

export default function HomeScreen({
  onNavigateToGame,
  onNavigateToSettings,
  onNavigateToResults
}: HomeScreenProps) {
  const theme = useTheme()
  const muted = theme.editorialMuted?.get() as string
  const accent = theme.editorialAccent?.get() as string

  const [stats, setStats] = useState<GameStats>(EMPTY_STATS)
  const [hasConfigured, setHasConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadHomeData = Effect.gen(function* () {
      const storageService = yield* LocalStorageService
      const gameStats = yield* storageService.getGameStats()
      const settingsConfigured = yield* storageService.hasSavedSettings()
      if (mounted) {
        setStats(gameStats)
        setHasConfigured(settingsConfigured)
        setIsLoading(false)
      }
    })

    Effect.runPromise(loadHomeData.pipe(Effect.provide(LocalStorageService.Default))).catch(
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

  if (isLoading) {
    return (
      <YStack alignItems="center" justifyContent="center" minHeight={320}>
        <LoadingSpinner ring width={28} height={28} durationMs={800} />
      </YStack>
    )
  }

  return (
    <YStack gap={40} maxWidth={900} marginHorizontal="auto">
      {/* Hero */}
      <FadeUp animation="fadeUp" paddingTop={16} paddingBottom={8}>
        <Eyebrow marginBottom={16}>U.S. Citizenship Practice Test</Eyebrow>
        <HeroTitle>Know Your Country</HeroTitle>
        <HeroLede>
          Practice with official USCIS civics questions covering American government, history, and
          civic ideals — the same content used in the naturalization interview.
        </HeroLede>
        <Text tag="p" fontSize={13} color="$editorialMuted" letterSpacing={0.13}>
          {'128 questions · 60% to pass · 12 correct answers to win early'}
        </Text>
      </FadeUp>

      {/* Hairline rule */}
      <FadeUp animation="fadeUp50">
        <Rule />
      </FadeUp>

      {/* Action cards */}
      <FadeUp animation="fadeUp100" flexDirection="row" flexWrap="wrap" gap={20}>
        <Card>
          <CardIcon>
            <CheckCircle size={20} color={accent} strokeWidth={1.5} />
          </CardIcon>
          <CardTitle>Take the Test</CardTitle>
          <CardBody>
            Start a new civics test with up to 20 questions. Pass with 12 correct answers, or the
            test ends early if you miss 9.
          </CardBody>
          <XStack gap={8} marginBottom={20}>
            <Feature>
              <Volume2 size={13} strokeWidth={1.5} color={muted} />
              <FeatureText>Audio</FeatureText>
            </Feature>
            <Feature>
              <Keyboard size={13} strokeWidth={1.5} color={muted} />
              <FeatureText>Keyboard</FeatureText>
            </Feature>
          </XStack>
          <EditorialButton
            width="100%"
            onPress={hasConfigured ? onNavigateToGame : onNavigateToSettings}
          >
            Start
          </EditorialButton>
        </Card>

        <Card>
          <CardIcon>
            <BarChart2 size={20} color={accent} strokeWidth={1.5} />
          </CardIcon>
          <CardTitle>View Results</CardTitle>
          <CardBody>
            Review past tests, track your progress over time, and see detailed statistics about your
            civics knowledge.
          </CardBody>
          <EditorialButton ghost width="100%" marginTop="auto" onPress={onNavigateToResults}>
            View Results
          </EditorialButton>
        </Card>
      </FadeUp>

      {/* Stats */}
      <FadeUp animation="fadeUp150">
        <StatsSummary stats={stats} />
      </FadeUp>

      {/* About */}
      <FadeUp animation="fadeUp200">
        <YStack borderTopWidth={1} borderTopColor="$editorialRule" paddingTop={32}>
          <XStack alignItems="center" gap={10} marginBottom={24}>
            <BookOpen size={16} color={muted} strokeWidth={1.5} />
            <SectionHeading>About the Test</SectionHeading>
          </XStack>
          <Rule />
          <XStack flexWrap="wrap">
            {ABOUT_SECTIONS.map((section) => (
              <AboutColumn key={section.title}>
                <AboutTitle>{section.title}</AboutTitle>
                <YStack tag="ul" gap={6}>
                  {section.items.map((item) => (
                    <AboutItem key={item}>{item}</AboutItem>
                  ))}
                </YStack>
              </AboutColumn>
            ))}
          </XStack>
        </YStack>
      </FadeUp>

      {/* Official Sources */}
      <FadeUp animation="fadeUp250">
        <YStack borderTopWidth={1} borderTopColor="$editorialRule" paddingTop={32}>
          <SectionHeading>Official Sources</SectionHeading>
          <Rule marginBottom={20} />
          <Text tag="p" fontSize={13} color="$editorialMuted" marginBottom={16} lineHeight={20.8}>
            All questions and political data are sourced directly from official U.S. government
            websites.
          </Text>
          <YStack tag="ul" gap={10}>
            {SOURCES.map(({ href, label, desc }) => (
              <SourceItem key={href}>
                <ExternalLink href={href}>{label}</ExternalLink>
                <Text tag="span" fontSize={12} color="$editorialMuted">
                  {desc}
                </Text>
              </SourceItem>
            ))}
          </YStack>
        </YStack>
      </FadeUp>
    </YStack>
  )
}
