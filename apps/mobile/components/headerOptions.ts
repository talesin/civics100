import { createElement } from 'react'
import { type GenericFont, useTheme } from 'tamagui'
import { ThemeToggle } from 'app/components'
import config from '../tamagui.config'

// The web Layout's TitleText: `$serif` at 17px, weight 500. Navigators draw
// the header outside Tamagui, so the face is resolved from the font config
// here (the native serif maps weights to embedded Newsreader faces). tsc
// types the config through the web half of the split, which has no `face`.
const serifMediumFace = (config.fonts.serif as GenericFont).face?.[500]?.normal

const HeaderRight = () => createElement(ThemeToggle)

/**
 * Header chrome shared by the root stack (game route) and the tab navigator:
 * editorial paper/ink from the active theme, the serif title, and the shared
 * ThemeToggle on the right — the native stand-in for the web Layout header.
 * Both navigators' option types accept this shape (native-stack's
 * `headerTitleStyle` takes only fontFamily/fontSize/fontWeight/color).
 */
export function useHeaderOptions() {
  const theme = useTheme()
  const paper = theme.editorialPaper?.get() as string
  const ink = theme.editorialInk?.get() as string

  return {
    headerStyle: { backgroundColor: paper },
    headerTintColor: ink,
    headerTitleStyle: { fontFamily: serifMediumFace, fontSize: 17 },
    headerShadowVisible: false,
    headerRight: HeaderRight,
    contentStyle: { backgroundColor: paper }
  }
}
