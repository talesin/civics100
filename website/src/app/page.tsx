'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Effect } from 'effect'
import { motion } from 'framer-motion'
import { styled, useTheme, Text as TamaguiText } from 'tamagui'
import { CheckCircle, BarChart2, BookOpen, Keyboard, Volume2 } from 'lucide-react'
import Layout from '@/components/Layout'
import StatsSummary from '@/components/StatsSummary'
import { EditorialButton, LoadingSpinner } from '@/components/tamagui'
import { LocalStorageService } from '@/services/LocalStorageService'
import { GameStats } from '@/types'

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: 'easeOut' as const, delay: i * 0.05 },
  }),
}

// Anchor with underline-on-hover (replaces the onMouseEnter/Leave style
// mutation); Text types omit anchor DOM attributes, hence the recast.
const SourceLinkFrame = styled(TamaguiText, {
  tag: 'a',
  fontSize: 13,
  color: '$editorialAccent',
  textDecorationLine: 'none',
  fontWeight: '500',

  hoverStyle: {
    textDecorationLine: 'underline',
  },
})

const SourceLink = SourceLinkFrame as unknown as React.ComponentType<
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'color'>
>

export default function Home() {
  const router = useRouter()
  const theme = useTheme()
  const ink = theme.editorialInk?.get() as string
  const muted = theme.editorialMuted?.get() as string
  const accent = theme.editorialAccent?.get() as string
  const accentSubtle = theme.editorialAccentSubtle?.get() as string
  const paper = theme.editorialPaper?.get() as string
  const rule = `1px solid ${theme.editorialRule?.get() as string}`

  const cardStyle: React.CSSProperties = {
    backgroundColor: paper,
    border: rule,
    borderRadius: 6,
    padding: '32px 28px',
    display: 'flex',
    flexDirection: 'column',
  }

  const sectionHeadingStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-serif)', // PHASE5: $fontFamily
    fontSize: 20,
    fontWeight: 500,
    color: ink,
    marginBottom: 20,
    letterSpacing: '-0.01em',
  }

  const dividerStyle: React.CSSProperties = {
    borderTop: rule,
    margin: '0 0 20px',
  }

  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    averageScore: 0,
    bestScore: 0,
    earlyWins: 0,
    earlyFailures: 0
  })
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

    return () => { mounted = false }
  }, [])

  if (isLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
          <LoadingSpinner ring width={28} height={28} durationMs={800} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="US Civics Test">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40, maxWidth: 900, margin: '0 auto' }}>

        {/* Hero */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{ paddingTop: 16, paddingBottom: 8 }}
        >
          <p style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: accent,
            marginBottom: 16,
          }}>
            U.S. Citizenship Practice Test
          </p>
          <h1 style={{
            fontFamily: 'var(--font-family-serif)', // PHASE5: $fontFamily
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: ink,
            marginBottom: 20,
          }}>
            Know Your Country
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.125rem)',
            color: muted,
            lineHeight: 1.65,
            maxWidth: 560,
            marginBottom: 24,
          }}>
            Practice with official USCIS civics questions covering American government,
            history, and civic ideals — the same content used in the naturalization interview.
          </p>
          <p style={{
            fontSize: 13,
            color: muted,
            letterSpacing: '0.01em',
          }}>
            128 questions&ensp;·&ensp;60% to pass&ensp;·&ensp;12 correct answers to win early
          </p>
        </motion.div>

        {/* Hairline rule */}
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <div style={{ borderTop: rule }} />
        </motion.div>

        {/* Action cards */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
            gap: 20,
          }}
        >
          {/* Take the Test */}
          <div style={cardStyle}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 4,
              backgroundColor: accentSubtle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <CheckCircle size={20} color={accent} strokeWidth={1.5} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-family-serif)', // PHASE5: $fontFamily
              fontSize: 22,
              fontWeight: 500,
              color: ink,
              marginBottom: 10,
              letterSpacing: '-0.01em',
            }}>
              Take the Test
            </h2>
            <p style={{
              fontSize: 14,
              color: muted,
              lineHeight: 1.65,
              marginBottom: 24,
              flex: 1,
            }}>
              Start a new civics test with up to 20 questions. Pass with 12 correct answers,
              or the test ends early if you miss 9.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: muted }}>
                <Volume2 size={13} strokeWidth={1.5} /> Audio
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: muted }}>
                <Keyboard size={13} strokeWidth={1.5} /> Keyboard
              </span>
            </div>
            <EditorialButton
              width="100%"
              onPress={() => router.push(hasConfigured ? '/game' : '/settings')}
            >
              Start
            </EditorialButton>
          </div>

          {/* View Results */}
          <div style={cardStyle}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 4,
              backgroundColor: accentSubtle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <BarChart2 size={20} color={accent} strokeWidth={1.5} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-family-serif)', // PHASE5: $fontFamily
              fontSize: 22,
              fontWeight: 500,
              color: ink,
              marginBottom: 10,
              letterSpacing: '-0.01em',
            }}>
              View Results
            </h2>
            <p style={{
              fontSize: 14,
              color: muted,
              lineHeight: 1.65,
              marginBottom: 24,
              flex: 1,
            }}>
              Review past tests, track your progress over time, and see detailed statistics
              about your civics knowledge.
            </p>
            <EditorialButton
              ghost
              width="100%"
              marginTop="auto"
              onPress={() => router.push('/results')}
            >
              View Results
            </EditorialButton>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
          <StatsSummary stats={stats} />
        </motion.div>

        {/* About */}
        <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}>
          <div style={{ borderTop: rule, paddingTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <BookOpen size={16} color={muted} strokeWidth={1.5} />
              <h3 style={sectionHeadingStyle}>About the Test</h3>
            </div>
            <div style={{ borderTop: rule, marginBottom: 0 }} />
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 0,
            }}>
              {[
                {
                  title: 'Test Format',
                  items: [
                    'Up to 20 questions from a pool of 128',
                    'Pass with 12 correct answers (60%)',
                    'Questions from 2025 USCIS civics test',
                    'Version M-1778 (09/25)',
                  ]
                },
                {
                  title: 'Topics Covered',
                  items: [
                    'American Government',
                    'American History',
                    'Symbols and Holidays',
                  ]
                },
                {
                  title: 'Dynamic Content',
                  items: [
                    'Current senators and representatives',
                    'Updated from official government sources',
                    'Track your progress over time',
                  ]
                },
              ].map((section) => (
                <div key={section.title} style={{
                  padding: '20px 0',
                  borderBottom: rule,
                }}>
                  <h4 style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: accent,
                    marginBottom: 12,
                  }}>
                    {section.title}
                  </h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {section.items.map((item) => (
                      <li key={item} style={{ fontSize: 13, color: muted, lineHeight: 1.5 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Official Sources */}
        <motion.div custom={5} initial="hidden" animate="visible" variants={fadeUp}>
          <div style={{ borderTop: rule, paddingTop: 32 }}>
            <h3 style={sectionHeadingStyle}>Official Sources</h3>
            <div style={dividerStyle} />
            <p style={{ fontSize: 13, color: muted, marginBottom: 16, lineHeight: 1.6 }}>
              All questions and political data are sourced directly from official U.S. government websites.
            </p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                {
                  href: 'https://www.uscis.gov/sites/default/files/document/questions-and-answers/2025-Civics-Test-128-Questions-and-Answers.pdf',
                  label: 'USCIS 128 Civics Questions (2025)',
                  desc: 'Official 2025 test questions for naturalization',
                },
                {
                  href: 'https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates',
                  label: 'USCIS Test Updates',
                  desc: 'Current test changes and updates',
                },
                {
                  href: 'https://www.senate.gov/senators/',
                  label: 'U.S. Senate',
                  desc: 'Current senators by state',
                },
                {
                  href: 'https://www.house.gov/representatives',
                  label: 'U.S. House of Representatives',
                  desc: 'Current representatives by district',
                },
                {
                  href: 'https://www.usa.gov/state-governments',
                  label: 'USA.gov State Governments',
                  desc: 'State government information and governors',
                },
              ].map(({ href, label, desc }) => (
                <li key={href} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  paddingBottom: 10,
                  borderBottom: rule,
                }}>
                  <SourceLink href={href} target="_blank" rel="noopener noreferrer">
                    {label}
                  </SourceLink>
                  <span style={{ fontSize: 12, color: muted }}>{desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

      </div>
    </Layout>
  )
}
