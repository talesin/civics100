// Renders the expo-splash-screen icons from the placeholder app icon.
//
// The PWA icon (website/public/icons/icon-512.png) is a white "100" on an
// opaque blue→red gradient, and the splash plugin wants a transparent PNG
// drawn over the editorial paper colour. The glyph is lifted out as an alpha
// mask — the gradient never has a colour channel above ~95 and the glyph
// interior is ≥240, so min(r, g, b) ramps between those two as coverage —
// bilinear-upscaled to the 1024² the plugin recommends, then tinted:
// editorial ink for the light splash and the dark theme's ink for the dark
// variant (tamagui.config.ts `editorialInk` / `editorialInkDark`).
//
// pngjs is a hoisted transitive dependency (no sharp: it has no arm64 binary
// in the sandbox). Replace both outputs with real art before store submission.
//
//   node apps/mobile/scripts/render-splash-icon.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pngjs from 'pngjs'

const { PNG } = pngjs

const here = dirname(fileURLToPath(import.meta.url))
const SOURCE = join(here, '../../../website/public/icons/icon-512.png')
const OUT_DIR = join(here, '../assets')
const OUT_SIZE = 1024
const BACKGROUND_MAX = 96 // min channel at or below this is gradient
const GLYPH_MIN = 240 // min channel at or above this is solid glyph

const variants = {
  'splash-icon.png': [0x11, 0x18, 0x27], // editorialInk
  'splash-icon-dark.png': [0xe2, 0xe8, 0xf0] // editorialInkDark
}

const source = PNG.sync.read(readFileSync(SOURCE))
const { width: sw, height: sh, data } = source

// Coverage in [0, 1] per source pixel.
const coverage = new Float32Array(sw * sh)
for (let i = 0; i < sw * sh; i++) {
  const m = Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
  coverage[i] = Math.min(1, Math.max(0, (m - BACKGROUND_MAX) / (GLYPH_MIN - BACKGROUND_MAX)))
}

const sampleCoverage = (x, y) => {
  const cx = Math.min(sw - 1, Math.max(0, x))
  const cy = Math.min(sh - 1, Math.max(0, y))
  return coverage[cy * sw + cx]
}

const bilinear = (fx, fy) => {
  const x0 = Math.floor(fx)
  const y0 = Math.floor(fy)
  const tx = fx - x0
  const ty = fy - y0
  const top = sampleCoverage(x0, y0) * (1 - tx) + sampleCoverage(x0 + 1, y0) * tx
  const bottom = sampleCoverage(x0, y0 + 1) * (1 - tx) + sampleCoverage(x0 + 1, y0 + 1) * tx
  return top * (1 - ty) + bottom * ty
}

const scale = sw / OUT_SIZE
for (const [file, [r, g, b]] of Object.entries(variants)) {
  const out = new PNG({ width: OUT_SIZE, height: OUT_SIZE })
  for (let y = 0; y < OUT_SIZE; y++) {
    for (let x = 0; x < OUT_SIZE; x++) {
      const a = bilinear((x + 0.5) * scale - 0.5, (y + 0.5) * scale - 0.5)
      const o = (y * OUT_SIZE + x) * 4
      out.data[o] = r
      out.data[o + 1] = g
      out.data[o + 2] = b
      out.data[o + 3] = Math.round(a * 255)
    }
  }
  writeFileSync(join(OUT_DIR, file), PNG.sync.write(out))
  console.log(`wrote ${file}`)
}
