/**
 * Extended Window interface for browser-specific audio APIs
 */
interface Window {
  /**
   * WebKit-prefixed AudioContext for older Safari browsers
   * @deprecated Use standard AudioContext when available
   */
  webkitAudioContext?: typeof AudioContext
}
