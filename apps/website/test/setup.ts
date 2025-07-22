/* eslint-disable @typescript-eslint/no-explicit-any */
// Test setup file to provide required globals for Effect-TS and browser APIs

import { TextEncoder, TextDecoder } from 'util'
import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for Effect-TS
global.TextEncoder = TextEncoder as any
global.TextDecoder = TextDecoder as any

// Mock localStorage if needed (jsdom provides this but keeping as backup)
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => Object.keys(store)[index] ?? null
  }
})()

if (
  typeof window !== 'undefined' &&
  window.localStorage !== undefined &&
  window.localStorage === null
) {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  })
}
