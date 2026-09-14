// Renders the game sounds to WAV for the native SoundService adapter.
//
// Web synthesises these live with WebAudio oscillators (SoundService/adapter.ts);
// React Native has no oscillator, so the same tone sequences are rendered once
// here and bundled as Metro assets. Keep the tables in sync with adapter.ts:
// each tone is (frequency Hz, duration s, wave) starting at `at` seconds, with
// gain 0.1 decaying exponentially to 0.01 over its duration.
//
//   node packages/app/scripts/render-sounds.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SAMPLE_RATE = 44100
const TAIL_S = 0.05

const sounds = {
  correct: [
    { at: 0, hz: 523.25, dur: 0.2, wave: 'sine' },
    { at: 0.1, hz: 659.25, dur: 0.2, wave: 'sine' },
    { at: 0.2, hz: 783.99, dur: 0.3, wave: 'sine' }
  ],
  incorrect: [
    { at: 0, hz: 349.23, dur: 0.3, wave: 'square' },
    { at: 0.15, hz: 293.66, dur: 0.4, wave: 'square' }
  ],
  complete: [
    { at: 0, hz: 523.25, dur: 0.2, wave: 'sine' },
    { at: 0.1, hz: 659.25, dur: 0.2, wave: 'sine' },
    { at: 0.2, hz: 783.99, dur: 0.2, wave: 'sine' },
    { at: 0.3, hz: 1046.5, dur: 0.4, wave: 'sine' }
  ],
  'early-win': [
    { at: 0, hz: 880, dur: 0.15, wave: 'sine' },
    { at: 0.08, hz: 1174.66, dur: 0.15, wave: 'sine' },
    { at: 0.16, hz: 1396.91, dur: 0.15, wave: 'sine' },
    { at: 0.24, hz: 1760, dur: 0.3, wave: 'sine' }
  ]
}

const render = (tones) => {
  const length = Math.ceil((Math.max(...tones.map((t) => t.at + t.dur)) + TAIL_S) * SAMPLE_RATE)
  const buf = new Float64Array(length)
  for (const { at, hz, dur, wave } of tones) {
    const start = Math.round(at * SAMPLE_RATE)
    const n = Math.round(dur * SAMPLE_RATE)
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE
      const gain = 0.1 * Math.pow(0.1, t / dur) // 0.1 → 0.01 exponential ramp
      const phase = Math.sin(2 * Math.PI * hz * t)
      const sample = wave === 'square' ? Math.sign(phase) : phase
      buf[start + i] += gain * sample
    }
  }
  return buf
}

const toWav = (samples) => {
  const data = Buffer.alloc(samples.length * 2)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    data.writeInt16LE(Math.round(s * 32767), i * 2)
  }
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVE', 8)
  header.write('fmt ', 12)
  header.writeUInt32LE(16, 16) // PCM chunk size
  header.writeUInt16LE(1, 20) // PCM
  header.writeUInt16LE(1, 22) // mono
  header.writeUInt32LE(SAMPLE_RATE, 24)
  header.writeUInt32LE(SAMPLE_RATE * 2, 28) // byte rate
  header.writeUInt16LE(2, 32) // block align
  header.writeUInt16LE(16, 34) // bits per sample
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds')
mkdirSync(outDir, { recursive: true })
for (const [name, tones] of Object.entries(sounds)) {
  const wav = toWav(render(tones))
  writeFileSync(join(outDir, `${name}.wav`), wav)
  console.log(`${name}.wav  ${(wav.length / 1024).toFixed(1)} KiB`)
}
