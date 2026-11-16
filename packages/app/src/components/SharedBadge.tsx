import { Text, YStack } from 'tamagui'

export interface SharedBadgeProps {
  readonly label: string
  readonly detail?: string
}

// Minimal shared Tamagui component (Phase 2 exit criterion): exercises tokens,
// themes and the per-platform animation driver from packages/app on both apps.
export function SharedBadge({ label, detail }: SharedBadgeProps) {
  return (
    <YStack
      animation="medium"
      enterStyle={{ opacity: 0 }}
      opacity={1}
      backgroundColor="$primary"
      borderRadius="$4"
      padding="$4"
      gap="$1"
    >
      <Text color="$background" fontSize={16} fontWeight="700">
        {label}
      </Text>
      {detail !== undefined ? (
        <Text color="$background" fontSize={12}>
          {detail}
        </Text>
      ) : null}
    </YStack>
  )
}
