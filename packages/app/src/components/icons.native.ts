/**
 * Native half of the platform-split icon module — see icons.ts for the
 * contract. @tamagui/lucide-icons renders via react-native-svg and resolves
 * size/color through the Tamagui theme.
 *
 * Per-icon subpath imports (not the package barrel): Metro does not
 * tree-shake, and the barrel pulls all ~1,760 icon modules into the Hermes
 * bundle. Add new icons here AND in icons.ts.
 */
export { AlertTriangle } from '@tamagui/lucide-icons/icons/AlertTriangle'
export { ArrowRight } from '@tamagui/lucide-icons/icons/ArrowRight'
export { BarChart2 } from '@tamagui/lucide-icons/icons/BarChart2'
export { BookOpen } from '@tamagui/lucide-icons/icons/BookOpen'
export { Check } from '@tamagui/lucide-icons/icons/Check'
export { CheckCircle } from '@tamagui/lucide-icons/icons/CheckCircle'
export { FileText } from '@tamagui/lucide-icons/icons/FileText'
export { Keyboard } from '@tamagui/lucide-icons/icons/Keyboard'
export { Menu } from '@tamagui/lucide-icons/icons/Menu'
export { Moon } from '@tamagui/lucide-icons/icons/Moon'
export { Settings } from '@tamagui/lucide-icons/icons/Settings'
export { Star } from '@tamagui/lucide-icons/icons/Star'
export { Sun } from '@tamagui/lucide-icons/icons/Sun'
export { TrendingUp } from '@tamagui/lucide-icons/icons/TrendingUp'
export { Trophy } from '@tamagui/lucide-icons/icons/Trophy'
export { Volume2 } from '@tamagui/lucide-icons/icons/Volume2'
export { X } from '@tamagui/lucide-icons/icons/X'
export { XCircle } from '@tamagui/lucide-icons/icons/XCircle'
