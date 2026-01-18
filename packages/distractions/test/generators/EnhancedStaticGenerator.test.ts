import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import type { Question } from 'civics2json'
import {
  analyzeComplexity,
  estimateCost,
  getFallbackChain,
  selectDistractorStrategy,
  getTemporalContext,
  generateFromStaticPools
} from '../../src/generators/EnhancedStaticGenerator'
import { DEFAULT_GENERATION_OPTIONS } from '../../src/types/config'

describe('EnhancedStaticGenerator Unit Tests', () => {
  // Test fixtures
  const createQuestion = (
    question: string,
    answerType: Question['answers']['_type'] = 'text',
    choices: Question['answers']['choices'] = ['Test answer']
  ): Question =>
    ({
      theme: 'AMERICAN GOVERNMENT',
      section: 'Principles of American Democracy',
      question,
      questionNumber: 1,
      expectedAnswers: 1,
      answers: { _type: answerType, choices }
    }) as Question

  describe('analyzeComplexity', () => {
    it('should classify "What is..." questions as simple-fact', () => {
      const question = createQuestion('What is the supreme law of the land?')
      const complexity = analyzeComplexity(question)

      expect(complexity.type).toBe('simple-fact')
      expect(complexity.difficulty).toBe(1)
      expect(complexity.cognitiveLevel).toBe('recall')
    })

    it('should classify "Who is..." questions as simple-fact', () => {
      const question = createQuestion('Who is the Commander in Chief of the military?')
      const complexity = analyzeComplexity(question)

      expect(complexity.type).toBe('simple-fact')
      expect(complexity.difficulty).toBe(1)
      expect(complexity.cognitiveLevel).toBe('recall')
    })

    it('should classify "Name..." questions as simple-fact', () => {
      const question = createQuestion('Name one branch of the government.')
      const complexity = analyzeComplexity(question)

      expect(complexity.type).toBe('simple-fact')
      expect(complexity.difficulty).toBe(2)
      expect(complexity.cognitiveLevel).toBe('recall')
    })

    it('should classify "Why..." questions as conceptual', () => {
      const question = createQuestion('Why did the colonists fight the British?')
      const complexity = analyzeComplexity(question)

      expect(complexity.type).toBe('conceptual')
      expect(complexity.difficulty).toBe(3)
      expect(complexity.cognitiveLevel).toBe('understand')
    })

    it('should classify comparison questions as comparative', () => {
      const question = createQuestion('Compare and contrast the House and the Senate.')
      const complexity = analyzeComplexity(question)

      expect(complexity.type).toBe('comparative')
      expect(complexity.difficulty).toBe(4)
      expect(complexity.cognitiveLevel).toBe('analyze')
    })

    it('should detect difference keyword even in "What is" questions', () => {
      // Comparison keywords are checked FIRST, before simple-fact patterns
      // so "What is the difference" should be classified as comparative
      const question = createQuestion('What is the difference between the House and the Senate?')
      const complexity = analyzeComplexity(question)

      expect(complexity.type).toBe('comparative')
      expect(complexity.difficulty).toBe(4)
      expect(complexity.cognitiveLevel).toBe('analyze')
    })

    it('should classify "How many..." questions as simple-fact', () => {
      const question = createQuestion('How many amendments does the Constitution have?')
      const complexity = analyzeComplexity(question)

      expect(complexity.type).toBe('simple-fact')
      expect(complexity.difficulty).toBe(2)
      expect(complexity.cognitiveLevel).toBe('recall')
    })

    it('should classify "What does..." questions as conceptual', () => {
      const question = createQuestion('What does the judicial branch do?')
      const complexity = analyzeComplexity(question)

      expect(complexity.type).toBe('conceptual')
      expect(complexity.difficulty).toBe(3)
      expect(complexity.cognitiveLevel).toBe('understand')
    })
  })

  describe('estimateCost', () => {
    it('should return zero cost for non-OpenAI strategies', () => {
      const question = createQuestion('Test question')

      const estimate = estimateCost(question, 'static-pool')

      expect(estimate.estimatedTokens).toBe(0)
      expect(estimate.estimatedCost).toBe(0)
      expect(estimate.shouldUseOpenAI).toBe(false)
    })

    it('should estimate cost for OpenAI text strategy', () => {
      const question = createQuestion('What is the supreme law of the land?')

      const estimate = estimateCost(question, 'openai-text')

      expect(estimate.estimatedTokens).toBeGreaterThan(0)
      expect(estimate.estimatedCost).toBeGreaterThan(0)
      expect(estimate.shouldUseOpenAI).toBe(true) // Cost should be under $0.001
    })

    it('should recommend OpenAI for normal question lengths', () => {
      const question = createQuestion(
        'What is the supreme law of the land? This is a test question that is reasonably short.'
      )

      const estimate = estimateCost(question, 'openai-text')

      expect(estimate.shouldUseOpenAI).toBe(true)
    })
  })

  describe('getFallbackChain', () => {
    it('should return static-pool chain for senator questions', () => {
      const question = createQuestion('Who is one of your state senators?', 'senator', [
        { senator: 'John Smith (CA-D)', state: 'CA' }
      ])

      const chain = getFallbackChain(question)

      expect(chain[0]).toBe('static-pool')
      expect(chain).not.toContain('openai-text')
    })

    it('should return static-pool chain for representative questions', () => {
      const question = createQuestion('Who is your representative?', 'representative', [
        { representative: 'Jane Doe (CA-12)', state: 'CA', district: '12' }
      ])

      const chain = getFallbackChain(question)

      expect(chain[0]).toBe('static-pool')
    })

    it('should return openai-first chain for conceptual text questions', () => {
      const question = createQuestion('Why did the colonists fight the British?')

      const chain = getFallbackChain(question)

      expect(chain[0]).toBe('openai-text')
    })

    it('should return openai-first chain for comparative questions', () => {
      const question = createQuestion(
        'What is the difference between a senator and a representative?'
      )

      const chain = getFallbackChain(question)

      expect(chain[0]).toBe('openai-text')
    })

    it('should include fallback options in chain', () => {
      const question = createQuestion('What is the supreme law of the land?')

      const chain = getFallbackChain(question)

      expect(chain.length).toBeGreaterThan(1)
    })
  })

  describe('selectDistractorStrategy', () => {
    it('should select openai-text for text questions with OpenAI enabled', async () => {
      const question = createQuestion('What is the supreme law of the land?')
      const options = { ...DEFAULT_GENERATION_OPTIONS, useOpenAI: true }

      const strategy = await Effect.runPromise(selectDistractorStrategy(question, options))

      expect(strategy).toBe('openai-text')
    })

    it('should select section-based for text questions with OpenAI disabled', async () => {
      const question = createQuestion('What is the supreme law of the land?')
      const options = { ...DEFAULT_GENERATION_OPTIONS, useOpenAI: false }

      const strategy = await Effect.runPromise(selectDistractorStrategy(question, options))

      expect(strategy).toBe('section-based')
    })

    it('should select static-pool for senator questions regardless of OpenAI setting', async () => {
      const question = createQuestion('Who is one of your state senators?', 'senator', [
        { senator: 'John Smith (CA-D)', state: 'CA' }
      ])
      const options = { ...DEFAULT_GENERATION_OPTIONS, useOpenAI: true }

      const strategy = await Effect.runPromise(selectDistractorStrategy(question, options))

      expect(strategy).toBe('static-pool')
    })

    it('should select static-pool for governor questions', async () => {
      const question = createQuestion('Who is the governor of your state?', 'governor', [
        { governor: 'John Doe', state: 'CA' }
      ])
      const options = { ...DEFAULT_GENERATION_OPTIONS, useOpenAI: true }

      const strategy = await Effect.runPromise(selectDistractorStrategy(question, options))

      expect(strategy).toBe('static-pool')
    })
  })

  describe('getTemporalContext', () => {
    it('should identify historical founding era questions', () => {
      const question = createQuestion('What did the founding fathers establish?')

      const context = getTemporalContext(question)

      expect(context.era).toBe('historical')
      expect(context.relevantYears).toEqual([1776, 1865])
    })

    it('should identify Civil War era questions', () => {
      const question = createQuestion('What was one result of the Civil War?')

      const context = getTemporalContext(question)

      expect(context.era).toBe('historical')
      expect(context.relevantYears).toEqual([1850, 1877])
    })

    it('should identify current questions', () => {
      const question = createQuestion('Who is the President of the United States now?')

      const context = getTemporalContext(question)

      expect(context.era).toBe('current')
    })

    it('should default to modern era', () => {
      const question = createQuestion('What is the economic system in the United States?')

      const context = getTemporalContext(question)

      expect(context.era).toBe('modern')
    })
  })

  describe('generateFromStaticPools', () => {
    it('should generate distractors from senator pool', async () => {
      const question = createQuestion('Who is one of your state senators?', 'senator', [
        { senator: 'Dianne Feinstein (CA-D)', state: 'CA' }
      ])

      const distractors = await Effect.runPromise(generateFromStaticPools(question, 10))

      expect(distractors.length).toBeGreaterThan(0)
      expect(distractors.length).toBeLessThanOrEqual(10)
      // Should not include the correct answer
      expect(distractors).not.toContain('Dianne Feinstein (CA-D)')
    })

    it('should generate distractors from governor pool', async () => {
      const question = createQuestion('Who is the governor of your state?', 'governor', [
        { governor: 'Gavin Newsom', state: 'CA' }
      ])

      const distractors = await Effect.runPromise(generateFromStaticPools(question, 5))

      expect(distractors.length).toBeGreaterThan(0)
      expect(distractors.length).toBeLessThanOrEqual(5)
    })

    it('should generate distractors from capital pool', async () => {
      const question = createQuestion('What is the capital of your state?', 'capital', [
        { capital: 'Sacramento', state: 'CA' }
      ])

      const distractors = await Effect.runPromise(generateFromStaticPools(question, 5))

      expect(distractors.length).toBeGreaterThan(0)
      // Should not include Sacramento
      expect(distractors.some((d) => d.toLowerCase().includes('sacramento'))).toBe(false)
    })

    it('should filter out correct answers from pool', async () => {
      const question = createQuestion('Who is one of your state senators?', 'senator', [
        { senator: 'Alex Padilla (CA-D)', state: 'CA' }
      ])

      const distractors = await Effect.runPromise(generateFromStaticPools(question, 10))

      // Should not contain the correct answer or variations
      const hasCorrectAnswer = distractors.some((d) => d.toLowerCase().includes('alex padilla'))
      expect(hasCorrectAnswer).toBe(false)
    })
  })
})
