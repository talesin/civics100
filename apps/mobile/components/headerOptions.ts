import { createElement } from 'react'
import { useTheme } from 'tamagui'
import { ThemeToggle } from 'app/components'

const HeaderRight = () => createElement(ThemeToggle)

/**
 * Header chrome shared by the root stack (game route) and the tab navigator:
 * editorial paper/ink from the active theme and the shared ThemeToggle on the
 * right — the native stand-in for the web Layout header. Both navigators'
 * option types accept this shape.
 */
export function useHeaderOptions() {
  const theme = useTheme()
  const paper = theme.editorialPaper?.get() as string
  const ink = theme.editorialInk?.get() as string

  return {
    headerStyle: { backgroundColor: paper },
    headerTintColor: ink,
    headerShadowVisible: false,
    headerRight: HeaderRight,
    contentStyle: { backgroundColor: paper }
  }
}
