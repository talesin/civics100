import { describe, it, expect } from '@jest/globals'
import { getConfig } from '../src/utils'
import { Effect, Config, ConfigProvider } from 'effect'

describe('getConfig', () => {
  it('retrieves a single config value from process.env', async () => {
    const provider = ConfigProvider.fromJson({ TEST_KEY: 'foo' })
    const config = await getConfig(['TEST_KEY']).pipe(
      Effect.withConfigProvider(provider),
      Effect.runPromise
    )
    expect(config['TEST_KEY']).toBe('foo')
  })

  it('retrieves multiple config values from process.env', async () => {
    const provider = ConfigProvider.fromJson({ KEY1: 'one', KEY2: 'two' })
    const config = await getConfig(['KEY1', 'KEY2']).pipe(
      Effect.withConfigProvider(provider),
      Effect.runPromise
    )
    expect(config['KEY1']).toBe('one')
    expect(config['KEY2']).toBe('two')
  })

  it('uses alt.value fallback if env is missing', async () => {
    const provider = ConfigProvider.fromJson({})
    const config = await getConfig(['NOT_SET'], { NOT_SET: { value: 'fallback' } }).pipe(
      Effect.withConfigProvider(provider),
      Effect.runPromise
    )
    expect(config['NOT_SET']).toBe('fallback')
  })

  it('tries alt.keys in order if env is missing', async () => {
    const provider = ConfigProvider.fromJson({ FALLBACK1: 'bar' })
    const config = await getConfig(['NOT_SET'], {
      NOT_SET: { keys: ['NOT_SET', 'FALLBACK1'] }
    }).pipe(Effect.withConfigProvider(provider), Effect.runPromise)
    expect(config['NOT_SET']).toBe('bar')
  })

  it('throws if no env or alt fallback is provided', async () => {
    const provider = ConfigProvider.fromJson({})
    await expect(
      getConfig(['DOES_NOT_EXIST']).pipe(Effect.withConfigProvider(provider), Effect.runPromise)
    ).rejects.toThrow(/Expected DOES_NOT_EXIST to exist/)
  })

  it('works with multiple keys and mixed fallbacks', async () => {
    const provider = ConfigProvider.fromJson({ A: 'a', C: 'c' })
    const config = await getConfig(['A', 'B', 'C'], { B: { value: 'bee' } }).pipe(
      Effect.withConfigProvider(provider),
      Effect.runPromise
    )
    expect(config['A']).toBe('a')
    expect(config['B']).toBe('bee')
    expect(config['C']).toBe('c')
  })

  it('supports alt.config for custom Config', async () => {
    const customConfig = Config.succeed('custom!')
    const config = await getConfig(['CUSTOM'], { CUSTOM: { config: customConfig } }).pipe(
      Effect.withConfigProvider(ConfigProvider.fromJson({})),
      Effect.runPromise
    )
    expect(config['CUSTOM']).toBe('custom!')
  })

  it('throws if all alt.keys fail and no value is provided', async () => {
    const provider = ConfigProvider.fromJson({})
    await expect(
      getConfig(['Z'], { Z: { keys: ['FOO', 'BAR'] } }).pipe(
        Effect.withConfigProvider(provider),
        Effect.runPromise
      )
    ).rejects.toThrow(/Config for 'Z' does not exist|not found/)
  })
})
