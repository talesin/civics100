'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Effect } from 'effect'
import { motion } from 'framer-motion'
import { CheckCircle, BarChart2, BookOpen, Keyboard, Volume2 } from 'lucide-react'
import Layout from '@/components/Layout'
import StatsSummary from '@/components/StatsSummary'
import { LocalStorageService } from '@/services/LocalStorageService'
import { GameStats } from '@/types'

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: 'easeOut', delay: i * 0.05 },
  }),
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--editorial-paper)',
  border: '1px solid var(--editorial-rule)',
  borderRadius: 6,
  padding: '32px 28px',
  display: 'flex',
  flexDirection: 'column',
}

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-family-serif)',
  fontSize: 20,
  fontWeight: 500,
  color: 'var(--editorial-ink)',
  marginBottom: 20,
  letterSpacing: '-0.01em',
}

const dividerStyle: React.CSSProperties = {
  borderTop: '1px solid var(--editorial-rule)',
  margin: '0 0 20px',
}

export default function Home() {
  const router = useRouter()
  const [stats, setStats] = useState<GameStats>({
    totalGames: 0,
    averageScore: 0,
    bestScore: 0,
    earlyWins: 0,
    earlyFailures: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadStats = Effect.gen(function* () {
      const storageService = yield* LocalStorageService
      const gameStats = yield* storageService.getGameStats()
      if (mounted) {
        setStats(gameStats)
        setIsLoading(false)
      }
    })

    Effect.runPromise(loadStats.pipe(Effect.provide(LocalStorageService.Default))).catch(
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
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '2px solid var(--editorial-rule)',
            borderTopColor: 'var(--editorial-accent)',
            animation: 'spin 0.8s linear infinite'
          }} />
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
            color: 'var(--editorial-accent)',
            marginBottom: 16,
          }}>
            U.S. Citizenship Practice Test
          </p>
          <h1 style={{
            fontFamily: 'var(--font-family-serif)',
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: 500,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            color: 'var(--editorial-ink)',
            marginBottom: 20,
          }}>
            Know Your Country
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.125rem)',
            color: 'var(--editorial-muted)',
            lineHeight: 1.65,
            maxWidth: 560,
            marginBottom: 24,
          }}>
            Practice with official USCIS civics questions covering American government,
            history, and civic ideals — the same content used in the naturalization interview.
          </p>
          <p style={{
            fontSize: 13,
            color: 'var(--editorial-muted)',
            letterSpacing: '0.01em',
          }}>
            128 questions&ensp;·&ensp;60% to pass&ensp;·&ensp;12 correct answers to win early
          </p>
        </motion.div>

        {/* Hairline rule */}
        <motion.div custom={1} initial="hidden" animate="visible" variants={fadeUp}>
          <div style={{ borderTop: '1px solid var(--editorial-rule)' }} />
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
              backgroundColor: 'var(--editorial-accent-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <CheckCircle size={20} color="var(--editorial-accent)" strokeWidth={1.5} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-family-serif)',
              fontSize: 22,
              fontWeight: 500,
              color: 'var(--editorial-ink)',
              marginBottom: 10,
              letterSpacing: '-0.01em',
            }}>
              Take the Test
            </h2>
            <p style={{
              fontSize: 14,
              color: 'var(--editorial-muted)',
              lineHeight: 1.65,
              marginBottom: 24,
              flex: 1,
            }}>
              Start a new civics test with up to 20 questions. Pass with 12 correct answers,
              or the test ends early if you miss 9.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--editorial-muted)' }}>
                <Volume2 size={13} strokeWidth={1.5} /> Audio
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--editorial-muted)' }}>
                <Keyboard size={13} strokeWidth={1.5} /> Keyboard
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => router.push('/settings')}
                className="btn-primary focus-ring"
                style={{
                  width: '100%',
                  padding: '11px 20px',
                  borderRadius: 5,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: 'pointer',
                }}
              >
                Customize &amp; Start
              </button>
              <button
                onClick={() => router.push('/game')}
                className="btn-secondary focus-ring"
                style={{
                  width: '100%',
                  padding: '9px 16px',
                  borderRadius: 5,
                  fontWeight: 500,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Quick Start
              </button>
            </div>
          </div>

          {/* View Results */}
          <div style={cardStyle}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 4,
              backgroundColor: 'var(--editorial-accent-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}>
              <BarChart2 size={20} color="var(--editorial-accent)" strokeWidth={1.5} />
            </div>
            <h2 style={{
              fontFamily: 'var(--font-family-serif)',
              fontSize: 22,
              fontWeight: 500,
              color: 'var(--editorial-ink)',
              marginBottom: 10,
              letterSpacing: '-0.01em',
            }}>
              View Results
            </h2>
            <p style={{
              fontSize: 14,
              color: 'var(--editorial-muted)',
              lineHeight: 1.65,
              marginBottom: 24,
              flex: 1,
            }}>
              Review past tests, track your progress over time, and see detailed statistics
              about your civics knowledge.
            </p>
            <button
              onClick={() => router.push('/results')}
              className="btn-primary focus-ring"
              style={{
                width: '100%',
                padding: '11px 20px',
                borderRadius: 5,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                marginTop: 'auto',
              }}
            >
              View Results
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div custom={3} initial="hidden" animate="visible" variants={fadeUp}>
          <StatsSummary stats={stats} />
        </motion.div>

        {/* About */}
        <motion.div custom={4} initial="hidden" animate="visible" variants={fadeUp}>
          <div style={{ borderTop: '1px solid var(--editorial-rule)', paddingTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <BookOpen size={16} color="var(--editorial-muted)" strokeWidth={1.5} />
              <h3 style={sectionHeadingStyle}>About the Test</h3>
            </div>
            <div style={{ borderTop: '1px solid var(--editorial-rule)', marginBottom: 0 }} />
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
                  borderBottom: '1px solid var(--editorial-rule)',
                }}>
                  <h4 style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--editorial-accent)',
                    marginBottom: 12,
                  }}>
                    {section.title}
                  </h4>
                  <ul style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {section.items.map((item) => (
                      <li key={item} style={{ fontSize: 13, color: 'var(--editorial-muted)', lineHeight: 1.5 }}>
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
          <div style={{ borderTop: '1px solid var(--editorial-rule)', paddingTop: 32 }}>
            <h3 style={sectionHeadingStyle}>Official Sources</h3>
            <div style={dividerStyle} />
            <p style={{ fontSize: 13, color: 'var(--editorial-muted)', marginBottom: 16, lineHeight: 1.6 }}>
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
                  borderBottom: '1px solid var(--editorial-rule)',
                }}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      color: 'var(--editorial-accent)',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.textDecoration = 'underline')}
                    onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.textDecoration = 'none')}
                  >
                    {label}
                  </a>
                  <span style={{ fontSize: 12, color: 'var(--editorial-muted)' }}>{desc}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

      </div>
    </Layout>
  )
}
