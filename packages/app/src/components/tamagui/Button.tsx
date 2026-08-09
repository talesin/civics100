import { GetProps, styled } from 'tamagui'
import { Stack, Text as TamaguiText } from 'tamagui'

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
    opacity: 0.9
  },

  pressStyle: {
    opacity: 0.8
  },

  focusStyle: {
    outlineWidth: 2,
    outlineColor: '$borderColorFocus',
    outlineStyle: 'solid'
  },

  disabledStyle: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },

  variants: {
    variant: {
      primary: {
        backgroundColor: '$primary'
      },
      secondary: {
        backgroundColor: '$secondary'
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '$borderColor'
      },
      ghost: {
        backgroundColor: 'transparent'
      }
    },

    size: {
      small: {
        padding: '$2'
      },
      medium: {
        padding: '$3'
      },
      large: {
        padding: '$4'
      }
    }
  },

  defaultVariants: {
    variant: 'primary',
    size: 'medium'
  }
} as const)

export type ButtonProps = GetProps<typeof Button>

// Editorial buttons are Text-based single elements (unlike the Stack-based
// Button above) because .btn-editorial-ghost:hover changes the text color —
// with a separate label child the parent's hover color could never reach it.
// Raw string children inherit every text style from the button element.
export const EditorialButton = styled(TamaguiText, {
  name: 'EditorialButton',
  tag: 'button',

  backgroundColor: '$editorialInk',
  color: '$editorialPaper',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$editorialInk',
  borderRadius: 3,
  paddingVertical: 12,
  paddingHorizontal: 22,
  fontFamily: '$serif',
  fontSize: 15,
  fontWeight: '500',
  letterSpacing: 0.3, // 0.02em at 15px
  cursor: 'pointer',

  hoverStyle: {
    backgroundColor: '$editorialAccent',
    borderColor: '$editorialAccent'
  },

  focusVisibleStyle: {
    outlineWidth: 2,
    outlineStyle: 'solid',
    outlineColor: '$editorialAccent',
    outlineOffset: 2
  },

  disabledStyle: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },

  variants: {
    ghost: {
      true: {
        backgroundColor: 'transparent',
        color: '$editorialInk',
        borderColor: '$editorialRule',
        paddingVertical: 11,
        paddingHorizontal: 20,
        fontSize: 14,
        letterSpacing: 0.28, // 0.02em at 14px

        hoverStyle: {
          backgroundColor: 'transparent',
          borderColor: '$editorialInk',
          color: '$editorialAccent'
        }
      }
    }
  } as const
})

export type EditorialButtonProps = GetProps<typeof EditorialButton>
