'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { styled, useTheme, Text as TamaguiText } from 'tamagui'
import { XStack, YStack, Text } from '@/components/tamagui'

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

const FallbackContainer = styled(YStack, {
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '50vh',
  padding: 32,
})

const IconCircle = styled(YStack, {
  width: 64,
  height: 64,
  backgroundColor: '$themeErrorBg',
  borderRadius: 9999,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 24,
})

const FallbackTitle = styled(Text, {
  tag: 'h2',
  fontSize: 24,
  fontWeight: '600',
  color: '$editorialInk',
  marginBottom: 8,
  textAlign: 'center',
})

const FallbackMessage = styled(Text, {
  tag: 'p',
  color: '$editorialMuted',
  marginBottom: 24,
  maxWidth: 400,
  textAlign: 'center',
})

// Text-based single element so the label inherits its colors (same reasoning
// as EditorialButton); no fontSize so the UA button font is kept.
const GoHomeButton = styled(TamaguiText, {
  tag: 'button',
  backgroundColor: '$editorialPaper',
  color: '$editorialInk',
  fontWeight: '500',
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 8,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$editorialRule',
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$backgroundHover',
  },
})

function DefaultErrorFallback({ error, onRetry }: DefaultErrorFallbackProps): React.ReactElement {
  const theme = useTheme()

  return (
    <FallbackContainer>
      <IconCircle>
        <svg
          style={{ width: 32, height: 32, color: theme.themeError?.get() as string }}
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
      </IconCircle>

      <FallbackTitle>Something went wrong</FallbackTitle>

      <FallbackMessage>
        An unexpected error occurred. Please try again or refresh the page.
      </FallbackMessage>

      {error !== null && process.env.NODE_ENV === 'development' ? (
        <pre
          style={{
            backgroundColor: theme.editorialPaper?.get() as string,
            padding: 16,
            borderRadius: 8,
            fontSize: 12,
            color: theme.themeError?.get() as string,
            marginBottom: 24,
            maxWidth: '100%',
            overflow: 'auto',
            textAlign: 'left'
          }}
        >
          {error.message}
        </pre>
      ) : null}

      <XStack gap={12}>
        <button onClick={onRetry} className="btn-primary">
          Try Again
        </button>

        <GoHomeButton onPress={() => (window.location.href = '/')}>
          Go Home
        </GoHomeButton>
      </XStack>
    </FallbackContainer>
  )
}

export default ErrorBoundary
