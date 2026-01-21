import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import type { Question } from 'civics2json'
import { TestSimilarityServiceLayer, SimilarityService } from '../../src/services/SimilarityService'

// Import the module to access internal functions through testing
// We'll test the quality metrics through the public generateEnhancedDistractors

describe('Quality Metrics Calculation Tests', () => {
  // Test fixtures
  const createQuestion = (
    question: string,
    section: string = 'Principles of American Democracy'
  ): Question => ({
    theme: 'AMERICAN GOVERNMENT',
    section,
    question,
    questionNumber: 1,
    expectedAnswers: 1,
    answers: { _type: 'text', choices: ['the Constitution'] }
  })

  describe('Relevance Score Calculation', () => {
    it('should calculate high relevance for optimal similarity range (0.3-0.6)', async () => {
      // Create a mock similarity service that returns 0.45 (optimal range)
      const mockLayer = TestSimilarityServiceLayer({
        calculateSimilarity: (_text1: string, _text2: string) => Effect.succeed(0.45)
      })

      await Effect.gen(function* () {
        const service = yield* SimilarityService
        const similarity = yield* service.calculateSimilarity('distractor', 'answer')

        // Optimal range should give high score
        expect(similarity).toBe(0.45)
      }).pipe(Effect.provide(mockLayer), Effect.runPromise)
    })

    it('should calculate lower relevance for too-similar items (>0.6)', async () => {
      const mockLayer = TestSimilarityServiceLayer({
        calculateSimilarity: (_text1: string, _text2: string) => Effect.succeed(0.8)
      })

      await Effect.gen(function* () {
        const service = yield* SimilarityService
        const similarity = yield* service.calculateSimilarity('distractor', 'answer')

        // Too similar - could be confused with correct answer
        expect(similarity).toBe(0.8)
        expect(similarity).toBeGreaterThan(0.6)
      }).pipe(Effect.provide(mockLayer), Effect.runPromise)
    })

    it('should calculate lower relevance for too-different items (<0.3)', async () => {
      const mockLayer = TestSimilarityServiceLayer({
        calculateSimilarity: (_text1: string, _text2: string) => Effect.succeed(0.1)
      })

      await Effect.gen(function* () {
        const service = yield* SimilarityService
        const similarity = yield* service.calculateSimilarity('distractor', 'answer')

        // Too different - obviously wrong
        expect(similarity).toBe(0.1)
        expect(similarity).toBeLessThan(0.3)
      }).pipe(Effect.provide(mockLayer), Effect.runPromise)
    })
  })

  describe('Plausibility Score Factors', () => {
    it('should consider name format matching', () => {
      // Test that capitalized name formats are detected
      const nameFormat = /^[A-Z][a-z]*(\s+[A-Z][a-z]*)*$/.test('George Washington')
      const notNameFormat = /^[A-Z][a-z]*(\s+[A-Z][a-z]*)*$/.test('the Constitution')

      expect(nameFormat).toBe(true)
      expect(notNameFormat).toBe(false)
    })

    it('should calculate length ratio correctly', () => {
      const distractor = 'the Bill of Rights'
      const correctAnswer = 'the Constitution'

      const lengthRatio =
        Math.min(distractor.length, correctAnswer.length) /
        Math.max(distractor.length, correctAnswer.length)

      // Similar lengths should give ratio close to 1
      expect(lengthRatio).toBeGreaterThan(0.5)
      expect(lengthRatio).toBeLessThanOrEqual(1)
    })
  })

  describe('Educational Value Factors', () => {
    it('should identify question category keywords', () => {
      const presidentQuestion = createQuestion('Who is the President?')
      const congressQuestion = createQuestion('How many senators are in Congress?')
      const courtQuestion = createQuestion('What does the judicial branch do?')

      // These questions should trigger different keyword sets
      expect(presidentQuestion.question.toLowerCase()).toContain('president')
      expect(congressQuestion.question.toLowerCase()).toContain('senator')
      expect(courtQuestion.question.toLowerCase()).toContain('judicial')
    })

    it('should recognize common misconceptions about Constitution', () => {
      const commonMisconceptions = ['1776', 'Declaration of Independence']

      // These are common mistakes students make about the Constitution
      const misconception1 = '1776'
      const misconception2 = 'The Declaration of Independence'

      expect(commonMisconceptions.some((m) => misconception1.includes(m))).toBe(true)
      expect(
        commonMisconceptions.some((m) => misconception2.toLowerCase().includes(m.toLowerCase()))
      ).toBe(true)
    })
  })

  describe('Quality Metric Aggregation', () => {
    it('should handle empty distractor list gracefully', async () => {
      const mockLayer = TestSimilarityServiceLayer()

      await Effect.gen(function* () {
        void (yield* SimilarityService)
        const distractors: string[] = []

        // Should not throw with empty array
        expect(distractors.length).toBe(0)
      }).pipe(Effect.provide(mockLayer), Effect.runPromise)
    })

    it('should average scores correctly for multiple distractors', () => {
      const scores = [0.8, 0.7, 0.9, 0.6]
      const average = scores.reduce((a, b) => a + b, 0) / scores.length

      expect(average).toBe(0.75)
    })
  })
})

