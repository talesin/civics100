'use client'

import React from 'react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useThemeContext } from '@/components/TamaguiProvider'

// Warning colors that work well in both light and dark modes
const warningColors = {
  light: { bg: '#fbbf24', text: '#78350f' }, // amber-400, amber-900
  dark: { bg: '#d97706', text: '#fffbeb' } // amber-600, amber-50
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  const { theme } = useThemeContext()
  const colors = warningColors[theme]

  if (isOnline) {
    return null
  }

  const bannerStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.bg,
    padding: '8px 16px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 9999
  }

  return (
    <div style={bannerStyles}>
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke={colors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
      <span style={{ color: colors.text, fontSize: 14, fontWeight: 600 }}>
        You are offline
      </span>
    </div>
  )
}
