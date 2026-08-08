import { GetProps, styled } from 'tamagui'
import { Text as TamaguiText } from 'tamagui'

// Port of .input-editorial (globals.css). Text-based so fontSize/color style
// the control's own value text; no fontFamily is set so form controls keep
// the UA font, exactly as the class did. Select sites render the same
// component with tag="select".
export const EditorialInput = styled(TamaguiText, {
  name: 'EditorialInput',
  tag: 'input',

  display: 'block',
  width: '100%',
  paddingVertical: 9,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$editorialRule',
  borderRadius: 5,
  backgroundColor: '$editorialPaper',
  color: '$editorialInk',
  fontSize: 14,
  lineHeight: 21, // 1.5 at 14px

  focusStyle: {
    outlineStyle: 'none',
    borderColor: '$editorialAccent',
  },

  disabledStyle: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
})

export type EditorialInputProps = GetProps<typeof EditorialInput>
