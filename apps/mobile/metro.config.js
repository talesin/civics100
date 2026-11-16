// Metro config for apps/mobile.
// Two jobs:
//   1. Tamagui native compilation via @tamagui/metro-plugin (paired with the babel plugin).
//   2. Monorepo resolution so `questionnaire`/`questionnaire/data` resolve to the repo's
//      built dist/ via npm-hoisted workspace packages.
const { getDefaultConfig } = require('expo/metro-config')
const { withTamagui } = require('@tamagui/metro-plugin')
const path = require('path')

const projectRoot = __dirname
// apps/mobile -> apps -> repo root
const repoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// --- Monorepo: watch the whole repo and resolve hoisted + local node_modules ---
config.watchFolders = [repoRoot]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(repoRoot, 'node_modules'),
]
// Honor the ESM "exports" maps in workspace packages (so `questionnaire/data` resolves
// to ./dist/data/index.js, and questionnaire's data chunk can reach `civics2json/Questions`
// — a subpath resolvable ONLY via civics2json's "exports" map). REQUIRED, per Phase-0
// finding #3: without this Metro ignores subpath exports and the graph fails to resolve.
config.resolver.unstable_enablePackageExports = true

// --- Phase-0 carry-forward #4 (effect "." export under `expo export`) ---
// `metro build` resolves effect's "." export, but Expo CLI's `expo export` injected its
// own resolver conditions that FAILED on it in the spike. apps/mobile lives INSIDE the
// workspace (effect is hoisted), so re-validate `expo export` first. If it still fails to
// resolve effect's "." export, enable this shim mapping bare `effect` to its package main:
//
// const origResolveRequest = config.resolver.resolveRequest
// config.resolver.resolveRequest = (context, moduleName, platform) => {
//   if (moduleName === 'effect') {
//     return { type: 'sourceFile', filePath: require.resolve('effect') }
//   }
//   return (origResolveRequest ?? context.resolveRequest)(context, moduleName, platform)
// }

// --- Tamagui ---
module.exports = withTamagui(config, {
  components: ['tamagui'],
  config: './tamagui.config.ts',
})
