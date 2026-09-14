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
  // Placeholder: the 512px PWA icon upscaled to the 1024px square iOS requires
  // (flattened onto white — icons may not carry alpha). Replace with real art
  // before store submission; the splash needs expo-splash-screen (host install).
  icon: './assets/icon.png',
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
  // Config plugins (Phase 6): expo-audio's plugin owns the microphone permission
  // strings — the app only plays bundled sounds, so the permission is turned off;
  // expo-font's plugin embeds the Newsreader statics natively. react-native-svg, async-storage, expo-speech, expo-haptics and
  // expo-system-ui autolink with no plugin. New-arch is enabled via `newArchEnabled`
  // above, so expo-build-properties stays deferred (native build tuning).
  plugins: [
    'expo-router',
    ['expo-audio', { microphonePermission: false }],
    [
      'expo-font',
      {
        // Newsreader statics: 14pt text cut (3 weights × roman/italic) + 36pt
        // display cut (Regular/Medium). packages/app/src/fonts.native.ts maps
        // weights to these faces (iOS PostScript names / Android file stems).
        fonts: [
          './assets/fonts/Newsreader_14pt-Regular.ttf',
          './assets/fonts/Newsreader_14pt-Italic.ttf',
          './assets/fonts/Newsreader_14pt-Medium.ttf',
          './assets/fonts/Newsreader_14pt-MediumItalic.ttf',
          './assets/fonts/Newsreader_14pt-SemiBold.ttf',
          './assets/fonts/Newsreader_14pt-SemiBoldItalic.ttf',
          './assets/fonts/Newsreader_36pt-Regular.ttf',
          './assets/fonts/Newsreader_36pt-Medium.ttf'
        ]
      }
    ]
  ],
  // `scheme` above + typedRoutes give type-safe <Link href> and near-free deep links.
  experiments: {
    typedRoutes: true,
  },
}

export default config
