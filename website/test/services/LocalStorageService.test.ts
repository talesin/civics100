import { describeStorageContract } from 'app/services/testing/storageContract'
import { LocalStorageService } from '@/services/LocalStorageService'

// The shared contract suite runs here against the WEB layer (jsdom
// localStorage); apps/mobile runs the same suite against the native
// AsyncStorage layer under jest-expo.
describeStorageContract({
  label: 'web/localStorage (jsdom)',
  layer: LocalStorageService.Default,
  reset: () => {
    window.localStorage.clear()
  }
})
