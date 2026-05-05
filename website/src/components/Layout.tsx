import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Settings } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { ErrorBoundary } from './ErrorBoundary'

interface LayoutProps {
  readonly children: React.ReactNode
  readonly title?: string
  readonly showHeader?: boolean
  readonly className?: string
}

// All styles use CSS custom properties so server/client HTML is identical.
// The html.t_dark class (set by NextThemeProvider's injected script) controls values.

const pageStyles: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--editorial-paper)',
}

const headerStyles: React.CSSProperties = {
  backgroundColor: 'var(--editorial-paper)',
  borderBottom: '1px solid var(--editorial-rule)',
  position: 'sticky',
  top: 0,
  zIndex: 40,
}

const containerStyles: React.CSSProperties = {
  width: '100%',
  maxWidth: 1280,
  margin: '0 auto',
  padding: '0 24px',
}

const headerContentStyles: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  height: 60,
}

const logoLinkStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  textDecoration: 'none',
  padding: '4px 2px',
  borderRadius: 4,
}

const logoMarkStyles: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--editorial-accent)',
  flexShrink: 0,
}

const logoMarkTextStyles: React.CSSProperties = {
  color: '#ffffff',
  fontFamily: 'var(--font-family-serif)',
  fontWeight: 500,
  fontSize: 11,
  letterSpacing: '0.05em',
}

const titleStyles: React.CSSProperties = {
  fontFamily: 'var(--font-family-serif)',
  fontSize: 17,
  fontWeight: 500,
  color: 'var(--editorial-ink)',
  letterSpacing: '-0.01em',
}

const navLinkStyles: React.CSSProperties = {
  color: 'var(--editorial-muted)',
  padding: '6px 10px',
  borderRadius: 4,
  fontSize: 14,
  fontWeight: 500,
  textDecoration: 'none',
  transition: 'color 150ms ease',
  letterSpacing: '0.01em',
}

const dividerStyles: React.CSSProperties = {
  borderLeft: '1px solid var(--editorial-rule)',
  height: 20,
  margin: '0 4px',
}

const iconLinkStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 6,
  borderRadius: 4,
  color: 'var(--editorial-muted)',
  textDecoration: 'none',
  transition: 'color 150ms ease',
}

const mobileMenuButtonStyles: React.CSSProperties = {
  padding: 6,
  borderRadius: 4,
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  color: 'var(--editorial-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const mobileMenuStyles: React.CSSProperties = {
  padding: '8px 12px 16px',
  backgroundColor: 'var(--editorial-paper)',
  borderTop: '1px solid var(--editorial-rule)',
}

const mobileNavLinkStyles: React.CSSProperties = {
  display: 'block',
  color: 'var(--editorial-muted)',
  padding: '10px 8px',
  borderRadius: 4,
  fontSize: 15,
  fontWeight: 500,
  textDecoration: 'none',
  borderBottom: '1px solid var(--editorial-rule)',
}

const mainStyles: React.CSSProperties = {
  flex: 1,
  padding: '32px 24px',
}

const footerStyles: React.CSSProperties = {
  backgroundColor: 'var(--editorial-paper)',
  borderTop: '1px solid var(--editorial-rule)',
  marginTop: 'auto',
}

const footerContainerStyles: React.CSSProperties = {
  ...containerStyles,
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
}

export default function Layout({
  children,
  title = 'US Civics Test',
  showHeader = true,
  className = ''
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div style={pageStyles} className={className}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {showHeader ? (
        <header style={headerStyles}>
          <div style={containerStyles}>
            <div style={headerContentStyles}>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <Link href="/" style={logoLinkStyles}>
                  <div style={logoMarkStyles}>
                    <span style={logoMarkTextStyles}>US</span>
                  </div>
                  <span style={titleStyles}>{title}</span>
                </Link>
              </div>

              <div className="hidden md:flex" style={{ alignItems: 'center', gap: 4 }}>
                <nav style={{ display: 'flex', gap: 2 }} aria-label="Main navigation">
                  <Link href="/" style={navLinkStyles}>Home</Link>
                  <Link href="/results" style={navLinkStyles}>Results</Link>
                  <Link href="/statistics" style={navLinkStyles}>Statistics</Link>
                </nav>
                <Link href="/settings" aria-label="Settings" style={iconLinkStyles}>
                  <Settings size={18} strokeWidth={1.5} />
                </Link>
                <div style={dividerStyles} />
                <ThemeToggle />
              </div>

              <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link href="/settings" aria-label="Settings" style={iconLinkStyles}>
                  <Settings size={18} strokeWidth={1.5} />
                </Link>
                <ThemeToggle />
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  style={mobileMenuButtonStyles}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                  aria-label="Toggle main menu"
                >
                  {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
              </div>
            </div>

            {mobileMenuOpen ? (
              <div className="md:hidden" id="mobile-menu" data-testid="mobile-menu">
                <div style={mobileMenuStyles}>
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyles}>Home</Link>
                  <Link href="/results" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyles}>Results</Link>
                  <Link href="/statistics" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyles}>Statistics</Link>
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)} style={{ ...mobileNavLinkStyles, borderBottom: 'none' }}>Settings</Link>
                </div>
              </div>
            ) : null}
          </div>
        </header>
      ) : null}

      <main id="main-content" style={mainStyles} role="main">
        <div style={containerStyles}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>

      <footer style={footerStyles}>
        <div style={footerContainerStyles}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={logoMarkStyles}>
              <span style={logoMarkTextStyles}>US</span>
            </div>
            <span style={{ ...titleStyles, fontSize: 14, color: 'var(--editorial-muted)' }}>
              US Civics Test Practice
            </span>
          </div>
          <p style={{
            fontSize: 13,
            color: 'var(--editorial-muted)',
            textAlign: 'center',
            maxWidth: 480,
            lineHeight: 1.6,
          }}>
            Practice for the U.S. Citizenship Civics Exam with official USCIS questions.
          </p>
        </div>
      </footer>
    </div>
  )
}
