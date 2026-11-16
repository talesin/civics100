// Metro asset imports (the native SoundService adapter bundles WAVs from
// packages/app/assets). Metro resolves the default export to an asset id
// that expo-audio accepts as an AudioSource; no web code imports these.
declare module '*.wav' {
  const source: number
  export default source
}
