/**
 * Shared contract for the platform-split score ring on the results screen.
 * The web half draws the SVG arc the results page always had; the native half
 * is a Phase 5 stub (solid ring) until Phase 6 adds react-native-svg.
 */
export interface ScoreRingProps {
  readonly percentage: number
  /** Selects the accent (pass) or error (fail) stroke. */
  readonly passed: boolean
}
