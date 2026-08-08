import React from 'react'
import { GetProps, styled } from 'tamagui'
import { YStack } from 'tamagui'

const SpinnerFrame = styled(YStack, {
  name: 'LoadingSpinner',
  width: 48,
  height: 48,
  borderRadius: 9999,
  borderWidth: 2,
  borderStyle: 'solid',
  borderColor: 'transparent',
  borderBottomColor: '$editorialAccent',

  variants: {
    // .spinner look is the default (transparent ring, accent tail at the
    // bottom); `ring` matches the home-page loader (rule-colored ring with
    // an accent tail at the top).
    ring: {
      true: {
        borderColor: '$editorialRule',
        borderBottomColor: '$editorialRule',
        borderTopColor: '$editorialAccent',
      },
    },
  } as const,
})

type SpinnerFrameProps = GetProps<typeof SpinnerFrame>

export interface LoadingSpinnerProps extends SpinnerFrameProps {
  /** Rotation period; .spinner uses 1000, the home loader 800. */
  readonly durationMs?: number
}

// PHASE5: replace the CSS keyframes (@keyframes spin in globals.css) with a
// moti/reanimated rotation; web-only until then.
export function LoadingSpinner({ durationMs = 1000, style, ...rest }: LoadingSpinnerProps) {
  return (
    <SpinnerFrame
      role="status"
      style={{ animation: `spin ${durationMs}ms linear infinite`, ...(style as object) }}
      {...rest}
    />
  )
}
