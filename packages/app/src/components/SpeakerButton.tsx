import React, { useEffect, useState } from 'react'
import { isWeb, styled, useTheme } from 'tamagui'
import { Stack, YStack } from './tamagui'
import { Volume1, Volume2 } from './icons'

interface SpeakerButtonProps {
  readonly onPress: () => void
  readonly isSpeaking: boolean
}

const SpeakerPressable = styled(Stack, {
  name: 'SpeakerPressable',
  tag: 'button',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 8,
  borderRadius: 8,
  backgroundColor: 'transparent',
  borderWidth: 0,
  cursor: 'pointer'
})

// While speaking, a 750ms interval ping-pongs the icon opacity through the
// `pulse` animation key, so both drivers (CSS on web, moti on native) render
// the old 1.5s speaker-pulse keyframe cycle. The css driver only emits
// transitions (no keyframe loops), so a JS clock is required; it lives in a
// component mounted only while speaking, so the phase resets on each start
// without any setState in an effect body.
// height 29 preserves the old inline-svg line box: 22px icon on the baseline
// plus ~7px of strut descent below it.
const PulsingIcon: React.FC<{ readonly children: React.ReactNode }> = ({ children }) => {
  const [dim, setDim] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setDim((d) => !d), 750)
    return () => clearInterval(interval)
  }, [])

  return (
    <YStack animation="pulse" opacity={dim ? 0.5 : 1} height={29} alignItems="center">
      {children}
    </YStack>
  )
}

const SpeakerButton: React.FC<SpeakerButtonProps> = ({ onPress, isSpeaking }) => {
  const theme = useTheme()
  const iconColor = theme.color?.get() as string

  return (
    <SpeakerPressable
      onPress={onPress}
      aria-label={isSpeaking ? 'Stop reading' : 'Read question aloud'}
      {...(isWeb
        ? ({
            type: 'button',
            onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation()
          } as Record<string, unknown>)
        : {})}
    >
      {isSpeaking ? (
        <PulsingIcon>
          <Volume2 size={22} color={iconColor} strokeWidth={2} />
        </PulsingIcon>
      ) : (
        <YStack height={29} alignItems="center">
          <Volume1 size={22} color={iconColor} strokeWidth={2} />
        </YStack>
      )}
    </SpeakerPressable>
  )
}

export default SpeakerButton
