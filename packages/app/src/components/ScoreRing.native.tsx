/**
 * Native stub half (Phase 5): a solid ring in the pass/fail colour with the
 * percentage centred. The partial arc needs react-native-svg, which arrives
 * with the rest of the native polish in Phase 6.
 */
import { Text, YStack } from './tamagui'
import type { ScoreRingProps } from './ScoreRing.shared'

export default function ScoreRing({ percentage, passed }: ScoreRingProps) {
  return (
    <YStack
      width={52}
      height={52}
      flexShrink={0}
      alignItems="center"
      justifyContent="center"
      borderRadius={9999}
      borderWidth={2}
      borderColor={passed ? '$editorialAccent' : '$themeError'}
    >
      <Text fontFamily="$serif" fontSize={11} fontWeight="500" color="$editorialInk">
        {percentage}%
      </Text>
    </YStack>
  )
}
