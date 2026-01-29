import React, { useState } from 'react'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import { ErrorBoundary } from './ErrorBoundary'
import { useThemeContext } from '@/components/TamaguiProvider'
import { XStack, YStack, Text } from '@/components/tamagui'
import { styled } from 'tamagui'

interface LayoutProps {
  readonly children: React.ReactNode
  readonly title?: string
  readonly showHeader?: boolean
  readonly className?: string
}

// Extended theme colors for layout-specific UI
const layoutThemeColors = {
  light: {
    pageBg: '#f9fafb',      // gray-50
    headerBg: '#ffffff',
    headerBorder: '#e5e7eb', // gray-200
    footerBg: '#ffffff',
    navText: '#4b5563',      // gray-600
    navTextHover: '#1f2937', // gray-800
    divider: '#d1d5db',      // gray-300
    mobileMenuBg: '#ffffff',
  },
  dark: {
    pageBg: '#111827',       // gray-900
    headerBg: '#1f2937',     // gray-800
    headerBorder: '#374151', // gray-700
    footerBg: '#1f2937',     // gray-800
    navText: '#d1d5db',      // gray-300
    navTextHover: '#f9fafb', // gray-50
    divider: '#4b5563',      // gray-600
    mobileMenuBg: '#1f2937', // gray-800
  },
}

// Base styles (theme-independent)
const containerStyles: React.CSSProperties = {
  width: '100%',
  maxWidth: 1280,
  margin: '0 auto',
  padding: '0 16px',
}

const headerContentStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  height: 64,
}

const logoLinkStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  textDecoration: 'none',
  padding: 4,
  borderRadius: 6,
}

const LogoBox = styled(YStack, {
  width: 32,
  height: 32,
  borderRadius: 6,
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(to bottom right, #2563eb, #dc2626)',
})

const LogoText = styled(Text, {
  color: 'white',
  fontWeight: 'bold',
  fontSize: '$2',
})

const Title = styled(Text, {
  fontSize: '$6',
  fontWeight: '600',
  color: '$color',
})

// Helper to generate theme-aware style functions
const getNavLinkStyles = (colors: typeof layoutThemeColors.light): React.CSSProperties => ({
  color: colors.navText,
  padding: '8px 12px',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'all 200ms',
})

const getDividerStyles = (colors: typeof layoutThemeColors.light): React.CSSProperties => ({
  borderLeft: `1px solid ${colors.divider}`,
  height: 24,
  margin: '0 8px',
})

const getMobileMenuButtonStyles = (colors: typeof layoutThemeColors.light): React.CSSProperties => ({
  padding: 8,
  borderRadius: 6,
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: colors.navText,
})

const getMobileMenuStyles = (colors: typeof layoutThemeColors.light): React.CSSProperties => ({
  padding: '8px 8px 12px',
  backgroundColor: colors.mobileMenuBg,
  borderTop: `1px solid ${colors.headerBorder}`,
})

const getMobileNavLinkStyles = (colors: typeof layoutThemeColors.light): React.CSSProperties => ({
  display: 'block',
  color: colors.navText,
  padding: '8px 12px',
  borderRadius: 6,
  fontSize: 16,
  fontWeight: 500,
  textDecoration: 'none',
})

const mainStyles: React.CSSProperties = {
  flex: 1,
  padding: '24px 16px',
}

const footerContainerStyles: React.CSSProperties = {
  ...containerStyles,
  padding: '24px 16px',
}

const FooterText = styled(Text, {
  fontSize: '$2',
  color: '$color',
  opacity: 0.7,
})

const FooterSubtext = styled(Text, {
  fontSize: '$1',
  color: '$color',
  opacity: 0.5,
  textAlign: 'center',
  maxWidth: 672,
  marginHorizontal: 'auto',
})

export default function Layout({
  children,
  title = 'US Civics Test',
  showHeader = true,
  className = ''
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme } = useThemeContext()
  const layoutColors = layoutThemeColors[theme]
  const colors = layoutColors

  // Dynamic styles based on theme
  const pageStyles: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.pageBg,
  }

  const headerStyles: React.CSSProperties = {
    backgroundColor: colors.headerBg,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    borderBottom: `1px solid ${colors.headerBorder}`,
    position: 'sticky',
    top: 0,
    zIndex: 40,
  }

  const footerStyles: React.CSSProperties = {
    backgroundColor: colors.footerBg,
    borderTop: `1px solid ${colors.headerBorder}`,
    marginTop: 'auto',
  }

  const navLinkStyles = getNavLinkStyles(colors)
  const dividerStyles = getDividerStyles(colors)
  const mobileMenuButtonStyles = getMobileMenuButtonStyles(colors)
  const mobileMenuStyles = getMobileMenuStyles(colors)
  const mobileNavLinkStyles = getMobileNavLinkStyles(colors)

  return (
    <div style={pageStyles} className={className}>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {showHeader ? (
        <header style={headerStyles}>
          <div style={containerStyles}>
            <div style={headerContentStyles}>
              {/* Logo/Title */}
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <Link href="/" style={logoLinkStyles}>
                  <LogoBox>
                    <LogoText>US</LogoText>
                  </LogoBox>
                  <Title>{title}</Title>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex" style={{ alignItems: 'center', gap: 4 }}>
                <nav style={{ display: 'flex', gap: 4 }} aria-label="Main navigation">
                  <Link href="/" style={navLinkStyles}>
                    Home
                  </Link>
                  <Link href="/results" style={navLinkStyles}>
                    Results
                  </Link>
                  <Link href="/statistics" style={navLinkStyles}>
                    Statistics
                  </Link>
                </nav>
                <div style={dividerStyles} />
                <ThemeToggle />
              </div>

              {/* Mobile controls */}
              <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ThemeToggle />
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  style={mobileMenuButtonStyles}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                  aria-label="Toggle main menu"
                >
                  <svg width={24} height={24} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen ? (
              <div className="md:hidden" id="mobile-menu" data-testid="mobile-menu">
                <div style={mobileMenuStyles}>
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    style={mobileNavLinkStyles}
                  >
                    Home
                  </Link>
                  <Link
                    href="/results"
                    onClick={() => setMobileMenuOpen(false)}
                    style={mobileNavLinkStyles}
                  >
                    Results
                  </Link>
                  <Link
                    href="/statistics"
                    onClick={() => setMobileMenuOpen(false)}
                    style={mobileNavLinkStyles}
                  >
                    Statistics
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </header>
      ) : null}

      {/* Main content */}
      <main id="main-content" style={mainStyles} role="main">
        <div style={containerStyles}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>

      {/* Footer */}
      <footer style={footerStyles}>
        <div style={footerContainerStyles}>
          <YStack alignItems="center" gap="$3">
            <XStack alignItems="center" gap="$2">
              <LogoBox width={24} height={24}>
                <LogoText fontSize="$1">US</LogoText>
              </LogoBox>
              <FooterText>US Civics Test Practice</FooterText>
            </XStack>
            <FooterSubtext>
              Test your knowledge of American civics and history with questions based on the
              official U.S. Citizenship Test.
            </FooterSubtext>
          </YStack>
        </div>
      </footer>
    </div>
  )
}
