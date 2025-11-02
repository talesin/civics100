import React, { useState } from 'react'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  showHeader?: boolean
  className?: string
}

export default function Layout({
  children,
  title = 'US Civics Test',
  showHeader = true,
  className = ''
}: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Skip to main content link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {showHeader === true ? (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
          <div className="container">
            <div className="flex justify-between items-center h-16">
              {/* Logo/Title */}
              <div className="flex items-center flex-shrink-0">
                <Link href="/" className="flex items-center space-x-3 focus-ring rounded-md p-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-red-600 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🇺🇸</span>
                  </div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-white text-balance">
                    {title}
                  </h1>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                <nav className="flex space-x-1" aria-label="Main navigation">
                  <Link
                    href="/"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors focus-ring"
                  >
                    Home
                  </Link>
                  <Link
                    href="/results"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors focus-ring"
                  >
                    Results
                  </Link>
                  <Link
                    href="/statistics"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors focus-ring"
                  >
                    Statistics
                  </Link>
                </nav>
                <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2" />
                <ThemeToggle />
              </div>

              {/* Mobile controls */}
              <div className="md:hidden flex items-center space-x-2">
                <ThemeToggle />
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 focus-ring"
                  aria-expanded={mobileMenuOpen}
                  aria-controls="mobile-menu"
                  aria-label="Toggle main menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium transition-colors focus-ring"
                  >
                    Home
                  </Link>
                  <Link
                    href="/results"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium transition-colors focus-ring"
                  >
                    Results
                  </Link>
                  <Link
                    href="/statistics"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-base font-medium transition-colors focus-ring"
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
      <main id="main-content" className="flex-1 container py-6 sm:py-8 lg:py-12" role="main">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="container py-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-red-600 rounded flex items-center justify-center">
                <span className="text-white text-xs">🇺🇸</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">US Civics Test Practice</p>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 max-w-2xl mx-auto">
              Test your knowledge of American civics and history with questions based on the
              official U.S. Citizenship Test.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
