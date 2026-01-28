'use client'

import React from 'react'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'
import { useThemeContext, themeColors } from '@/components/TamaguiProvider'

export function InstallPrompt() {
  const { canInstall, promptInstall, dismissPrompt } = useInstallPrompt()
  const { theme } = useThemeContext()
  const colors = themeColors[theme]

  if (!canInstall) {
    return null
  }

  const bannerStyles: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    zIndex: 9998,
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)'
  }

  const contentStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  }

  const textStyles: React.CSSProperties = {
    color: colors.background,
    fontSize: 14,
    fontWeight: 500,
    flex: 1
  }

  const buttonContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: 8
  }

  const ghostButtonStyles: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    padding: '8px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    color: colors.background,
    fontSize: 14,
    fontWeight: 600
  }

  const primaryButtonStyles: React.CSSProperties = {
    background: colors.background,
    border: 'none',
    padding: '8px 12px',
    borderRadius: 6,
    cursor: 'pointer',
    color: colors.primary,
    fontSize: 14,
    fontWeight: 600
  }

  return (
    <div style={bannerStyles}>
      <div style={contentStyles}>
        <svg
          width={24}
          height={24}
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.background}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7,10 12,15 17,10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span style={textStyles}>Install Civics 100 for offline access</span>
      </div>
      <div style={buttonContainerStyles}>
        <button style={ghostButtonStyles} onClick={dismissPrompt}>
          Later
        </button>
        <button style={primaryButtonStyles} onClick={promptInstall}>
          Install
        </button>
      </div>
    </div>
  )
}
