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
          backgroundColor: '#fee2e2',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24
        }}
      >
        <svg
          style={{ width: 32, height: 32, color: '#dc2626' }}
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
          color: '#111827',
          marginBottom: 8
        }}
      >
        Something went wrong
      </h2>

      <p
        style={{
          color: '#6b7280',
          marginBottom: 24,
          maxWidth: 400
        }}
      >
        An unexpected error occurred. Please try again or refresh the page.
      </p>

      {error !== null && process.env.NODE_ENV === 'development' ? (
        <pre
          style={{
            backgroundColor: '#f3f4f6',
            padding: 16,
            borderRadius: 8,
            fontSize: 12,
            color: '#dc2626',
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
        <button
          onClick={onRetry}
          style={{
            backgroundColor: '#2563eb',
            color: 'white',
            fontWeight: 500,
            padding: '12px 24px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
        >
          Try Again
        </button>

        <button
          onClick={() => (window.location.href = '/')}
          style={{
            backgroundColor: '#f3f4f6',
            color: '#374151',
            fontWeight: 500,
            padding: '12px 24px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
        >
          Go Home
        </button>
      </div>
    </div>
  )
}

export default ErrorBoundary
