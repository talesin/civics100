// Local alias: @tamagui/babel-plugin (babel.config.js) and @tamagui/metro-plugin
// (metro.config.js) load './tamagui.config.ts' in Node at build time, so this file
// stays here as a thin re-export. The canonical config lives in packages/app (Phase 2);
// its `declare module 'tamagui'` augmentation flows through this import.
import config from 'app/tamagui.config'

export type { AppConfig } from 'app/tamagui.config'
export default config
