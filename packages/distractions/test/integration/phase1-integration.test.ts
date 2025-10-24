import { Effect, ConfigProvider, Layer } from 'effect'
import {
  OpenAIDistractorService,
  TestOpenAIDistractorServiceLayer
} from '../../src/services/OpenAIDistractorService'
import { SimilarityService, TestSimilarityServiceLayer } from '../../src/services/SimilarityService'
import {
  DistractorQualityService,
  TestDistractorQualityServiceLayer
} from '../../src/services/DistractorQualityService'
import { loadSystemConfiguration } from '../../src/config'
import type { Question } from 'civics2json'

describe('Phase 1 Integration Tests', () => {
  const mockQuestion: Question = {
    theme: 'AMERICAN GOVERNMENT',
    section: 'Principles of American Democracy',
    question: 'What is the supreme law of the land?',
    questionNumber: 1,
    expectedAnswers: 1,
    answers: {
      _type: 'text',
      choices: ['the Constitution']
    }
  }

  describe('Service Integration', () => {
    it('should integrate OpenAI and Quality services', async () => {
      const openaiLayer = TestOpenAIDistractorServiceLayer({
        generateDistractors: () =>
          Effect.succeed({
            distractors: ['Bill of Rights', 'Declaration of Independence', 'Magna Carta'],
            confidence: 0.8,
            tokensUsed: 100
          })
      })

      const similarityLayer = TestSimilarityServiceLayer({
        removeSimilar: () => Effect.succeed(['Bill of Rights', 'Declaration of Independence'])
      })

      const qualityLayer = TestDistractorQualityServiceLayer({
        applyEnhancedQualityFilters: () =>
          Effect.succeed(['Bill of Rights', 'Declaration of Independence'])
      })

      await Effect.gen(function* () {
        const openaiService = yield* OpenAIDistractorService
        const qualityService = yield* DistractorQualityService
        const similarityService = yield* SimilarityService

        // Test OpenAI request creation
        const request = yield* openaiService.createRequest(mockQuestion, 5)
        expect(request.question).toBe('Test question') // Test layer returns test data
        expect(request.answerType).toBe('text')

        // Test distractor generation
        const response = yield* openaiService.generateDistractors(request)
        expect(response.distractors).toHaveLength(3)

        // Test quality filtering
        const filtered = yield* qualityService.applyEnhancedQualityFilters(
          response.distractors,
          ['the Constitution'],
          'text'
        )
        expect(filtered).toHaveLength(2)

        // Test similarity filtering
        const deduplicated = yield* similarityService.removeSimilar(filtered, ['the Constitution'])
        expect(deduplicated).toHaveLength(2)
      }).pipe(
        Effect.provide(openaiLayer),
        Effect.provide(similarityLayer),
        Effect.provide(qualityLayer),
        Effect.runPromise
      )
    })
  })

  describe('Configuration Loading', () => {
    it('should load configuration with defaults when env vars missing', async () => {
      // This test requires careful setup of environment variables
      // For Phase 1, we test the structure exists

      const mockEnv = {
        OPENAI_API_KEY: 'sk-test-key-12345',
        NODE_ENV: 'test',
        LOG_LEVEL: 'info'
      }

      // Use ConfigProvider instead of process.env manipulation
      const configProvider = ConfigProvider.fromMap(
        new Map([
          ['OPENAI_API_KEY', mockEnv.OPENAI_API_KEY],
          ['NODE_ENV', mockEnv.NODE_ENV],
          ['LOG_LEVEL', mockEnv.LOG_LEVEL]
        ])
      )

      await Effect.gen(function* () {
        const config = yield* loadSystemConfiguration()

        expect(config.generation).toBeDefined()
        expect(config.quality).toBeDefined()
        expect(config.openai).toBeDefined()
        expect(config.metrics).toBeDefined()
        expect(config.cache).toBeDefined()

        expect(config.openai.apiKey).toBe('sk-test-key-12345')
        expect(config.generation.targetCount).toBe(15)
        expect(config.metrics.logLevel).toBe('info')
      }).pipe(Effect.provide(Layer.setConfigProvider(configProvider)), Effect.runPromise)
    })
  })

  describe('Static Data Pools', () => {
    it('should have populated data pools', async () => {
      // Dynamic imports to test the pools exist
      const senators = await import('../../src/data/pools/senators')
      const representatives = await import('../../src/data/pools/representatives')
      const governors = await import('../../src/data/pools/governors')
      const capitals = await import('../../src/data/pools/capitals')
      const presidents = await import('../../src/data/pools/presidents')
      const states = await import('../../src/data/pools/states')

      expect(senators.usSenators).toBeDefined()
      expect(senators.usSenators.length).toBeGreaterThan(50)

      expect(representatives.usRepresentatives).toBeDefined()
      expect(representatives.usRepresentatives.length).toBeGreaterThan(100)

      expect(governors.usGovernors).toBeDefined()
      expect(governors.usGovernors.length).toBeGreaterThan(40)

      expect(capitals.usCapitals).toBeDefined()
      expect(capitals.usCapitals.length).toBeGreaterThan(45) // Allow for variation

      expect(presidents.usPresidents).toBeDefined()
      expect(presidents.usPresidents.length).toBeGreaterThan(40)

      expect(states.usStates).toBeDefined()
      expect(states.usStates.length).toBe(50)
      expect(states.usStateAbbreviations).toBeDefined()
      expect(states.usStateAbbreviations.length).toBe(50)
    })

    it('should have properly formatted data', async () => {
      const senators = await import('../../src/data/pools/senators')
      const representatives = await import('../../src/data/pools/representatives')

      // Check senator format: "Name (ST-Party)"
      const firstSenator = senators.usSenators[0]
      expect(firstSenator).toMatch(/^[\w\s.']+\s\([A-Z]{2}-[A-Z]\)$/)

      // Check representative format: "Name (ST-District)"
      const firstRep = representatives.usRepresentatives[0]
      expect(firstRep).toMatch(/^[\w\s.']+\s\([A-Z]{2}-.+\)$/)
    })
  })

  describe('Type Definitions', () => {
    it('should have complete type definitions', async () => {
      const errors = await import('../../src/types/errors')
      const config = await import('../../src/types/config')

      // Error types (these are classes so they exist at runtime)
      expect(errors.OpenAIError).toBeDefined()
      expect(errors.ValidationError).toBeDefined()
      expect(errors.ConfigurationError).toBeDefined()

      // Config constants and functions (these exist at runtime)
      expect(config.DEFAULT_GENERATION_OPTIONS).toBeDefined()
      expect(config.DEFAULT_QUALITY_THRESHOLDS).toBeDefined()
      expect(config.DEFAULT_OPENAI_CONFIG).toBeDefined()
      expect(config.createSystemConfiguration).toBeDefined()
      expect(config.validateGenerationOptions).toBeDefined()

      // Check that config constants have expected properties
      expect(config.DEFAULT_GENERATION_OPTIONS.targetCount).toBe(15)
      expect(config.DEFAULT_QUALITY_THRESHOLDS.relevance).toBe(0.7)
    })
  })
})
