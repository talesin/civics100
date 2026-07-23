// Babel config for apps/mobile.
// Order matters: the worklets plugin MUST be last.
// NOTE (Phase-0 carry-forward): Expo SDK 56 ships react-native-reanimated@4.x, which
// MOVED its babel plugin out to `react-native-worklets/plugin`. The old
// `react-native-reanimated/plugin` path no longer exists on the v4 line.
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
      // Keep this LAST. (reanimated 4 => worklets plugin)
      'react-native-worklets/plugin',
    ],
  }
}
