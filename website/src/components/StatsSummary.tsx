import React, { useEffect, useState } from 'react'
import { GameStats } from '@/types'
import { TrendingUp } from 'app/components'
import { useTheme } from 'tamagui'

interface StatsSummaryProps {
  readonly stats: GameStats
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(value)

  useEffect(() => {
    const start = display
    const delta = value - start
    if (delta === 0) return
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

  return <span>{display}{suffix}</span>
}

// Kept as a native div/span grid: the stat strip needs CSS grid auto-fit and
// clamp() type sizing, which Tamagui props can't express. Theme colors are
// resolved with useTheme().get() so nothing here reads design-tokens.css.
export default function StatsSummary({ stats }: StatsSummaryProps) {
  const theme = useTheme()
  const ink = theme.editorialInk?.get() as string
  const muted = theme.editorialMuted?.get() as string
  const accent = theme.editorialAccent?.get() as string
  const rule = `1px solid ${theme.editorialRule?.get() as string}`

  const sectionHeadingStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-serif)', // PHASE5: $fontFamily
    fontSize: 20,
    fontWeight: 500,
    color: ink,
    letterSpacing: '-0.01em',
  }

  const statValueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-family-serif)', // PHASE5: $fontFamily
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 400,
    lineHeight: 1,
    letterSpacing: '-0.02em',
    color: ink,
    display: 'block',
    marginBottom: 6,
  }

  const statLabelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: muted,
  }

  if (stats.totalGames === 0) {
    return (
      <div style={{
        borderTop: rule,
        paddingTop: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <TrendingUp size={16} color={muted} strokeWidth={1.5} />
          <h3 style={sectionHeadingStyle}>Your Statistics</h3>
        </div>
        <div style={{ borderTop: rule, paddingTop: 20 }}>
          <p style={{ fontSize: 14, color: muted }}>
            No tests taken yet. Start your first civics test to track your progress.
          </p>
        </div>
      </div>
    )
  }

  const statItems = [
    { value: stats.totalGames, suffix: '', label: 'Tests Taken' },
    { value: stats.averageScore, suffix: '%', label: 'Average Score', accent: stats.averageScore >= 60 },
    { value: stats.bestScore, suffix: '%', label: 'Best Score', accent: stats.bestScore === 100 },
    { value: stats.earlyWins, suffix: '', label: 'Early Wins' },
    { value: stats.earlyFailures, suffix: '', label: 'Early Failures' },
  ]

  return (
    <div style={{
      borderTop: rule,
      paddingTop: 32,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <TrendingUp size={16} color={muted} strokeWidth={1.5} />
        <h3 style={sectionHeadingStyle}>Your Statistics</h3>
      </div>

      <div style={{ borderTop: rule }} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        borderBottom: rule,
      }}>
        {statItems.map((item, i) => (
          <div
            key={item.label}
            style={{
              padding: '20px 16px 20px 0',
              borderRight: i < statItems.length - 1 ? rule : 'none',
              paddingRight: i < statItems.length - 1 ? 16 : 0,
            }}
          >
            <span style={{
              ...statValueStyle,
              color: item.accent === true ? accent : ink,
            }}>
              <AnimatedNumber value={item.value} suffix={item.suffix} />
            </span>
            <span style={statLabelStyle}>{item.label}</span>
          </div>
        ))}
      </div>

      {(stats.averageScore >= 60 || stats.bestScore === 100) === true ? (
        <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {stats.averageScore >= 60 ? (
            <p style={{ fontSize: 13, color: muted, lineHeight: 1.5 }}>
              <span style={{ color: accent, fontWeight: 600 }}>Consistently passing</span>
              {' — you are consistently passing the civics test with an average score of '}
              <strong style={{ color: ink }}>{stats.averageScore}%</strong>.
            </p>
          ) : null}
          {stats.bestScore === 100 ? (
            <p style={{ fontSize: 13, color: muted, lineHeight: 1.5 }}>
              <span style={{ color: accent, fontWeight: 600 }}>Perfect score achieved</span>
              {' — you have answered every question correctly in a single session.'}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
