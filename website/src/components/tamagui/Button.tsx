import { GetProps, styled } from 'tamagui'
import { Stack } from 'tamagui'

export const Button = styled(Stack, {
  name: 'Button',

  // Base styles
  tag: 'button',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: '$2',
  cursor: 'pointer',
  userSelect: 'none',

  backgroundColor: '$primary',
  borderColor: '$primary',
  borderWidth: 0,
  borderRadius: '$2',
  padding: '$3',

  hoverStyle: {
    backgroundColor: '$primaryHover',
    opacity: 0.9,
  },

  pressStyle: {
    opacity: 0.8,
  },

  focusStyle: {
    outlineWidth: 2,
    outlineColor: '$borderColorFocus',
    outlineStyle: 'solid',
  },

  disabledStyle: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },

  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary',
      },
      secondary: {
        backgroundColor: '$secondary',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor',
      },
      ghost: {
        backgroundColor: 'transparent',
      },
    },

    size: {
      small: {
        padding: '$2',
      },
      medium: {
        padding: '$3',
      },
      large: {
        padding: '$4',
      },
    },
  },

  defaultVariants: {
    variant: 'primary',
    size: 'medium',
  },
} as const)

export type ButtonProps = GetProps<typeof Button>
