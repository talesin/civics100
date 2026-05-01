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

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return 'var(--theme-success)'
    if (percentage >= 60) return 'var(--theme-primary)'
    return 'var(--theme-error)'
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

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'var(--theme-card-bg)',
    border: '1px solid var(--editorial-rule)',
    borderRadius: 8,
  }

  return (
    <Layout title="Test Results">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontFamily: 'var(--font-family-serif)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 500, color: 'var(--editorial-ink)', letterSpacing: '-0.01em' }}>
            Your Test Results
          </h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => (window.location.href = '/statistics')}
              className="btn-purple focus-ring"
              style={{ padding: '7px 14px', borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: 'pointer' }}
            >
              View Question Stats
            </button>
            <button
              onClick={() => (window.location.href = '/game')}
              className="btn-primary focus-ring"
              style={{ padding: '7px 14px', borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: 'pointer' }}
            >
              Take New Test
            </button>
            {results.length > 0 ? (
              <button
                onClick={handleClearData}
                className="btn-error focus-ring"
                style={{ padding: '7px 14px', borderRadius: 6, fontWeight: 500, fontSize: 14, cursor: 'pointer' }}
              >
                Clear All Data
              </button>
            ) : null}
          </div>
        </div>

        <StatsSummary stats={stats} />

        {results.length === 0 ? (
          <div style={{ ...cardStyle, padding: 40, textAlign: 'center' }}>
            <div style={{
              width: 56,
              height: 56,
              backgroundColor: 'var(--editorial-accent-subtle)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <FileText size={28} strokeWidth={1.5} color="var(--editorial-accent)" />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--editorial-ink)', marginBottom: 8 }}>
              No Test Results Yet
            </h3>
            <p style={{ color: 'var(--editorial-muted)', marginBottom: 24 }}>
              You haven&apos;t taken any civics tests yet. Take your first test to see your results here.
            </p>
            <button
              onClick={() => (window.location.href = '/game')}
              className="btn-primary focus-ring"
              style={{ padding: '10px 24px', borderRadius: 6, fontWeight: 500, cursor: 'pointer' }}
            >
              Take Your First Test
            </button>
          </div>
        ) : (
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--editorial-rule)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--editorial-ink)' }}>
                Test History ({results.length} tests)
              </h3>
            </div>
            <div>
              {results.map((result, index) => (
                <div
                  key={result.sessionId}
                  style={{
                    padding: '14px 24px',
                    borderBottom: index < results.length - 1 ? '1px solid var(--editorial-rule)' : undefined,
                  }}
                  className="results-row"
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--editorial-ink)' }}>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 14 }}>
                        <span style={{ fontWeight: 600, color: getScoreColor(result.percentage) }}>
                          {result.percentage}%
                        </span>
                        <span style={{ color: 'var(--editorial-muted)' }}>
                          {result.correctAnswers}/{result.totalQuestions} correct
                        </span>
                        {result.isEarlyWin === true ? (
                          <span style={{ color: 'var(--theme-warning)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <Star size={12} strokeWidth={1.5} />
                            Early completion
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, position: 'relative', width: 56, height: 56 }}>
                      <svg style={{ width: 56, height: 56, transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }} viewBox="0 0 36 36">
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="var(--editorial-rule)"
                          strokeWidth="3"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={result.percentage >= 60 ? 'var(--theme-success)' : 'var(--theme-error)'}
                          strokeWidth="3"
                          strokeDasharray={`${result.percentage}, 100`}
                        />
                      </svg>
                      <span style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: getScoreColor(result.percentage),
                      }}>
                        {result.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
