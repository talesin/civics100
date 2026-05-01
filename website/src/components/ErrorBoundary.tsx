'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  readonly children: ReactNode
  readonly fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component to catch JavaScript errors in child component tree.
 * Prevents the entire app from crashing when a component throws during rendering.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <ComponentThatMightThrow />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback
      }

      return <DefaultErrorFallback error={this.state.error} onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  readonly error: Error | null
  readonly onRetry: () => void
}

function DefaultErrorFallback({ error, onRetry }: DefaultErrorFallbackProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        padding: 32,
        textAlign: 'center'
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          backgroundColor: 'var(--theme-error-bg)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24
        }}
      >
        <svg
          style={{ width: 32, height: 32, color: 'var(--theme-error)' }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <h2
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--editorial-ink)',
          marginBottom: 8
        }}
      >
        Something went wrong
      </h2>

      <p
        style={{
          color: 'var(--editorial-muted)',
          marginBottom: 24,
          maxWidth: 400
        }}
      >
        An unexpected error occurred. Please try again or refresh the page.
      </p>

      {error !== null && process.env.NODE_ENV === 'development' ? (
        <pre
          style={{
            backgroundColor: 'var(--editorial-paper)',
            padding: 16,
            borderRadius: 8,
            fontSize: 12,
            color: 'var(--theme-error)',
            marginBottom: 24,
            maxWidth: '100%',
            overflow: 'auto',
            textAlign: 'left'
          }}
        >
          {error.message}
        </pre>
      ) : null}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onRetry} className="btn-primary">
          Try Again
        </button>

        <button
          onClick={() => (window.location.href = '/')}
          style={{
            backgroundColor: 'var(--editorial-paper)',
            color: 'var(--editorial-ink)',
            fontWeight: 500,
            padding: '12px 24px',
            borderRadius: 8,
            border: '1px solid var(--editorial-rule)',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--theme-background-hover)')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--editorial-paper)')}
        >
          Go Home
        </button>
      </div>
    </div>
  )
}

export default ErrorBoundary
