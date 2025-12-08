import { GetProps, styled } from 'tamagui'
import { Text as TamaguiText } from 'tamagui'

export const Text = styled(TamaguiText, {
  name: 'Text',
  color: '$color',
  fontSize: '$3',
})

export const Heading = styled(TamaguiText, {
  name: 'Heading',
  tag: 'h2',
  color: '$color',
  fontSize: '$8',
  fontWeight: '700',
  marginBottom: '$4',
})

export const Paragraph = styled(TamaguiText, {
  name: 'Paragraph',
  tag: 'p',
  color: '$color',
  fontSize: '$3',
  lineHeight: 1.6,
  marginBottom: '$3',
})

export type TextProps = GetProps<typeof Text>
export type HeadingProps = GetProps<typeof Heading>
export type ParagraphProps = GetProps<typeof Paragraph>
