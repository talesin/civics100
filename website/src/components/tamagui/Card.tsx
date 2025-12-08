import { GetProps, styled } from 'tamagui'
import { Stack } from 'tamagui'

export const Card = styled(Stack, {
  name: 'Card',

  backgroundColor: '$background',
  borderColor: '$borderColor',
  borderWidth: 1,
  borderRadius: '$3',
  padding: '$4',

  hoverStyle: {
    borderColor: '$borderColorHover',
  },

  variants: {
    elevated: {
      true: {
        shadowColor: '$color',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
      },
    },
  },
} as const)

export type CardProps = GetProps<typeof Card>