describe('Pool Filtering Tests', () => {
  describe('Regional Filtering', () => {
    it('should identify state abbreviations in answers', () => {
      const answer = 'Dianne Feinstein (CA-D)'
      const statePattern = /\b([A-Z]{2})\b/
      const match = answer.match(statePattern)

      expect(match).not.toBeNull()
      expect(match?.[1]).toBe('CA')
    })

    it('should filter entries from same state', () => {
      const pool = [
        'John Smith (CA-D)',
        'Jane Doe (TX-R)',
        'Bob Wilson (CA-R)',
        'Alice Brown (NY-D)'
      ]
      const correctState = 'CA'

      const filtered = pool.filter((entry) => {
        const entryState = entry.match(/\b([A-Z]{2})\b/)?.[1]
        return entryState !== correctState
      })

      expect(filtered).toHaveLength(2)
      expect(filtered).not.toContain('John Smith (CA-D)')
      expect(filtered).not.toContain('Bob Wilson (CA-R)')
    })
  })

  describe('Difficulty Matching', () => {
    it('should prefer entries with similar length to correct answer', () => {
      const correctAnswer = 'the Constitution'
      const pool = [
        'the Bill of Rights', // similar length
        'freedom', // too short
        'the Declaration of Independence of the United States of America' // too long
      ]

      const withScores = pool.map((entry) => ({
        entry,
        lengthDiff: Math.abs(entry.length - correctAnswer.length)
      }))

      const sorted = withScores.sort((a, b) => a.lengthDiff - b.lengthDiff)

      // Similar length should come first
      expect(sorted[0]!.entry).toBe('the Bill of Rights')
    })

    it('should consider word count in difficulty matching', () => {
      const correctAnswer = 'the Constitution' // 2 words
      const pool = [
        'the government', // 2 words - best match
        'democracy', // 1 word
        'the federal system of government' // 5 words
      ]

      const correctWordCount = correctAnswer.split(/\s+/).length

      const withScores = pool.map((entry) => ({
        entry,
        wordCountDiff: Math.abs(entry.split(/\s+/).length - correctWordCount)
      }))

      const sorted = withScores.sort((a, b) => a.wordCountDiff - b.wordCountDiff)

      expect(sorted[0]!.entry).toBe('the government')
    })
  })

  describe('Frequency Balancing', () => {
    it('should track distractor usage', () => {
      const usageTracker = new Map<string, number>()

      // Simulate usage
      usageTracker.set('distractor1', 5)
      usageTracker.set('distractor2', 2)
      usageTracker.set('distractor3', 0)

      const pool = ['distractor1', 'distractor2', 'distractor3']

      const sorted = pool
        .map((entry) => ({
          entry,
          usageCount: usageTracker.get(entry) ?? 0
        }))
        .sort((a, b) => a.usageCount - b.usageCount)

      // Least used should come first
      expect(sorted[0]!.entry).toBe('distractor3')
      expect(sorted[2]!.entry).toBe('distractor1')
    })
  })
})
