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
  // before store submission, together with the splash icons below.
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
  // expo-font's plugin embeds the Newsreader statics natively; expo-splash-screen's
  // plugin owns the launch screen (SDK 56 has no top-level `splash` key).
  // react-native-svg, async-storage, expo-speech, expo-haptics and expo-system-ui
  // autolink with no plugin. New-arch is enabled via `newArchEnabled` above, so
  // expo-build-properties stays deferred (native build tuning). The local
  // plugins/withPodsDeploymentTarget.js patches the generated Podfile so pod
  // resource bundles meet Xcode 26+'s 15.0 deployment-target floor;
  // plugins/withDevMenuQuietLaunch.js keeps the dev menu from auto-opening
  // after a data reset and hides its floating button (the Maestro flows clear
  // state and tap the header toggle the button would otherwise cover).
  plugins: [
    'expo-router',
    './plugins/withPodsDeploymentTarget.js',
    './plugins/withDevMenuQuietLaunch.js',
    ['expo-audio', { microphonePermission: false }],
    [
      'expo-splash-screen',
      {
        // The "100" glyph lifted from the app icon (scripts/render-splash-icon.mjs)
        // over the editorial paper colours from packages/app/src/tamagui.config.ts —
        // ink on paper, and the dark theme's ink on dark paper. app/_layout.tsx holds
        // the splash until the saved theme preference is adopted, so the app's first
        // frame already matches whichever variant the OS showed.
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        dark: {
          image: './assets/splash-icon-dark.png',
          backgroundColor: '#0f172a'
        }
      }
    ],
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
