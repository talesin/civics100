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
  },

  variants: {
    inline: {
      true: {
        fontSize: 14,
        fontWeight: '400',
        textDecorationLine: 'underline',
        // Tamagui Text defaults to pre-wrap, which underlines the preserved
        // trailing space when the link wraps mid-sentence; the old <a> collapsed it.
        whiteSpace: 'normal'
      }
    }
  } as const
})

const Anchor = LinkFrame as unknown as React.ComponentType<
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'color'> & {
    readonly inline?: boolean | undefined
  }
>

export default function ExternalLink({ href, children, inline }: ExternalLinkProps) {
  return (
    <Anchor href={href} target="_blank" rel="noopener noreferrer" inline={inline}>
      {children}
    </Anchor>
  )
}
