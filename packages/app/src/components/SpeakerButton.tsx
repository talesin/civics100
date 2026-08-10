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
// the old 1.5s speaker-pulse keyframe cycle.
const SpeakerButton: React.FC<SpeakerButtonProps> = ({ onPress, isSpeaking }) => {
  const theme = useTheme()
  const iconColor = theme.color?.get() as string
  const [dim, setDim] = useState(false)

  useEffect(() => {
    if (!isSpeaking) {
      setDim(false)
      return undefined
    }
    const interval = setInterval(() => setDim((d) => !d), 750)
    return () => clearInterval(interval)
  }, [isSpeaking])

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
      {/* height 29 preserves the old inline-svg line box: 22px icon on the
          baseline plus ~7px of strut descent below it. */}
      <YStack
        animation="pulse"
        opacity={isSpeaking && dim ? 0.5 : 1}
        height={29}
        alignItems="center"
      >
        {isSpeaking ? (
          <Volume2 size={22} color={iconColor} strokeWidth={2} />
        ) : (
          <Volume1 size={22} color={iconColor} strokeWidth={2} />
        )}
      </YStack>
    </SpeakerPressable>
  )
}

export default SpeakerButton
