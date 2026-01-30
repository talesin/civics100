'use client'

import React, { useState, useEffect } from 'react'
import { Effect } from 'effect'
import Layout from '@/components/Layout'
import StatsSummary from '@/components/StatsSummary'
import { LocalStorageService } from '@/services/LocalStorageService'
import { useThemeContext } from '@/components/TamaguiProvider'
import { GameResult, GameStats } from '@/types'

// Theme-aware colors
const themeColors = {
  light: {
    text: '#111827',
    textMuted: '#4b5563',
    textLight: '#6b7280',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    iconBg: '#f3f4f6',
    badgeOrangeBg: '#ffedd5',
    badgeOrangeText: '#9a3412',
    badgeYellowBg: '#fef9c3',
    badgeYellowText: '#854d0e',
    badgeGreenBg: '#dcfce7',
    badgeGreenText: '#166534',
    badgeRedBg: '#fee2e2',
    badgeRedText: '#991b1b',
    scoreGreen: '#16a34a',
    scoreBlue: '#2563eb',
    scoreRed: '#dc2626',
    hoverBg: '#f9fafb',
    circleStroke: '#e5e7eb',
  },
  dark: {
    text: '#ffffff',
    textMuted: '#d1d5db',
    textLight: '#9ca3af',
    cardBg: '#1f2937',
    cardBorder: '#374151',
    iconBg: '#374151',
    badgeOrangeBg: 'rgba(154, 52, 18, 0.3)',
    badgeOrangeText: '#fed7aa',
    badgeYellowBg: 'rgba(133, 77, 14, 0.3)',
    badgeYellowText: '#fef08a',
    badgeGreenBg: 'rgba(22, 101, 52, 0.3)',
    badgeGreenText: '#86efac',
    badgeRedBg: 'rgba(153, 27, 27, 0.3)',
    badgeRedText: '#fecaca',
    scoreGreen: '#4ade80',
    scoreBlue: '#60a5fa',
    scoreRed: '#f87171',
    hoverBg: '#374151',
    circleStroke: '#4b5563',
  },
}

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
  const { theme } = useThemeContext()
  const colors = themeColors[theme]

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

  const getBadgeStyles = (result: GameResult): { bg: string; text: string; label: string } => {
    if (result.isEarlyFail === true) {
      return { bg: colors.badgeOrangeBg, text: colors.badgeOrangeText, label: 'Early Fail' }
    } else if (result.isEarlyWin === true) {
      return { bg: colors.badgeYellowBg, text: colors.badgeYellowText, label: 'Early Win' }
    } else if (result.percentage >= 60) {
      return { bg: colors.badgeGreenBg, text: colors.badgeGreenText, label: 'Passed' }
    } else {
      return { bg: colors.badgeRedBg, text: colors.badgeRedText, label: 'Failed' }
    }
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return colors.scoreGreen
    if (percentage >= 60) return colors.scoreBlue
    return colors.scoreRed
  }

  if (isLoading) {
    return (
      <Layout title="Loading Results...">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 384 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '2px solid transparent',
            borderBottomColor: '#2563eb',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Test Results">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: 30, fontWeight: 'bold', color: colors.text }}>Your Test Results</h1>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={() => (window.location.href = '/statistics')}
              style={{
                backgroundColor: '#9333ea',
                color: 'white',
                fontWeight: 500,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7c3aed'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9333ea'}
            >
              View Question Stats
            </button>
            <button
              onClick={() => (window.location.href = '/game')}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 500,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Take New Test
            </button>
            {(results.length > 0) === true ? (
              <button
                onClick={handleClearData}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  fontWeight: 500,
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#b91c1c'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
              >
                Clear All Data
              </button>
            ) : null}
          </div>
        </div>

        <StatsSummary stats={stats} />

        {results.length === 0 ? (
          <div style={{
            backgroundColor: colors.cardBg,
            borderRadius: 8,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            padding: 32,
            textAlign: 'center'
          }}>
            <div style={{
              width: 64,
              height: 64,
              backgroundColor: colors.iconBg,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <svg
                style={{ width: 32, height: 32, color: '#9ca3af' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 600, color: colors.text, marginBottom: 8 }}>
              No Test Results Yet
            </h3>
            <p style={{ color: colors.textMuted, marginBottom: 24 }}>
              You haven&apos;t taken any civics tests yet. Take your first test to see your results
              here.
            </p>
            <button
              onClick={() => (window.location.href = '/game')}
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: 500,
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            >
              Take Your First Test
            </button>
          </div>
        ) : (
          <div style={{
            backgroundColor: colors.cardBg,
            borderRadius: 8,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: `1px solid ${colors.cardBorder}`
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: colors.text }}>
                Test History ({results.length} tests)
              </h3>
            </div>
            <div>
              {results.map((result, index) => {
                const badge = getBadgeStyles(result)
                return (
                  <div
                    key={result.sessionId}
                    style={{
                      padding: '16px 24px',
                      borderBottom: index < results.length - 1 ? `1px solid ${colors.cardBorder}` : undefined,
                      transition: 'background-color 0.15s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = colors.hoverBg}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 14, fontWeight: 500, color: colors.text }}>
                            Test #{results.length - index}
                          </span>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '2px 10px',
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 500,
                            backgroundColor: badge.bg,
                            color: badge.text
                          }}>
                            {badge.label}
                          </span>
                          <span style={{ fontSize: 12, color: colors.textLight }}>
                            {result.completedAt.toLocaleDateString()} at{' '}
                            {result.completedAt.toLocaleTimeString()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24, fontSize: 14 }}>
                          <span style={{ fontWeight: 600, color: getScoreColor(result.percentage) }}>
                            {result.percentage}%
                          </span>
                          <span style={{ color: colors.textMuted }}>
                            {result.correctAnswers}/{result.totalQuestions} correct
                          </span>
                          {result.isEarlyWin === true ? (
                            <span style={{ color: theme === 'dark' ? '#facc15' : '#ca8a04', fontSize: 12 }}>
                              ⭐ Early completion
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        <div style={{
                          width: 64,
                          height: 64,
                          borderRadius: '50%',
                          border: `4px solid ${colors.circleStroke}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative'
                        }}>
                          <svg style={{ width: 64, height: 64, transform: 'rotate(-90deg)', position: 'absolute' }} viewBox="0 0 36 36">
                            <path
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              fill="none"
                              stroke={result.percentage >= 60 ? '#22c55e' : '#ef4444'}
                              strokeWidth="3"
                              strokeDasharray={`${result.percentage}, 100`}
                            />
                          </svg>
                          <span style={{
                            fontSize: 12,
                            fontWeight: 'bold',
                            color: getScoreColor(result.percentage),
                            position: 'relative',
                            zIndex: 1
                          }}>
                            {result.percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
