import type { ExpoConfig } from 'expo/config'

// `newArchEnabled` is a valid runtime app-config field (default-on in SDK 56) but is not
// yet in the ExpoConfig TS type — widen locally so we can lock it explicitly per the
// Phase-0 matrix without losing structural checking on the rest of the object.
type AppExpoConfig = ExpoConfig & {
  newArchEnabled?: boolean
  jsEngine?: 'hermes' | 'jsc'
}

// Dynamic TypeScript app config (chosen over static app.json per the Phase 1 plan).
// `slug`, `ios.bundleIdentifier`, and `android.package` are effectively IMMUTABLE after
// store submission — fixed here in Phase 1 (changeable until Phase 7 submission).
const config: AppExpoConfig = {
  name: 'Civics Test',
  slug: 'civics100',
  scheme: 'civics100',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  // New Architecture + Hermes are the locked Phase-0 matrix defaults.
  newArchEnabled: true,
  jsEngine: 'hermes',
  ios: {
    bundleIdentifier: 'com.civics100.app',
    supportsTablet: true,
  },
  android: {
    package: 'com.civics100.app',
  },
  // expo-router is the only entry needing a config plugin. react-native-svg and
  // async-storage autolink (no plugin). New-arch is enabled via `newArchEnabled` above,
  // so expo-build-properties is deferred to Phase 6 (native build tuning).
  plugins: ['expo-router'],
  // `scheme` above + typedRoutes give type-safe <Link href> and near-free deep links.
  experiments: {
    typedRoutes: true,
  },
}

export default config
