import React, { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Settings } from 'app/components'
import { styled, useTheme } from 'tamagui'
import { YStack, XStack, Text } from '@/components/tamagui'
import ThemeToggle from './ThemeToggle'
import { ErrorBoundary } from './ErrorBoundary'

interface LayoutProps {
  readonly children: React.ReactNode
  readonly title?: string
  readonly showHeader?: boolean
  readonly className?: string
}

// Colors resolve through Tamagui theme keys; under the css driver they emit
// CSS variable references whose values are keyed off html.t_dark (set by
// NextThemeProvider's injected script), so server/client HTML is identical.

const Page = styled(YStack, {
  minHeight: '100vh',
  backgroundColor: '$editorialPaper',
})

const Header = styled(YStack, {
  tag: 'header',
  backgroundColor: '$editorialPaper',
  borderBottomWidth: 1,
  borderBottomColor: '$editorialRule',
  zIndex: 40,
})

const Container = styled(YStack, {
  // Block, not flex: page content inside uses `margin: 0 auto` + max-width
  // columns, which stretch to their max-width under block layout but
  // shrink-to-fit as flex items — flex here shifts every page's column.
  display: 'block',
  width: '100%',
  maxWidth: 1280,
  marginHorizontal: 'auto',
  paddingHorizontal: 24,
})

const HeaderContent = styled(XStack, {
  justifyContent: 'space-between',
  alignItems: 'center',
  height: 60,
})

const LogoMark = styled(YStack, {
  width: 28,
  height: 28,
  borderRadius: 4,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$editorialAccent',
  flexShrink: 0,
})

const LogoMarkText = styled(Text, {
  color: '$white',
  fontFamily: 'var(--font-family-serif)', // PHASE5: $fontFamily
  fontWeight: '500',
  fontSize: 11,
  letterSpacing: 0.55, // 0.05em at 11px
})

const TitleText = styled(Text, {
  fontFamily: 'var(--font-family-serif)', // PHASE5: $fontFamily
  fontSize: 17,
  fontWeight: '500',
  color: '$editorialInk',
  letterSpacing: -0.17, // -0.01em at 17px
})

const Divider = styled(YStack, {
  borderLeftWidth: 1,
  borderLeftColor: '$editorialRule',
  height: 20,
  marginHorizontal: 4,
})

const MobileMenuButton = styled(XStack, {
  tag: 'button',
  padding: 6,
  borderRadius: 4,
  backgroundColor: 'transparent',
  borderWidth: 0,
  cursor: 'pointer',
  alignItems: 'center',
  justifyContent: 'center',
})

const MobileMenu = styled(YStack, {
  paddingTop: 8,
  paddingHorizontal: 12,
  paddingBottom: 16,
  backgroundColor: '$editorialPaper',
  borderTopWidth: 1,
  borderTopColor: '$editorialRule',
})

const Main = styled(YStack, {
  tag: 'main',
  flex: 1,
  paddingVertical: 32,
  paddingHorizontal: 24,
})

const Footer = styled(YStack, {
  tag: 'footer',
  backgroundColor: '$editorialPaper',
  borderTopWidth: 1,
  borderTopColor: '$editorialRule',
  marginTop: 'auto',
})

const FooterContainer = styled(Container, {
  display: 'flex',
  paddingVertical: 24,
  paddingHorizontal: 24,
  alignItems: 'center',
  gap: 8,
})

const FooterText = styled(Text, {
  tag: 'p',
  fontSize: 13,
  color: '$editorialMuted',
  textAlign: 'center',
  maxWidth: 480,
  lineHeight: 20.8, // 1.6 at 13px
})

const logoLinkStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  textDecoration: 'none',
  padding: '4px 2px',
  borderRadius: 4,
}

export default function Layout({
  children,
  title = 'US Civics Test',
  showHeader = true,
  className = ''
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const theme = useTheme()
  // .get() returns a CSS variable reference under the css driver — SSR-safe
  // for the next/link styles below, which cannot take Tamagui props.
  const muted = theme.editorialMuted?.get() as string
  const rule = theme.editorialRule?.get() as string

  const navLinkStyles: React.CSSProperties = {
    color: muted,
    padding: '6px 10px',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
    transition: 'color 150ms ease',
    letterSpacing: '0.01em',
  }

  const iconLinkStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    borderRadius: 4,
    color: muted,
    textDecoration: 'none',
    transition: 'color 150ms ease',
  }

  const mobileNavLinkStyles: React.CSSProperties = {
    display: 'block',
    color: muted,
    padding: '10px 8px',
    borderRadius: 4,
    fontSize: 15,
    fontWeight: 500,
    textDecoration: 'none',
    borderBottom: `1px solid ${rule}`,
  }

  return (
    <Page className={className}>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {showHeader ? (
        <Header style={{ position: 'sticky', top: 0 }}>
          <Container>
            <HeaderContent>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <Link href="/" style={logoLinkStyles}>
                  <LogoMark>
                    <LogoMarkText>US</LogoMarkText>
                  </LogoMark>
                  <TitleText>{title}</TitleText>
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
                <Divider />
                <ThemeToggle />
              </div>

              <div className="md:hidden" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link href="/settings" aria-label="Settings" style={iconLinkStyles}>
                  <Settings size={18} strokeWidth={1.5} />
                </Link>
                <ThemeToggle />
                <MobileMenuButton
                  onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                  aria-label="Toggle main menu"
                >
                  {mobileMenuOpen ? <X size={22} color={muted} /> : <Menu size={22} color={muted} />}
                </MobileMenuButton>
              </div>
            </HeaderContent>

            {mobileMenuOpen ? (
              <div className="md:hidden" id="mobile-menu" data-testid="mobile-menu">
                <MobileMenu>
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyles}>Home</Link>
                  <Link href="/results" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyles}>Results</Link>
                  <Link href="/statistics" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyles}>Statistics</Link>
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)} style={{ ...mobileNavLinkStyles, borderBottom: 'none' }}>Settings</Link>
                </MobileMenu>
              </div>
            ) : null}
          </Container>
        </Header>
      ) : null}

      <Main id="main-content" role="main">
        <Container>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </Container>
      </Main>

      <Footer>
        <FooterContainer>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoMark>
              <LogoMarkText>US</LogoMarkText>
            </LogoMark>
            <TitleText fontSize={14} letterSpacing={-0.14} color="$editorialMuted">
              US Civics Test Practice
            </TitleText>
          </div>
          <FooterText>
            Practice for the U.S. Citizenship Civics Exam with official USCIS questions.
          </FooterText>
        </FooterContainer>
      </Footer>
    </Page>
  )
}
