import React, { Component, ErrorInfo, ReactNode } from 'react'
import { isWeb, styled, useTheme, Text as TamaguiText } from 'tamagui'
import { XStack, YStack, Text } from './tamagui'
import { AlertTriangle } from './icons'

interface Props {
  readonly children: ReactNode
  readonly fallback?: ReactNode
  /**
   * Navigation callback for the default fallback's "Go Home" button. The
   * boundary resets its own error state before calling it, so a soft route
   * change (expo-router on native) lands on a rendering tree. The web caller
   * passes a hard navigation (`window.location.href = '/'`), which also
   * discards any client state that caused the throw. Omit it to hide the
   * button.
   */
  readonly onNavigateHome?: (() => void) | undefined
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component to catch JavaScript errors in child component tree.
 * Prevents the entire app from crashing when a component throws during rendering.
 *
 * Stays a class: error boundaries are React's one remaining class-only API.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary fallback={<CustomErrorUI />} onNavigateHome={goHome}>
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

  handleNavigateHome = (): void => {
    this.setState({ hasError: false, error: null })
    this.props.onNavigateHome?.()
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) {
        return this.props.fallback
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          onNavigateHome={
            this.props.onNavigateHome !== undefined ? this.handleNavigateHome : undefined
          }
        />
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  readonly error: Error | null
  readonly onRetry: () => void
  readonly onNavigateHome: (() => void) | undefined
}

const FallbackContainer = styled(YStack, {
  alignItems: 'center',
  justifyContent: 'center',
  padding: 32
})

const IconCircle = styled(YStack, {
  width: 64,
  height: 64,
  backgroundColor: '$themeErrorBg',
  borderRadius: 9999,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 24
})

const FallbackTitle = styled(Text, {
  tag: 'h2',
  fontSize: 24,
  fontWeight: '600',
  color: '$editorialInk',
  marginBottom: 8,
  textAlign: 'center'
})

const FallbackMessage = styled(Text, {
  tag: 'p',
  color: '$editorialMuted',
  marginBottom: 24,
  maxWidth: 400,
  textAlign: 'center'
})

// Dev-only error detail. Was a raw <pre>; now a Text so it renders on native.
// Web keeps the <pre> tag; the isWeb spread at the call site restores the
// pre-wrap whitespace that Tamagui's text reset removes (the site's global
// CSS already gave <pre> the body font, so no monospace to restore).
const ErrorDetail = styled(TamaguiText, {
  tag: 'pre',
  backgroundColor: '$editorialPaper',
  color: '$themeError',
  padding: 16,
  borderRadius: 8,
  fontSize: 12,
  marginBottom: 24,
  maxWidth: '100%',
  overflow: 'scroll',
  textAlign: 'left'
})

// Text-based single elements so the label inherits its colors (same reasoning
// as EditorialButton). TryAgainButton is the port of the website's
// `.btn-primary` class (primary-600 fill / white text / primary-600 border,
// hover primary-700 — those hexes are exactly `$primary` / `$primaryHover`);
// its geometry now matches GoHomeButton instead of the UA button defaults so
// the two sit as an even pair. The wider pair no longer fits a phone-width
// row, so labels stay on one line (numberOfLines) and the row wraps instead.
const Actions = styled(XStack, {
  gap: 12,
  flexWrap: 'wrap',
  justifyContent: 'center'
})

const TryAgainButton = styled(TamaguiText, {
  tag: 'button',
  numberOfLines: 1,
  backgroundColor: '$primary',
  color: 'white',
  fontWeight: '500',
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 8,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$primary',
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$primaryHover',
    borderColor: '$primaryHover'
  },

  focusVisibleStyle: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: '$themePrimary',
    outlineOffset: 2
  }
})

const GoHomeButton = styled(TamaguiText, {
  tag: 'button',
  numberOfLines: 1,
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
    backgroundColor: '$backgroundHover'
  }
})

function DefaultErrorFallback({
  error,
  onRetry,
  onNavigateHome
}: DefaultErrorFallbackProps): React.ReactElement {
  const theme = useTheme()
  const iconColor = theme.themeError?.get() as string

  return (
    // `50vh` is a web-only unit; native fills its parent instead.
    <FallbackContainer {...(isWeb ? { minHeight: '50vh' } : { flex: 1 })}>
      <IconCircle>
        <AlertTriangle size={32} color={iconColor} strokeWidth={2} />
      </IconCircle>

      <FallbackTitle>Something went wrong</FallbackTitle>

      <FallbackMessage>
        An unexpected error occurred. Please try again or refresh the page.
      </FallbackMessage>

      {error !== null && process.env['NODE_ENV'] === 'development' ? (
        <ErrorDetail {...(isWeb ? { whiteSpace: 'pre-wrap' } : {})}>{error.message}</ErrorDetail>
      ) : null}

      <Actions>
        <TryAgainButton onPress={onRetry}>Try Again</TryAgainButton>

        {onNavigateHome !== undefined ? (
          <GoHomeButton onPress={onNavigateHome}>Go Home</GoHomeButton>
        ) : null}
      </Actions>
    </FallbackContainer>
  )
}

export default ErrorBoundary
