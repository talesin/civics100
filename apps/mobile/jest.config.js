/**
 * jest-expo harness for the native-side contract tests.
 *
 * The jest-expo preset (via @react-native/jest-preset) sets
 * haste: { defaultPlatform: 'ios', platforms: ['android', 'ios', 'native'] },
 * so imports of platform-split files inside packages/app resolve `.native.ts`
 * by the same platform-extension mechanism Metro uses — that resolution is
 * part of what this suite exists to prove.
 */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  setupFiles: ['<rootDir>/test/jest.setup.js'],
  moduleNameMapper: {
    // Reach the source-shipped shared package directly at its TS source
    // (its exports map is ESM-only; jest's resolver can't consume it).
    // Mirrors website/jest.config.ts.
    '^app$': '<rootDir>/../../packages/app/src/index.ts',
    '^app/(.*)$': '<rootDir>/../../packages/app/src/$1'
  },
  // Setting this key REPLACES the preset's array, so the first entry is copied
  // verbatim from node_modules/jest-expo/jest-preset.js with `effect|@effect`
  // appended (effect v3 ships ESM that babel-jest must transform).
  transformIgnorePatterns: [
    '/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|effect|@effect))',
    '/node_modules/react-native-reanimated/plugin/',
    '/node_modules/@react-native/babel-preset/'
  ]
}
