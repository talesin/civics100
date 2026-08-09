'use client'

import React, { useState, useEffect } from 'react'
import { Effect } from 'effect'
import { styled, useTheme } from 'tamagui'
import Layout from '@/components/Layout'
import StatsSummary from '@/components/StatsSummary'
import { EditorialButton, LoadingSpinner, Text } from '@/components/tamagui'
import { LocalStorageService } from '@/services/LocalStorageService'
import { GameResult, GameStats } from '@/types'
import { Star, FileText } from 'app/components'

// Port of .badge/.badge-pass/.badge-fail/.badge-warn (globals.css).
const ResultBadge = styled(Text, {
  tag: 'span',
  display: 'inline-flex',
  paddingVertical: 2,
  paddingHorizontal: 10,
  borderRadius: 9999,
  fontSize: 12,
  fontWeight: '500',

  variants: {
    result: {
      pass: {
        backgroundColor: '$themeSuccessBg',
        color: '$themeSuccessText',
      },
      fail: {
        backgroundColor: '$themeErrorBg',
        color: '$themeErrorText',
      },
      warn: {
        backgroundColor: '$themeWarningBg',
        color: '$themeWarningText',
      },
    },
  } as const,
})

type BadgeResult = 'pass' | 'fail' | 'warn'

export default function Results() {
  const [results, setResults] = useState<GameResult[]>([])
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
    if (confirm('Are you sure you want to clear all your test results? This cannot be undone.')) {
      const clearData = Effect.gen(function* () {
        const storageService = yield* LocalStorageService
        yield* storageService.clearAllData()
        setResults([])
        setStats({
          totalGames: 0,
          averageScore: 0,
          bestScore: 0,
          earlyWins: 0,
          earlyFailures: 0
        })
      })

      Effect.runPromise(clearData.pipe(Effect.provide(LocalStorageService.Default))).catch(
        console.error
      )
    }
  }

  const getBadgeResult = (result: GameResult): BadgeResult => {
    if (result.isEarlyFail === true || result.isEarlyWin === true) return 'warn'
    if (result.percentage >= 60) return 'pass'
    return 'fail'
  }

  const getBadgeLabel = (result: GameResult): string => {
    if (result.isEarlyFail === true) return 'Early Fail'
    if (result.isEarlyWin === true) return 'Early Win'
    if (result.percentage >= 60) return 'Passed'
    return 'Failed'
  }

  const theme = useTheme()
  const ink = theme.editorialInk?.get() as string
  const muted = theme.editorialMuted?.get() as string
  const accent = theme.editorialAccent?.get() as string
  const themeError = theme.themeError?.get() as string
  const rule = `1px solid ${theme.editorialRule?.get() as string}`

  if (isLoading) {
    return (
      <Layout title="Loading Results...">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 384 }}>
          <LoadingSpinner />
        </div>
      </Layout>
    )
  }

  const eyebrowStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: accent,
    marginBottom: 10,
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-serif)', // PHASE5: $fontFamily
    fontSize: 22,
    fontWeight: 500,
    color: ink,
    letterSpacing: '-0.01em',
  }

  const clearButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: '6px 4px',
    fontSize: 13,
    color: muted,
    textDecoration: 'underline',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }

  return (
    <Layout title="Test Results">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={eyebrowStyle}>Archive</p>
            <h1 style={{ fontFamily: 'var(--font-family-serif)', fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 500, color: ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}> {/* PHASE5: $fontFamily */}
              Your Test Results
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <EditorialButton ghost onPress={() => (window.location.href = '/statistics')}>
              View Question Stats
            </EditorialButton>
            <EditorialButton onPress={() => (window.location.href = '/game')}>
              Take New Test
            </EditorialButton>
          </div>
        </div>

        <StatsSummary stats={stats} />

        {results.length === 0 ? (
          <div style={{ borderTop: rule, padding: '48px 16px 16px', textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              backgroundColor: theme.editorialAccentSubtle?.get() as string,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <FileText size={26} strokeWidth={1.5} color={accent} />
            </div>
            <p style={{ ...eyebrowStyle, marginBottom: 8 }}>Archive</p>
            <h3 style={{ ...sectionTitleStyle, marginBottom: 10 }}>
              No Test Results Yet
            </h3>
            <p style={{ color: muted, marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
              You haven&apos;t taken any civics tests yet. Take your first test to see your results here.
            </p>
            <EditorialButton onPress={() => (window.location.href = '/game')}>
              Take Your First Test
            </EditorialButton>
          </div>
        ) : (
          <div>
            <div style={{ borderTop: rule, paddingTop: 20, marginBottom: 0 }}>
              <p style={eyebrowStyle}>Archive · {results.length} {results.length === 1 ? 'Test' : 'Tests'}</p>
              <h3 style={{ ...sectionTitleStyle, marginBottom: 16 }}>Test History</h3>
              <div style={{ borderTop: rule }} />
            </div>
            <div>
              {results.map((result, index) => (
                <div
                  key={result.sessionId}
                  style={{
                    padding: '18px 0',
                    borderBottom: rule,
                  }}
                  className="results-row"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: ink, letterSpacing: '0.02em' }}>
                          Test #{results.length - index}
                        </span>
                        <ResultBadge result={getBadgeResult(result)}>
                          {getBadgeLabel(result)}
                        </ResultBadge>
                        <span style={{ fontSize: 12, color: muted }}>
                          {result.completedAt.toLocaleDateString()} at{' '}
                          {result.completedAt.toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, fontSize: 14, flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: 'var(--font-family-serif)', // PHASE5: $fontFamily
                          fontSize: 24,
                          fontWeight: 500,
                          color: result.percentage >= 60 ? ink : themeError,
                          letterSpacing: '-0.02em',
                          lineHeight: 1,
                        }}>
                          {result.percentage}%
                        </span>
                        <span style={{ color: muted, fontSize: 13 }}>
                          {result.correctAnswers}/{result.totalQuestions} correct
                        </span>
                        {result.isEarlyWin === true ? (
                          <span style={{ color: accent, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Star size={12} strokeWidth={1.5} />
                            Early completion
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, position: 'relative', width: 52, height: 52 }}>
                      <svg style={{ width: 52, height: 52, transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }} viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={theme.editorialRule?.get() as string}
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={result.percentage >= 60 ? accent : themeError}
                          strokeWidth="2"
                          strokeDasharray={`${result.percentage}, 100`}
                        />
                      </svg>
                      <span style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'var(--font-family-serif)', // PHASE5: $fontFamily
                        fontSize: 11,
                        fontWeight: 500,
                        color: ink,
                      }}>
                        {result.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleClearData} className="focus-ring" style={clearButtonStyle}>
                Clear all data
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
