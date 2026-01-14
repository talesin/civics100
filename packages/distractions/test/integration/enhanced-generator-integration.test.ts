import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import { EnhancedStaticGenerator } from '../../src/generators/EnhancedStaticGenerator'
import { TestQuestionsDataServiceLayer } from '../../src/data/QuestionsDataService'
import { TestCuratedDistractorServiceLayer } from '../../src/services/CuratedDistractorService'
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

    it('should select static-pool strategy for senator questions', async () => {
      const { selectDistractorStrategy } =
        await import('../../src/generators/EnhancedStaticGenerator')

      const options = { ...DEFAULT_GENERATION_OPTIONS, useOpenAI: true }

      await Effect.gen(function* () {
        const strategy = yield* selectDistractorStrategy(mockSenatorQuestion, options)
        expect(strategy).toBe('static-pool')
      }).pipe(Effect.runPromise)
    })

    it('should select section-based strategy when OpenAI is disabled', async () => {
      const { selectDistractorStrategy } =
        await import('../../src/generators/EnhancedStaticGenerator')

      const options = { ...DEFAULT_GENERATION_OPTIONS, useOpenAI: false }

      await Effect.gen(function* () {
        const strategy = yield* selectDistractorStrategy(mockTextQuestion, options)
        expect(strategy).toBe('section-based')
      }).pipe(Effect.runPromise)
    })
  })

  describe('Static Pool Generation', () => {
    it('should generate distractors from senator pool', async () => {
      const { generateFromStaticPools } =
        await import('../../src/generators/EnhancedStaticGenerator')

      await Effect.gen(function* () {
        const distractors = yield* generateFromStaticPools(mockSenatorQuestion, 10)

        expect(distractors.length).toBeGreaterThan(0)
        expect(distractors.length).toBeLessThanOrEqual(10)

        // Should not include the correct answer
        expect(distractors).not.toContain('Dianne Feinstein (CA-D)')
      }).pipe(Effect.runPromise)
    })

    it('should filter out correct answers from pool', async () => {
      const { generateFromStaticPools } =
        await import('../../src/generators/EnhancedStaticGenerator')

      await Effect.gen(function* () {
        const distractors = yield* generateFromStaticPools(mockTextQuestion, 10)

        // Should not include 'the Constitution' or similar
        const hasCorrectAnswer = distractors.some((d) => d.toLowerCase().includes('constitution'))
        expect(hasCorrectAnswer).toBe(false)
      }).pipe(Effect.runPromise)
    })
  })

  describe('Section-Based Generation', () => {
    it('should generate distractors from same section', async () => {
      const { generateFromSection } = await import('../../src/generators/EnhancedStaticGenerator')

      const otherQuestion: Question = {
        theme: 'AMERICAN GOVERNMENT',
        section: 'Principles of American Democracy',
        question: 'What does the Constitution do?',
        questionNumber: 2,
        expectedAnswers: 1,
        answers: {
          _type: 'text',
          choices: ['sets up the government', 'defines the government']
        }
      }

      const allQuestions = [mockTextQuestion, otherQuestion]

      await Effect.gen(function* () {
        const distractors = yield* generateFromSection(mockTextQuestion, allQuestions, 5)

        // Should get answers from other questions in same section
        expect(distractors.length).toBeGreaterThan(0)

        // Should not include correct answer from source question
        expect(distractors).not.toContain('the Constitution')
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

      const curatedLayer = TestCuratedDistractorServiceLayer({
        getDistractorsForQuestion: () => []
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
        Effect.provide(curatedLayer),
        Effect.provide(openaiLayer),
        Effect.provide(qualityLayer),
        Effect.provide(similarityLayer),
        Effect.provide(EnhancedStaticGenerator.Default),
        Effect.runPromise
      )
    })
  })
})
