import React, { useEffect, useRef } from 'react'
import { GameStats } from '@/types'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { TrendingUp } from 'lucide-react'

interface StatsSummaryProps {
  readonly stats: GameStats
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (v) => Math.round(v))
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 0.9,
      ease: 'easeOut',
    })
    return controls.stop
  }, [value, count])

  return (
    <motion.span ref={ref}>
      {rounded.get() === 0 && value === 0 ? '0' : null}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  )
}

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-family-serif)',
  fontSize: 20,
  fontWeight: 500,
  color: 'var(--editorial-ink)',
  letterSpacing: '-0.01em',
}

const statValueStyle: React.CSSProperties = {
  fontFamily: 'var(--font-family-serif)',
  fontSize: 'clamp(2rem, 5vw, 3rem)',
  fontWeight: 400,
  lineHeight: 1,
  letterSpacing: '-0.02em',
  color: 'var(--editorial-ink)',
  display: 'block',
  marginBottom: 6,
}

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--editorial-muted)',
}

export default function StatsSummary({ stats }: StatsSummaryProps) {
  if (stats.totalGames === 0) {
    return (
      <div style={{
        borderTop: '1px solid var(--editorial-rule)',
        paddingTop: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <TrendingUp size={16} color="var(--editorial-muted)" strokeWidth={1.5} />
          <h3 style={sectionHeadingStyle}>Your Statistics</h3>
        </div>
        <div style={{ borderTop: '1px solid var(--editorial-rule)', paddingTop: 20 }}>
          <p style={{ fontSize: 14, color: 'var(--editorial-muted)' }}>
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
      borderTop: '1px solid var(--editorial-rule)',
      paddingTop: 32,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <TrendingUp size={16} color="var(--editorial-muted)" strokeWidth={1.5} />
        <h3 style={sectionHeadingStyle}>Your Statistics</h3>
      </div>

      <div style={{ borderTop: '1px solid var(--editorial-rule)' }} />

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        borderBottom: '1px solid var(--editorial-rule)',
      }}>
        {statItems.map((item, i) => (
          <div
            key={item.label}
            style={{
              padding: '20px 16px 20px 0',
              borderRight: i < statItems.length - 1 ? '1px solid var(--editorial-rule)' : 'none',
              paddingRight: i < statItems.length - 1 ? 16 : 0,
            }}
          >
            <span style={{
              ...statValueStyle,
              color: item.accent === true ? 'var(--editorial-accent)' : 'var(--editorial-ink)',
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
            <p style={{ fontSize: 13, color: 'var(--editorial-muted)', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--editorial-accent)', fontWeight: 600 }}>Consistently passing</span>
              {' — you are consistently passing the civics test with an average score of '}
              <strong style={{ color: 'var(--editorial-ink)' }}>{stats.averageScore}%</strong>.
            </p>
          ) : null}
          {stats.bestScore === 100 ? (
            <p style={{ fontSize: 13, color: 'var(--editorial-muted)', lineHeight: 1.5 }}>
              <span style={{ color: 'var(--editorial-accent)', fontWeight: 600 }}>Perfect score achieved</span>
              {' — you have answered every question correctly in a single session.'}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
