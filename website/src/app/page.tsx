'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Effect } from 'effect'
import Layout from '@/components/Layout'
import StatsSummary from '@/components/StatsSummary'
import { LocalStorageService } from '@/services/LocalStorageService'
import { GameStats } from '@/types'
import { useThemeContext, themeColors } from '@/components/TamaguiProvider'

// Extended theme colors for home page specific UI
const homeThemeColors = {
  light: {
    textLight: '#6b7280',     // gray-500
    badgeBlueBg: '#eff6ff',   // blue-50
    badgeBlueText: '#1d4ed8', // blue-700
    badgeGreenBg: '#f0fdf4',  // green-50
    badgeGreenText: '#15803d', // green-700
    badgePurpleBg: '#faf5ff', // purple-50
    badgePurpleText: '#7c3aed', // purple-700
    link: '#2563eb',          // blue-600
  },
  dark: {
    textLight: '#9ca3af',     // gray-400
    badgeBlueBg: 'rgba(30, 64, 175, 0.2)',
    badgeBlueText: '#93c5fd', // blue-300
    badgeGreenBg: 'rgba(21, 128, 61, 0.2)',
    badgeGreenText: '#86efac', // green-300
    badgePurpleBg: 'rgba(124, 58, 237, 0.2)',
    badgePurpleText: '#c4b5fd', // purple-300
    link: '#60a5fa',          // blue-400
  },
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
  const { theme } = useThemeContext()
  const baseColors = themeColors[theme]
  const homeColors = homeThemeColors[theme]
  const colors = { ...baseColors, ...homeColors }

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

    return () => {
      mounted = false
    }
  }, [])

  const handleStartGame = () => {
    router.push('/settings')
  }

  const handleQuickStart = () => {
    router.push('/game')
  }

  const handleViewResults = () => {
    router.push('/results')
  }

  if (isLoading) {
    return (
      <Layout>
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
    <Layout title="US Civics Test">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <div className="animate-bounce-in" style={{
              width: 80,
              height: 80,
              background: 'linear-gradient(to bottom right, #2563eb, #dc2626)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
              <span style={{ color: 'white', fontSize: 30 }}>🇺🇸</span>
            </div>
            <h1 className="text-gradient" style={{
              fontSize: 'clamp(2.25rem, 5vw, 3.75rem)',
              fontWeight: 'bold',
              color: colors.text,
              marginBottom: 16
            }}>
              US Civics Test
            </h1>
            <p className="text-balance" style={{
              fontSize: 'clamp(1.125rem, 2vw, 1.25rem)',
              color: colors.textMuted,
              marginBottom: 32,
              maxWidth: 768,
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              Test your knowledge of American civics and history. Answer questions about the
              Constitution, government structure, and American history to see if you can pass the
              citizenship test.
            </p>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 8,
            fontSize: 14,
            color: colors.textLight,
            marginBottom: 32
          }}>
            <span style={{
              backgroundColor: colors.badgeBlueBg,
              color: colors.badgeBlueText,
              padding: '4px 12px',
              borderRadius: 9999
            }}>
              📚 128 Questions
            </span>
            <span style={{
              backgroundColor: colors.badgeGreenBg,
              color: colors.badgeGreenText,
              padding: '4px 12px',
              borderRadius: 9999
            }}>
              ✅ 60% to Pass
            </span>
            <span style={{
              backgroundColor: colors.badgePurpleBg,
              color: colors.badgePurpleText,
              padding: '4px 12px',
              borderRadius: 9999
            }}>
              ⚡ 12 Early Win
            </span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
          gap: 24,
          marginBottom: 32
        }}>
          <div className="card card-interactive">
            <div style={{ marginBottom: 24 }}>
              <div style={{
                width: 64,
                height: 64,
                background: 'linear-gradient(to bottom right, #3b82f6, #2563eb)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}>
                <svg
                  style={{ width: 32, height: 32, color: 'white' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: 12
              }}>
                Take the Test
              </h2>
              <p className="text-balance" style={{
                color: colors.textMuted,
                marginBottom: 24
              }}>
                Start a new civics test with up to 20 questions (configurable in settings). You need
                12 correct answers (60%) to pass, or you can continue to answer all 20 questions.
                Note: The test will automatically end if you answer 9 questions incorrectly.
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: 'center',
                marginBottom: 24
              }}>
                <span style={{
                  fontSize: 12,
                  backgroundColor: colors.badgeBlueBg,
                  color: colors.badgeBlueText,
                  padding: '4px 8px',
                  borderRadius: 4
                }}>
                  🎯 Interactive
                </span>
                <span style={{
                  fontSize: 12,
                  backgroundColor: colors.badgeBlueBg,
                  color: colors.badgeBlueText,
                  padding: '4px 8px',
                  borderRadius: 4
                }}>
                  🔊 Audio Feedback
                </span>
                <span style={{
                  fontSize: 12,
                  backgroundColor: colors.badgeBlueBg,
                  color: colors.badgeBlueText,
                  padding: '4px 8px',
                  borderRadius: 4
                }}>
                  ⌨️ Keyboard Support
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={handleStartGame}
                className="btn-primary focus-ring"
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 16,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                Customize & Start Test
              </button>
              <button
                onClick={handleQuickStart}
                className="btn-secondary focus-ring"
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontWeight: 500,
                  fontSize: 14,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              >
                Quick Start (Default Settings)
              </button>
            </div>
          </div>

          <div className="card card-interactive">
            <div style={{ marginBottom: 24 }}>
              <div style={{
                width: 64,
                height: 64,
                background: 'linear-gradient(to bottom right, #22c55e, #16a34a)',
                borderRadius: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}>
                <svg
                  style={{ width: 32, height: 32, color: 'white' }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 style={{
                fontSize: 24,
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: 12
              }}>
                View Results
              </h2>
              <p className="text-balance" style={{
                color: colors.textMuted,
                marginBottom: 24
              }}>
                Review your past test results, track your progress, and see detailed statistics
                about your civics knowledge.
              </p>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                justifyContent: 'center',
                marginBottom: 24
              }}>
                <span style={{
                  fontSize: 12,
                  backgroundColor: colors.badgeGreenBg,
                  color: colors.badgeGreenText,
                  padding: '4px 8px',
                  borderRadius: 4
                }}>
                  📊 Statistics
                </span>
                <span style={{
                  fontSize: 12,
                  backgroundColor: colors.badgeGreenBg,
                  color: colors.badgeGreenText,
                  padding: '4px 8px',
                  borderRadius: 4
                }}>
                  📈 Progress Tracking
                </span>
                <span style={{
                  fontSize: 12,
                  backgroundColor: colors.badgeGreenBg,
                  color: colors.badgeGreenText,
                  padding: '4px 8px',
                  borderRadius: 4
                }}>
                  🏆 Achievements
                </span>
              </div>
            </div>
            <button
              onClick={handleViewResults}
              className="btn-success focus-ring"
              style={{
                width: '100%',
                padding: '12px 24px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 16,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              View Results
            </button>
          </div>
        </div>

        <StatsSummary stats={stats} />

        <div style={{
          backgroundColor: colors.cardBg,
          borderRadius: 8,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          padding: 24
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            color: colors.text,
            marginBottom: 16
          }}>
            About the Test
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 24,
            fontSize: 14,
            color: colors.textMuted
          }}>
            <div>
              <h4 style={{ fontWeight: 500, color: colors.text, marginBottom: 8 }}>Test Format</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>• Up to 20 questions from pool of 128</li>
                <li>• Pass with 12 correct answers (60%)</li>
                <li>• Questions from 2025 USCIS civics test</li>
                <li>• Version M-1778 (09/25)</li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 500, color: colors.text, marginBottom: 8 }}>Topics Covered</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>• American Government</li>
                <li>• American History</li>
                <li>• Symbols and Holidays</li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 500, color: colors.text, marginBottom: 8 }}>Dynamic Content</h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li>• Current senators and representatives</li>
                <li>• Updated from official government sources</li>
                <li>• Track your progress over time</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{
          backgroundColor: colors.cardBg,
          borderRadius: 8,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          padding: 24
        }}>
          <h3 style={{
            fontSize: 18,
            fontWeight: 600,
            color: colors.text,
            marginBottom: 16
          }}>
            Official Sources
          </h3>
          <div style={{ fontSize: 14, color: colors.textMuted }}>
            <p style={{ marginBottom: 12 }}>
              All test questions and state-specific data are sourced from official U.S. government
              websites:
            </p>
            <style>{`
              .source-link { text-decoration: none; }
              .source-link:hover { text-decoration: underline; }
            `}</style>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>
                •{' '}
                <a
                  href="https://www.uscis.gov/sites/default/files/document/questions-and-answers/2025-Civics-Test-128-Questions-and-Answers.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.link }}
                  className="source-link"
                >
                  USCIS 128 Civics Questions (2025)
                </a>{' '}
                - Official 2025 test questions for naturalization
              </li>
              <li>
                •{' '}
                <a
                  href="https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.link }}
                  className="source-link"
                >
                  USCIS Test Updates
                </a>{' '}
                - Current test changes and updates
              </li>
              <li>
                •{' '}
                <a
                  href="https://www.senate.gov/senators/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.link }}
                  className="source-link"
                >
                  U.S. Senate
                </a>{' '}
                - Current senators by state
              </li>
              <li>
                •{' '}
                <a
                  href="https://www.house.gov/representatives"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.link }}
                  className="source-link"
                >
                  U.S. House of Representatives
                </a>{' '}
                - Current representatives by district
              </li>
              <li>
                •{' '}
                <a
                  href="https://www.usa.gov/state-governments"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: colors.link }}
                  className="source-link"
                >
                  USA.gov State Governments
                </a>{' '}
                - State government information and governors
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  )
}
