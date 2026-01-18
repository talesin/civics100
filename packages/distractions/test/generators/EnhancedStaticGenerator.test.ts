import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import type { Question } from 'civics2json'
import { selectDistractorStrategy, padDistractors } from '../../src/generators/EnhancedStaticGenerator'
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

  describe('selectDistractorStrategy', () => {
    it('should select openai-text for questions with OpenAI enabled', async () => {
      const question = createQuestion('What is the supreme law of the land?')
      const options = { ...DEFAULT_GENERATION_OPTIONS, useOpenAI: true }

      const strategy = await Effect.runPromise(selectDistractorStrategy(question, options))

      expect(strategy).toBe('openai-text')
    })

    it('should select fallback for questions with OpenAI disabled', async () => {
      const question = createQuestion('What is the supreme law of the land?')
      const options = { ...DEFAULT_GENERATION_OPTIONS, useOpenAI: false }

      const strategy = await Effect.runPromise(selectDistractorStrategy(question, options))

      expect(strategy).toBe('fallback')
    })

    it('should select openai-text for senator questions with OpenAI enabled', async () => {
      const question = createQuestion('Who is one of your state senators?', 'senator', [
        { senator: 'John Smith (CA-D)', state: 'CA' }
      ])
      const options = { ...DEFAULT_GENERATION_OPTIONS, useOpenAI: true }

      const strategy = await Effect.runPromise(selectDistractorStrategy(question, options))

      expect(strategy).toBe('openai-text')
    })

    it('should select fallback for senator questions with OpenAI disabled', async () => {
      const question = createQuestion('Who is one of your state senators?', 'senator', [
        { senator: 'John Smith (CA-D)', state: 'CA' }
      ])
      const options = { ...DEFAULT_GENERATION_OPTIONS, useOpenAI: false }

      const strategy = await Effect.runPromise(selectDistractorStrategy(question, options))

      expect(strategy).toBe('fallback')
    })
  })

  describe('padDistractors behavior', () => {
    // Create test questions for padding tests
    const govFormQuestion = createQuestion(
      'What is the form of government of the United States?',
      'text',
      ['Republic', 'Constitution-based federal republic', 'Representative democracy']
    )

    const correctAnswers = [
      'Republic',
      'Constitution-based federal republic',
      'Representative democracy'
    ]

    // Mock fallback service with some pre-defined fallbacks
    const mockFallbackService = {
      _tag: 'FallbackDistractorService' as const,
      getFallbackDistractors: () => [
        'Fallback 1',
        'Fallback 2',
        'Fallback 3',
        'Fallback 4',
        'Fallback 5'
      ],
      hasFallbackDistractors: () => true,
      getFallbackEntry: () => undefined,
      getFallbackCount: () => 5
    }

    it('should use fallback distractors when padding is needed', async () => {
      const openAIDistractors = ['Theocracy', 'Oligarchy', 'Plutocracy']
      const targetCount = 8

      const result = await Effect.runPromise(
        padDistractors(
          openAIDistractors,
          targetCount,
          govFormQuestion,
          correctAnswers,
          mockFallbackService
        )
      )

      // Should contain original distractors plus fallback distractors
      expect(result).toContain('Theocracy')
      expect(result).toContain('Oligarchy')
      expect(result).toContain('Plutocracy')
      expect(result.length).toBe(8) // 3 original + 5 fallback
    })

    it('should return original distractors when already at target count', async () => {
      const openAIDistractors = Array.from({ length: 10 }, (_, i) => `Distractor ${i + 1}`)
      const targetCount = 10

      const result = await Effect.runPromise(
        padDistractors(
          openAIDistractors,
          targetCount,
          govFormQuestion,
          correctAnswers,
          mockFallbackService
        )
      )

      expect(result).toEqual(openAIDistractors)
      expect(result.length).toBe(10)
    })

    it('should use only fallback distractors when input is empty', async () => {
      const emptyDistractors: string[] = []
      const targetCount = 5

      const result = await Effect.runPromise(
        padDistractors(
          emptyDistractors,
          targetCount,
          govFormQuestion,
          correctAnswers,
          mockFallbackService
        )
      )

      // Should get all fallback distractors
      expect(result.length).toBe(5)
      expect(result).toContain('Fallback 1')
      expect(result).toContain('Fallback 5')
    })

    it('should not include distractors that match correct answers', async () => {
      const mockFallbackWithAnswer = {
        ...mockFallbackService,
        getFallbackDistractors: () => [
          'Republic', // This is a correct answer and should be excluded
          'Fallback 2',
          'Fallback 3',
          'Fallback 4',
          'Fallback 5'
        ]
      }

      const emptyDistractors: string[] = []
      const targetCount = 5

      const result = await Effect.runPromise(
        padDistractors(
          emptyDistractors,
          targetCount,
          govFormQuestion,
          correctAnswers,
          mockFallbackWithAnswer
        )
      )

      // Should not include 'Republic' as it's a correct answer
      expect(result).not.toContain('Republic')
    })
  })
})
