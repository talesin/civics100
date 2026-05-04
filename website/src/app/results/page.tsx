'use client'

import React, { useState, useEffect } from 'react'
import { Effect } from 'effect'
import Layout from '@/components/Layout'
import StatsSummary from '@/components/StatsSummary'
import { LocalStorageService } from '@/services/LocalStorageService'
import { GameResult, GameStats } from '@/types'
import { Star, FileText } from 'lucide-react'

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

  const getBadgeClass = (result: GameResult): string => {
    if (result.isEarlyFail === true || result.isEarlyWin === true) return 'badge badge-warn'
    if (result.percentage >= 60) return 'badge badge-pass'
    return 'badge badge-fail'
  }

  const getBadgeLabel = (result: GameResult): string => {
    if (result.isEarlyFail === true) return 'Early Fail'
    if (result.isEarlyWin === true) return 'Early Win'
    if (result.percentage >= 60) return 'Passed'
    return 'Failed'
  }

  if (isLoading) {
    return (
      <Layout title="Loading Results...">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 384 }}>
          <div className="spinner" />
        </div>
      </Layout>
    )
  }

  const eyebrowStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--editorial-accent)',
    marginBottom: 10,
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-serif)',
    fontSize: 22,
    fontWeight: 500,
    color: 'var(--editorial-ink)',
    letterSpacing: '-0.01em',
  }

  const clearButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: '6px 4px',
    fontSize: 13,
    color: 'var(--editorial-muted)',
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
            <h1 style={{ fontFamily: 'var(--font-family-serif)', fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 500, color: 'var(--editorial-ink)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Your Test Results
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => (window.location.href = '/statistics')}
              className="btn-editorial-ghost focus-ring"
            >
              View Question Stats
            </button>
            <button
              onClick={() => (window.location.href = '/game')}
              className="btn-editorial focus-ring"
            >
              Take New Test
            </button>
          </div>
        </div>

        <StatsSummary stats={stats} />

        {results.length === 0 ? (
          <div style={{ borderTop: '1px solid var(--editorial-rule)', padding: '48px 16px 16px', textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              backgroundColor: 'var(--editorial-accent-subtle)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <FileText size={26} strokeWidth={1.5} color="var(--editorial-accent)" />
            </div>
            <p style={{ ...eyebrowStyle, marginBottom: 8 }}>Archive</p>
            <h3 style={{ ...sectionTitleStyle, marginBottom: 10 }}>
              No Test Results Yet
            </h3>
            <p style={{ color: 'var(--editorial-muted)', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
              You haven&apos;t taken any civics tests yet. Take your first test to see your results here.
            </p>
            <button
              onClick={() => (window.location.href = '/game')}
              className="btn-editorial focus-ring"
            >
              Take Your First Test
            </button>
          </div>
        ) : (
          <div>
            <div style={{ borderTop: '1px solid var(--editorial-rule)', paddingTop: 20, marginBottom: 0 }}>
              <p style={eyebrowStyle}>Archive · {results.length} {results.length === 1 ? 'Test' : 'Tests'}</p>
              <h3 style={{ ...sectionTitleStyle, marginBottom: 16 }}>Test History</h3>
              <div style={{ borderTop: '1px solid var(--editorial-rule)' }} />
            </div>
            <div>
              {results.map((result, index) => (
                <div
                  key={result.sessionId}
                  style={{
                    padding: '18px 0',
                    borderBottom: '1px solid var(--editorial-rule)',
                  }}
                  className="results-row"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--editorial-ink)', letterSpacing: '0.02em' }}>
                          Test #{results.length - index}
                        </span>
                        <span className={getBadgeClass(result)}>
                          {getBadgeLabel(result)}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--editorial-muted)' }}>
                          {result.completedAt.toLocaleDateString()} at{' '}
                          {result.completedAt.toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, fontSize: 14, flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: 'var(--font-family-serif)',
                          fontSize: 24,
                          fontWeight: 500,
                          color: result.percentage >= 60 ? 'var(--editorial-ink)' : 'var(--theme-error)',
                          letterSpacing: '-0.02em',
                          lineHeight: 1,
                        }}>
                          {result.percentage}%
                        </span>
                        <span style={{ color: 'var(--editorial-muted)', fontSize: 13 }}>
                          {result.correctAnswers}/{result.totalQuestions} correct
                        </span>
                        {result.isEarlyWin === true ? (
                          <span style={{ color: 'var(--editorial-accent)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
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
                          stroke="var(--editorial-rule)"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={result.percentage >= 60 ? 'var(--editorial-accent)' : 'var(--theme-error)'}
                          strokeWidth="2"
                          strokeDasharray={`${result.percentage}, 100`}
                        />
                      </svg>
                      <span style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontFamily: 'var(--font-family-serif)',
                        fontSize: 11,
                        fontWeight: 500,
                        color: 'var(--editorial-ink)',
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
