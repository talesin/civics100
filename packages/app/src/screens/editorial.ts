/**
 * Editorial typography shared by the screens: the eyebrow, page title and
 * section title the route pages used to declare as inline style objects.
 * Sizes are px per breakpoint (no clamp()/vw on native); the fractional
 * lineHeights spell out what Chrome laid out for the old unitless values
 * (floor(px × 64) / 64), so page heights match the visual baselines.
 */
import { styled } from 'tamagui'
import { Text, YStack } from '../components/tamagui'

export const Eyebrow = styled(Text, {
  tag: 'p',
  fontSize: 11,
  fontWeight: '600',
  letterSpacing: 1.32, // 0.12em at 11px
  textTransform: 'uppercase',
  color: '$editorialAccent',
  marginBottom: 10
})

// clamp(2rem, 5vw, 2.75rem): 44px at the desktop baseline, 32px under $xs.
// line-height 1.1 → 48.39 / 35.19 (see the module comment).
export const PageTitle = styled(Text, {
  tag: 'h1',
  fontFamily: '$serifDisplay',
  fontSize: 44,
  lineHeight: 48.39,
  fontWeight: '500',
  color: '$editorialInk',
  letterSpacing: -0.88, // -0.02em at 44px

  $xs: {
    fontSize: 32,
    lineHeight: 35.19,
    letterSpacing: -0.64
  }
})

export const SectionTitle = styled(Text, {
  tag: 'h3',
  fontFamily: '$serif',
  fontSize: 22,
  fontWeight: '500',
  color: '$editorialInk',
  letterSpacing: -0.22 // -0.01em at 22px
})

export const Rule = styled(YStack, {
  borderTopWidth: 1,
  borderTopColor: '$editorialRule'
})
