import { describe, it, expect } from '@jest/globals'
import { Effect, Layer } from 'effect'
import {
  DistractorQualityService,
  filterQualityDistractors,
  validateDistractorCompleteness,
  semanticValidation,
  applyEnhancedQualityFilters
} from '@src/services/DistractorQualityService'
import { SimilarityService } from '@src/services/SimilarityService'

// Mock SimilarityService for testing
const TestSimilarityServiceLayer = (similarPairs: [string, string][]) =>
  Layer.succeed(
    SimilarityService,
    SimilarityService.of({
      _tag: 'SimilarityService',
      isSimilar: (s1: string, s2: string) =>
        Effect.succeed(
          similarPairs.some(
            (pair) =>
              (pair[0].toLowerCase() === s1.toLowerCase() &&
                pair[1].toLowerCase() === s2.toLowerCase()) ||
              (pair[0].toLowerCase() === s2.toLowerCase() &&
                pair[1].toLowerCase() === s1.toLowerCase())
          )
        )
    })
  )

describe('DistractorQualityService', () => {
  describe('validateDistractorCompleteness', () => {
    it('should return true for complete phrases', () => {
      expect(validateDistractorCompleteness('A complete phrase')).toBe(true)
    })

    it('should return false for short fragments', () => {
      expect(validateDistractorCompleteness('a')).toBe(false)
    })

    it('should return false for fragments starting with lowercase', () => {
      expect(validateDistractorCompleteness('incomplete phrase')).toBe(false)
    })

    it('should return false for fragments ending with punctuation', () => {
      expect(validateDistractorCompleteness('A phrase ending with,')).toBe(false)
    })
  })

  describe('semanticValidation', () => {
    it('should validate president names', () => {
      expect(semanticValidation('John Adams', 'president')).toBe(true)
      expect(semanticValidation('not a name', 'president')).toBe(false)
    })

    it('should validate state names', () => {
      expect(semanticValidation('California', 'state')).toBe(true)
      expect(semanticValidation('not a state', 'state')).toBe(false)
    })

    it('should validate war names', () => {
      expect(semanticValidation('Civil War', 'war')).toBe(true)
    })

    it('should validate document names', () => {
      expect(semanticValidation('The Constitution', 'document')).toBe(true)
    })
  })

  describe('filterQualityDistractors', () => {
    it('should filter out low-quality distractors', async () => {
      const candidates = [
        'Correct Answer',
        'short',
        'substring of correct',
        'Similar To Correct',
        'Unique Distractor',
        'Unique Distractor',
        '  ',
        'Another good one'
      ]
      const correctAnswers = ['Correct Answer', 'Some other answer']
      const similarPairs: [string, string][] = [['Similar To Correct', 'Correct Answer']]

      const similarityService = SimilarityService.Default.pipe(
        Effect.provide(TestSimilarityServiceLayer(similarPairs)),
        Effect.runSync
      )

      const program = filterQualityDistractors(similarityService)(candidates, correctAnswers)

      const result = await Effect.runPromise(program)

      expect(result).toEqual(['Unique Distractor', 'Another good one'])
    })
  })

  describe('applyEnhancedQualityFilters', () => {
    it('should apply all quality filters in sequence', async () => {
      const candidates = [
        'George Washington',
        'Abe Lincoln',
        'a fragment',
        'World War II',
        'Declaration of Independence'
      ]
      const correctAnswers = ['Abraham Lincoln']
      const similarPairs: [string, string][] = [['Abe Lincoln', 'Abraham Lincoln']]

      const similarityService = SimilarityService.Default.pipe(
        Effect.provide(TestSimilarityServiceLayer(similarPairs)),
        Effect.runSync
      )

      const program = applyEnhancedQualityFilters(similarityService)(
        candidates,
        correctAnswers,
        'president'
      )

      const result = await Effect.runPromise(program)

      expect(result).toEqual(['George Washington'])
    })
  })

  describe('DistractorQualityService via Layer', () => {
    it('should provide a service that can filter distractors', async () => {
      const candidates = ['Good Distractor', 'Bad Distractor']
      const correctAnswers = ['Correct Answer']
      const similarPairs: [string, string][] = [['Bad Distractor', 'Correct Answer']]

      const testLayer = TestSimilarityServiceLayer(similarPairs)

      const program = Effect.gen(function* () {
        const service = yield* DistractorQualityService
        return yield* service.filterQualityDistractors(candidates, correctAnswers)
      }).pipe(Effect.provide(DistractorQualityService.Live.pipe(Layer.provide(testLayer))))

      const result = await Effect.runPromise(program)

      expect(result).toEqual(['Good Distractor'])
    })
  })
})
