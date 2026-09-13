import React from 'react'
import { styled, Text as TamaguiText } from 'tamagui'
import type { ExternalLinkProps } from './ExternalLink.shared'

// Anchor with underline-on-hover; Text types omit anchor DOM attributes,
// hence the recast (same shape as EditorialInput's).
const LinkFrame = styled(TamaguiText, {
  tag: 'a',
  fontSize: 13,
  color: '$editorialAccent',
  textDecorationLine: 'none',
  fontWeight: '500',

  hoverStyle: {
    textDecorationLine: 'underline'
  }
})

const Anchor = LinkFrame as unknown as React.ComponentType<
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'color'>
>

export default function ExternalLink({ href, children }: ExternalLinkProps) {
  return (
    <Anchor href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </Anchor>
  )
}
