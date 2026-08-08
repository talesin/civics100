import React from 'react'
import { styled } from 'tamagui'
import { Text as TamaguiText } from 'tamagui'

// Port of .input-editorial (globals.css). Text-based so fontSize/color style
// the control's own value text; no fontFamily is set so form controls keep
// the UA font, exactly as the class did.
const EditorialInputFrame = styled(TamaguiText, {
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

// Tamagui's Text prop types omit DOM form attributes (value, onChange, ...)
// even though the css driver forwards them to the element; recast per tag.
export const EditorialInput = EditorialInputFrame as unknown as React.ComponentType<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'color'>
>

const EditorialSelectFrame = EditorialInputFrame as unknown as React.ComponentType<
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'color'> & {
    readonly tag: 'select'
  }
>

export function EditorialSelect(
  props: Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'color'>
): React.ReactElement {
  return <EditorialSelectFrame tag="select" {...props} />
}

export type EditorialInputProps = React.ComponentProps<typeof EditorialInput>
export type EditorialSelectProps = React.ComponentProps<typeof EditorialSelect>
