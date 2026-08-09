/**
 * Platform-split icon module (same mechanism as animations.ts/.native.ts).
 *
 * Web (and tsc, which cannot resolve RN platform extensions) uses this file:
 * a straight re-export from lucide-react, pixel-identical with the icons the
 * website has always rendered. Metro resolves icons.native.ts instead, which
 * serves the same names from @tamagui/lucide-icons over react-native-svg —
 * lucide-react never enters the native bundle.
 *
 * Both halves MUST export the same set of names.
 */
export {
  AlertTriangle,
  ArrowRight,
  BarChart2,
  BookOpen,
  Check,
  CheckCircle,
  FileText,
  Keyboard,
  Menu,
  Moon,
  Settings,
  Star,
  Sun,
  TrendingUp,
  Trophy,
  Volume2,
  X,
  XCircle
} from 'lucide-react'
