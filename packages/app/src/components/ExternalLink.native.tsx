import { Linking } from 'react-native'
import { styled, Text as TamaguiText } from 'tamagui'
import type { ExternalLinkProps } from './ExternalLink.shared'

const LinkText = styled(TamaguiText, {
  fontSize: 13,
  color: '$editorialAccent',
  fontWeight: '500',

  pressStyle: {
    textDecorationLine: 'underline'
  },

  variants: {
    inline: {
      true: {
        fontSize: 14,
        fontWeight: '400',
        textDecorationLine: 'underline'
      }
    }
  } as const
})

export default function ExternalLink({ href, children, inline }: ExternalLinkProps) {
  return (
    <LinkText role="link" inline={inline} onPress={() => void Linking.openURL(href)}>
      {children}
    </LinkText>
  )
}
