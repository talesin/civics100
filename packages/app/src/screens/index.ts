// Shared screens (exports-map subpath `app/screens`). Screens take navigation
// as callback props; the web routes wrap them in the web-only Layout and the
// mobile routes (Stage 17) supply expo-router calls.
export { default as ResultsScreen } from './ResultsScreen'
export type { ResultsScreenProps } from './ResultsScreen'
export { default as StatisticsScreen } from './StatisticsScreen'
export { default as HomeScreen } from './HomeScreen'
export type { HomeScreenProps } from './HomeScreen'
