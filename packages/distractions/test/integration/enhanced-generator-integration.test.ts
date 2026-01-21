import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import { EnhancedStaticGenerator } from '../../src/generators/EnhancedStaticGenerator'
import { TestQuestionsDataServiceLayer } from '../../src/data/QuestionsDataService'
import { TestFallbackDistractorServiceLayer } from '../../src/services/FallbackDistractorService'
import { TestOpenAIDistractorServiceLayer } from '../../src/services/OpenAIDistractorService'
import { TestDistractorQualityServiceLayer } from '../../src/services/DistractorQualityService'
import { TestSimilarityServiceLayer } from '../../src/services/SimilarityService'
import { DEFAULT_GENERATION_OPTIONS } from '../../src/types/config'
import type { Question } from 'civics2json'

describe('EnhancedStaticGenerator Integration Tests', () => {
  const mockTextQuestion: Question = {
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

  const mockSenatorQuestion: Question = {
    theme: 'AMERICAN GOVERNMENT',
    section: 'System of Government',
    question: 'Who is one of your state U.S. Senators now?',
    questionNumber: 20,
    expectedAnswers: 1,
    answers: {
      _type: 'senator',
      choices: [{ senator: 'Dianne Feinstein (CA-D)', state: 'CA' }]
    }
  }

  describe('Strategy Selection', () => {
    it('should select openai-text strategy for text questions with OpenAI enabled', async () => {
      const { selectDistractorStrategy } =
        await import('../../src/generators/EnhancedStaticGenerator')

      const options = { ...DEFAULT_GENERATION_OPTIONS, useOpenAI: true }

      await Effect.gen(function* () {
        const strategy = yield* selectDistractorStrategy(mockTextQuestion, options)
        expect(strategy).toBe('openai-text')
      }).pipe(Effect.runPromise)
    })

    it('should select fallback strategy for senator questions with OpenAI disabled', async () => {
      const { selectDistractorStrategy } =
        await import('../../src/generators/EnhancedStaticGenerator')

      const options = { ...DEFAULT_GENERATION_OPTIONS, useOpenAI: false }

      await Effect.gen(function* () {
        const strategy = yield* selectDistractorStrategy(mockSenatorQuestion, options)
        expect(strategy).toBe('fallback')
      }).pipe(Effect.runPromise)
    })

    it('should select fallback strategy when OpenAI is disabled', async () => {
      const { selectDistractorStrategy } =
        await import('../../src/generators/EnhancedStaticGenerator')

      const options = { ...DEFAULT_GENERATION_OPTIONS, useOpenAI: false }

      await Effect.gen(function* () {
        const strategy = yield* selectDistractorStrategy(mockTextQuestion, options)
        expect(strategy).toBe('fallback')
      }).pipe(Effect.runPromise)
    })
  })

  describe('Integration Smoke Tests', () => {
    it('should have EnhancedStaticGenerator service available', () => {
      expect(EnhancedStaticGenerator).toBeDefined()
      expect(EnhancedStaticGenerator.Default).toBeDefined()
    })

    it('should provide generateEnhanced function', async () => {
      const mockQuestions = [mockTextQuestion]

      const questionsLayer = TestQuestionsDataServiceLayer({
        getAllQuestions: () => Effect.succeed(mockQuestions)
      })

      const fallbackLayer = TestFallbackDistractorServiceLayer({
        getFallbackDistractors: () => []
      })

      const openaiLayer = TestOpenAIDistractorServiceLayer()

      const qualityLayer = TestDistractorQualityServiceLayer()

      const similarityLayer = TestSimilarityServiceLayer()

      await Effect.gen(function* () {
        const generator = yield* EnhancedStaticGenerator

        expect(generator.generateEnhanced).toBeDefined()
        expect(typeof generator.generateEnhanced).toBe('function')
      }).pipe(
        Effect.provide(questionsLayer),
        Effect.provide(fallbackLayer),
        Effect.provide(openaiLayer),
        Effect.provide(qualityLayer),
        Effect.provide(similarityLayer),
        Effect.provide(EnhancedStaticGenerator.Default),
        Effect.runPromise
      )
    })
  })
})
