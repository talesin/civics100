// Test utilities for distractor validation
import type { Question } from 'civics2json'
import {
  validateDistractorLength,
  validateDistractorCompleteness,
  validateSemanticRelevance,
  validateDistractorFormat,
  validateDistractor
} from '../../src/utils/validation'

describe('Validation Utilities', () => {
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

  describe('validateDistractorLength', () => {
    it('should accept valid length distractors', () => {
      const result = validateDistractorLength('Valid distractor', 3, 100)
      expect(result.isValid).toBe(true)
      expect(result.score).toBe(1.0)
      expect(result.reasons).toHaveLength(0)
    })

    it('should reject too short distractors', () => {
      const result = validateDistractorLength('Hi', 3, 100)
      expect(result.isValid).toBe(false)
      expect(result.score).toBe(0)
      expect(result.reasons[0]).toContain('Too short')
    })

    it('should reject too long distractors', () => {
      const longText = 'a'.repeat(201)
      const result = validateDistractorLength(longText, 3, 200)
      expect(result.isValid).toBe(false)
      expect(result.score).toBe(0)
      expect(result.reasons[0]).toContain('Too long')
    })
  })

  describe('validateDistractorCompleteness', () => {
    it('should accept complete distractors', () => {
      const result = validateDistractorCompleteness('Complete sentence')
      expect(result.isValid).toBe(true)
      expect(result.score).toBe(1.0)
    })

    it('should reject fragments starting with lowercase', () => {
      const result = validateDistractorCompleteness('lowercase start')
      expect(result.isValid).toBe(false)
      expect(result.reasons[0]).toContain('lowercase')
    })

    it('should reject fragments with trailing punctuation', () => {
      const result = validateDistractorCompleteness('Incomplete,')
      expect(result.isValid).toBe(false)
      expect(result.reasons[0]).toContain('comma')
    })

    it('should reject fragments with open parentheses', () => {
      const result = validateDistractorCompleteness('Incomplete (')
      expect(result.isValid).toBe(false)
      expect(result.reasons[0]).toContain('parenthesis')
    })
  })

  describe('validateSemanticRelevance', () => {
    it('should accept relevant text distractors', () => {
      const result = validateSemanticRelevance('Bill of Rights', mockQuestion)
      expect(result.score).toBeGreaterThan(0.3)
    })

    it('should penalize distractors too similar to question', () => {
      const result = validateSemanticRelevance('supreme law', mockQuestion)
      expect(result.isValid).toBe(false)
      expect(result.reasons[0]).toContain('Too similar to question')
    })

    it('should validate senator name format', () => {
      const senatorQuestion: Question = {
        ...mockQuestion,
        answers: { _type: 'senator', choices: [{ senator: 'John Doe', state: 'NY' }] }
      }

      const result = validateSemanticRelevance('Jane Smith', senatorQuestion)
      expect(result.score).toBeGreaterThan(0.5)
    })

    it('should reject invalid senator name format', () => {
      const senatorQuestion: Question = {
        ...mockQuestion,
        answers: { _type: 'senator', choices: [{ senator: 'John Doe', state: 'NY' }] }
      }

      const result = validateSemanticRelevance('invalidname', senatorQuestion)
      expect(result.reasons[0]).toContain('name format')
    })
  })

  describe('validateDistractorFormat', () => {
    it('should accept similar word count', () => {
      const correctAnswers = ['the Constitution']
      const result = validateDistractorFormat('the Amendment', correctAnswers)
      expect(result.isValid).toBe(true)
      expect(result.score).toBeGreaterThan(0.7)
    })

    it('should penalize very different word counts', () => {
      const correctAnswers = ['Constitution']
      const result = validateDistractorFormat(
        'This is a very long distractor with many words',
        correctAnswers
      )
      expect(result.score).toBeLessThan(1.0) // Updated expectation
    })

    it('should check article consistency', () => {
      const correctAnswers = ['the Constitution', 'the Bill of Rights']
      const result = validateDistractorFormat('Amendment', correctAnswers)
      expect(result.reasons.some((r) => r.includes('Missing article'))).toBe(true)
    })
  })

  describe('validateDistractor', () => {
    it('should validate complete distractor with default options', () => {
      const result = validateDistractor('The Bill of Rights', mockQuestion, ['the Constitution'])

      expect(result.isValid).toBe(true)
      expect(result.score).toBeGreaterThan(0.5)
    })

    it('should fail validation for poor quality distractor', () => {
      const result = validateDistractor('hi', mockQuestion, ['the Constitution'])

      expect(result.isValid).toBe(false)
      expect(result.reasons.length).toBeGreaterThan(0)
    })

    it('should respect custom options', () => {
      const result = validateDistractor('Test', mockQuestion, ['the Constitution'], {
        requireCompleteness: false,
        requireSemanticRelevance: false,
        requireFormatMatch: false
      })

      // Should only fail on length if other checks are disabled
      expect(result.isValid).toBe(true)
    })
  })
})
