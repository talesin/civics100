import { Linking } from 'react-native'
import { styled, Text as TamaguiText } from 'tamagui'
import type { ExternalLinkProps } from './ExternalLink.shared'

const LinkText = styled(TamaguiText, {
  fontSize: 13,
  color: '$editorialAccent',
  fontWeight: '500',

  pressStyle: {
    textDecorationLine: 'underline'
  }
})

export default function ExternalLink({ href, children }: ExternalLinkProps) {
  return (
    <LinkText role="link" onPress={() => void Linking.openURL(href)}>
      {children}
    </LinkText>
  )
}
