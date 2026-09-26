// Proves the monorepo's platform-split contract survives into the Hermes
// bundles: every packages/app/src *.native.{ts,tsx} file is bundled, its web
// sibling is not, no dev-only/CLI package leaks in, and every shared sound
// asset is registered for both platforms.
//
// Requires apps/mobile/dist/ from an `expo export --source-maps` run.
//
//   node apps/mobile/scripts/check-sourcemaps.mjs

import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const mobileRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(mobileRoot, '../..')
const appSrcDir = path.join(repoRoot, 'packages/app/src')
const soundsDir = path.join(repoRoot, 'packages/app/assets/sounds')
const metadataPath = path.join(mobileRoot, 'dist/metadata.json')

// Native halves that are legitimately absent from a given export (e.g. dead
// code pending removal) go here by their packages/app/src-relative path,
// exempting them from the "must be bundled" check only.
const UNBUNDLED_NATIVE_HALVES = new Set([])

const FORBIDDEN_SUBSTRINGS = [
  '/node_modules/lucide-react/',
  '/node_modules/@effect/platform-node/',
  '/node_modules/@effect/cli/'
]

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })

const findNativeHalves = () =>
  walk(appSrcDir)
    .filter((f) => f.endsWith('.native.ts') || f.endsWith('.native.tsx'))
    .map((f) => path.relative(appSrcDir, f))
    .sort()

const webSiblingsOf = (relativeHalf) => {
  const base = relativeHalf.replace(/\.native\.tsx?$/, '')
  return [`${base}.ts`, `${base}.tsx`]
}

// Expo names exported assets by the md5 of their contents, so a WAV's
// registration is found by hashing the source file, not by its filename.
const md5Of = (filePath) => createHash('md5').update(readFileSync(filePath)).digest('hex')

const findSoundAssets = () =>
  readdirSync(soundsDir)
    .filter((f) => f.endsWith('.wav'))
    .map((f) => ({ file: f, md5: md5Of(path.join(soundsDir, f)) }))

if (!statSync(metadataPath, { throwIfNoEntry: false })) {
  console.error('apps/mobile/dist/metadata.json not found — run `npm run bundlecheck -w mobile` first')
  process.exit(1)
}

const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
const platforms = Object.keys(metadata.fileMetadata ?? {})
const nativeHalves = findNativeHalves()
const soundAssets = findSoundAssets()

const problems = []
const summaries = []

for (const platform of ['ios', 'android']) {
  if (!platforms.includes(platform)) {
    problems.push(`${platform}: missing from metadata.fileMetadata`)
    continue
  }

  const entry = metadata.fileMetadata[platform]
  const mapPath = path.join(mobileRoot, 'dist', `${entry.bundle}.map`)
  if (!statSync(mapPath, { throwIfNoEntry: false })) {
    problems.push(`${platform}: source map not found at ${mapPath}`)
    continue
  }

  // Sources are rooted at the monorepo root with a leading slash, e.g.
  // /packages/app/src/haptics.native.ts.
  const map = JSON.parse(readFileSync(mapPath, 'utf8'))
  const sources = new Set(map.sources)

  let nativeHalvesFound = 0
  let webHalvesLeaked = 0
  for (const half of nativeHalves) {
    const sourcePath = `/packages/app/src/${half}`
    const isBundled = sources.has(sourcePath)
    if (isBundled) nativeHalvesFound++
    else if (!UNBUNDLED_NATIVE_HALVES.has(half)) problems.push(`${platform}: native half not bundled: ${half}`)

    for (const sibling of webSiblingsOf(half)) {
      const siblingPath = `/packages/app/src/${sibling}`
      if (sources.has(siblingPath)) {
        webHalvesLeaked++
        problems.push(`${platform}: web sibling leaked into bundle: ${sibling}`)
      }
    }
  }

  let forbiddenCount = 0
  for (const source of sources) {
    for (const needle of FORBIDDEN_SUBSTRINGS) {
      if (source.includes(needle)) {
        forbiddenCount++
        problems.push(`${platform}: forbidden path in sources: ${source}`)
      }
    }
  }

  let wavsFound = 0
  for (const { file, md5 } of soundAssets) {
    const registered = (entry.assets ?? []).some((a) => a.path === `assets/${md5}` && a.ext === 'wav')
    if (registered) wavsFound++
    else problems.push(`${platform}: sound asset not registered: ${file} (assets/${md5})`)
  }

  summaries.push(
    `${platform}: ${sources.size} sources · native halves ${nativeHalvesFound}/${nativeHalves.length} · ` +
      `web halves leaked ${webHalvesLeaked} · forbidden ${forbiddenCount} · wavs ${wavsFound}/${soundAssets.length}`
  )
}

for (const summary of summaries) console.log(summary)
for (const problem of problems) console.log(problem)

process.exit(problems.length > 0 ? 1 : 0)
