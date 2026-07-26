import { describe, expect, it } from '@jest/globals'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { platform } from './fixtures/platformProbe'

describe('native test harness', () => {
  it('resolves .native.ts over .ts (haste platform resolution)', () => {
    expect(platform).toBe('native')
  })

  it('round-trips through the AsyncStorage jest mock', async () => {
    await AsyncStorage.setItem('probe_key', 'probe_value')
    expect(await AsyncStorage.getItem('probe_key')).toBe('probe_value')

    await AsyncStorage.removeItem('probe_key')
    expect(await AsyncStorage.getItem('probe_key')).toBeNull()

    await AsyncStorage.setItem('probe_key', 'again')
    await AsyncStorage.clear()
    expect(await AsyncStorage.getItem('probe_key')).toBeNull()
  })
})
