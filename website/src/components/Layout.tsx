import React, { useState } from 'react'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import { XStack, YStack, Text } from '@/components/tamagui'
import { styled } from 'tamagui'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  showHeader?: boolean
  className?: string
}

// Container styles
const pageStyles: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#f9fafb', // gray-50
}

const headerStyles: React.CSSProperties = {
  backgroundColor: 'white',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  borderBottom: '1px solid #e5e7eb',
  position: 'sticky',
  top: 0,
  zIndex: 40,
}

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

const navLinkStyles: React.CSSProperties = {
  color: '#4b5563', // gray-600
  padding: '8px 12px',
  borderRadius: 6,
  fontSize: 14,
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'all 200ms',
}

const dividerStyles: React.CSSProperties = {
  borderLeft: '1px solid #d1d5db',
  height: 24,
  margin: '0 8px',
}

const mobileMenuButtonStyles: React.CSSProperties = {
  padding: 8,
  borderRadius: 6,
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: '#4b5563',
}

const mobileMenuStyles: React.CSSProperties = {
  padding: '8px 8px 12px',
  backgroundColor: 'white',
  borderTop: '1px solid #e5e7eb',
}

const mobileNavLinkStyles: React.CSSProperties = {
  display: 'block',
  color: '#4b5563',
  padding: '8px 12px',
  borderRadius: 6,
  fontSize: 16,
  fontWeight: 500,
  textDecoration: 'none',
}

const mainStyles: React.CSSProperties = {
  flex: 1,
  padding: '24px 16px',
}

const footerStyles: React.CSSProperties = {
  backgroundColor: 'white',
  borderTop: '1px solid #e5e7eb',
  marginTop: 'auto',
}

const footerContainerStyles: React.CSSProperties = {
  ...containerStyles,
  padding: '24px 16px',
}

const FooterText = styled(Text, {
  fontSize: '$2',
  color: '#6b7280',
})

const FooterSubtext = styled(Text, {
  fontSize: '$1',
  color: '#9ca3af',
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

  return (
    <div style={pageStyles} className={className}>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {showHeader === true ? (
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
            {mobileMenuOpen === true ? (
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
          {children}
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
