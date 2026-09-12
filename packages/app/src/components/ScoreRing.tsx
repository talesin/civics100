import { useTheme } from 'tamagui'
import { Text, YStack } from './tamagui'
import type { ScoreRingProps } from './ScoreRing.shared'

const ARC = 'M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831'

// 52px ring with the percentage centred over it. The label keeps the old
// absolute + translate(-50%, -50%) centring rather than flex centring: both
// compute the same offset, but Chrome rasterises the sub-pixel text position
// differently under a transform, and flex centring failed the visual baseline
// by ~110 pixels on two of the three rings.
export default function ScoreRing({ percentage, passed }: ScoreRingProps) {
  const theme = useTheme()
  const track = theme.editorialRule?.get() as string
  const stroke = (passed ? theme.editorialAccent?.get() : theme.themeError?.get()) as string

  return (
    <YStack width={52} height={52} flexShrink={0}>
      <svg
        style={{
          width: 52,
          height: 52,
          transform: 'rotate(-90deg)',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        viewBox="0 0 36 36"
      >
        <path d={ARC} fill="none" stroke={track} strokeWidth="2" />
        <path
          d={ARC}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeDasharray={`${percentage}, 100`}
        />
      </svg>
      <Text
        position="absolute"
        top="50%"
        left="50%"
        style={{ transform: 'translate(-50%, -50%)' }}
        fontFamily="$serif"
        fontSize={11}
        fontWeight="500"
        color="$editorialInk"
      >
        {percentage}%
      </Text>
    </YStack>
  )
}
