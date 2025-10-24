import { describe, it, expect } from '@jest/globals'
import { Effect, ConfigProvider, Layer, Either } from 'effect'
import { DEFAULT_GENERATION_OPTIONS } from '../../src/types/config'

describe('CLI Integration Tests', () => {
  describe('CLI Options Parsing', () => {
    it('should have all required options defined', () => {
      // Test that our CLI options exist and have correct types
      // This is a smoke test to ensure the CLI structure is correct
      expect(DEFAULT_GENERATION_OPTIONS).toBeDefined()
      expect(DEFAULT_GENERATION_OPTIONS.regenAll).toBe(false)
      expect(DEFAULT_GENERATION_OPTIONS.regenIncomplete).toBe(false)
      expect(DEFAULT_GENERATION_OPTIONS.targetCount).toBe(15)
      expect(DEFAULT_GENERATION_OPTIONS.useOpenAI).toBe(true)
      expect(DEFAULT_GENERATION_OPTIONS.filterSimilar).toBe(true)
      expect(DEFAULT_GENERATION_OPTIONS.checkAnswers).toBe(true)
      expect(DEFAULT_GENERATION_OPTIONS.batchSize).toBe(10)
      expect(DEFAULT_GENERATION_OPTIONS.maxRetries).toBe(3)
    })

    it('should validate targetCount range', () => {
      const { validateGenerationOptions } = require('../../src/types/config')

      // Test min boundary (should clamp to 5)
      const tooLow = validateGenerationOptions({ targetCount: 2 })
      expect(tooLow.targetCount).toBe(5)

      // Test max boundary (should clamp to 20)
      const tooHigh = validateGenerationOptions({ targetCount: 50 })
      expect(tooHigh.targetCount).toBe(20)

      // Test valid value
      const valid = validateGenerationOptions({ targetCount: 15 })
      expect(valid.targetCount).toBe(15)
    })

    it('should validate batchSize range', () => {
      const { validateGenerationOptions } = require('../../src/types/config')

      // Test min boundary
      const tooLow = validateGenerationOptions({ batchSize: 0 })
      expect(tooLow.batchSize).toBe(1)

      // Test max boundary
      const tooHigh = validateGenerationOptions({ batchSize: 100 })
      expect(tooHigh.batchSize).toBe(50)

      // Test valid value
      const valid = validateGenerationOptions({ batchSize: 10 })
      expect(valid.batchSize).toBe(10)
    })
  })

  describe('Configuration Validation at Startup', () => {
    it('should validate configuration with all required env vars', async () => {
      const { createValidatedConfiguration } = require('../../src/config')

      const configProvider = ConfigProvider.fromMap(
        new Map([
          ['OPENAI_API_KEY', 'sk-test-valid-key-12345'],
          ['NODE_ENV', 'test'],
          ['LOG_LEVEL', 'info'],
          ['OPENAI_MODEL', 'gpt-5-mini'],
          ['DISTRACTOR_TARGET_COUNT', '10']
        ])
      )

      const program = Effect.gen(function* () {
        const config = yield* createValidatedConfiguration()

        // Validate structure
        expect(config.generation).toBeDefined()
        expect(config.quality).toBeDefined()
        expect(config.openai).toBeDefined()
        expect(config.metrics).toBeDefined()
        expect(config.cache).toBeDefined()

        // Validate values
        expect(config.openai.apiKey).toBe('sk-test-valid-key-12345')
        expect(config.openai.model).toBe('gpt-5-mini')
        expect(config.generation.targetCount).toBe(10)
        expect(config.generation.useOpenAI).toBe(false) // Disabled in test mode
      }).pipe(Effect.provide(Layer.setConfigProvider(configProvider)))

      await Effect.runPromise(program as any)
    })

    it('should accept valid API key format', async () => {
      const { createValidatedConfiguration } = require('../../src/config')

      const configProvider = ConfigProvider.fromMap(
        new Map([
          ['OPENAI_API_KEY', 'sk-valid-key-format-12345'],
          ['NODE_ENV', 'test']
        ])
      )

      const program = Effect.gen(function* () {
        return yield* createValidatedConfiguration()
      }).pipe(Effect.provide(Layer.setConfigProvider(configProvider)), Effect.either)

      const result: Either.Either<any, any> = await Effect.runPromise(program as any)

      expect(result._tag).toBe('Right')
      if (Either.isRight(result)) {
        expect(result.right.openai.apiKey).toBe('sk-valid-key-format-12345')
      }
    })

    it('should fail validation with missing API key', async () => {
      const { createValidatedConfiguration } = require('../../src/config')

      const configProvider = ConfigProvider.fromMap(
        new Map([
          ['NODE_ENV', 'test']
          // Missing OPENAI_API_KEY
        ])
      )

      const program = Effect.gen(function* () {
        return yield* createValidatedConfiguration()
      }).pipe(Effect.provide(Layer.setConfigProvider(configProvider)), Effect.either)

      const result: Either.Either<any, any> = await Effect.runPromise(program as any)

      expect(result._tag).toBe('Left')
      if (Either.isLeft(result)) {
        expect(result.left).toBeDefined()
      }
    })
  })

  describe('Generation Options Integration', () => {
    it('should create valid generation options from CLI defaults', () => {
      const options = {
        regenAll: false,
        regenIncomplete: false,
        targetCount: 15,
        filterSimilar: true,
        checkAnswers: true,
        useOpenAI: true,
        batchSize: 10,
        maxRetries: 3
      }

      expect(options.targetCount).toBeGreaterThanOrEqual(5)
      expect(options.targetCount).toBeLessThanOrEqual(20)
      expect(options.batchSize).toBeGreaterThanOrEqual(1)
      expect(options.batchSize).toBeLessThanOrEqual(50)
    })

    it('should handle custom generation options', () => {
      const { validateGenerationOptions } = require('../../src/types/config')

      const custom = validateGenerationOptions({
        regenAll: true,
        targetCount: 20,
        useOpenAI: false,
        batchSize: 5
      })

      expect(custom.regenAll).toBe(true)
      expect(custom.targetCount).toBe(20)
      expect(custom.useOpenAI).toBe(false)
      expect(custom.batchSize).toBe(5)
      expect(custom.filterSimilar).toBe(true) // Should use default
    })
  })

  describe('Service Layer Dependencies', () => {
    it('should define all required service layers', async () => {
      // Test that all services can be imported
      const { QuestionsDataService } = await import('../../src/data/QuestionsDataService')
      const { CuratedDistractorService } = await import('../../src/services/CuratedDistractorService')
      const { OpenAIDistractorService } = await import('../../src/services/OpenAIDistractorService')
      const { DistractorQualityService } = await import(
        '../../src/services/DistractorQualityService'
      )
      const { SimilarityService } = await import('../../src/services/SimilarityService')
      const { EnhancedStaticGenerator } = await import('../../src/generators/EnhancedStaticGenerator')
      const { DistractorManager } = await import('../../src/services/DistractorManager')

      expect(QuestionsDataService).toBeDefined()
      expect(CuratedDistractorService).toBeDefined()
      expect(OpenAIDistractorService).toBeDefined()
      expect(DistractorQualityService).toBeDefined()
      expect(SimilarityService).toBeDefined()
      expect(EnhancedStaticGenerator).toBeDefined()
      expect(DistractorManager).toBeDefined()

      // Check that Default layers exist
      expect(QuestionsDataService.Default).toBeDefined()
      expect(CuratedDistractorService.Default).toBeDefined()
      expect(OpenAIDistractorService.Default).toBeDefined()
      expect(DistractorQualityService.Default).toBeDefined()
      expect(SimilarityService.Default).toBeDefined()
      expect(EnhancedStaticGenerator.Default).toBeDefined()
      expect(DistractorManager.Default).toBeDefined()
    })
  })
})
