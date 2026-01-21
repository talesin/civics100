import { describe, it, expect } from '@jest/globals'
import { Effect, pipe } from 'effect'
import {
  filterQualityDistractors,
  validateDistractorCompleteness,
  semanticValidation,
  standardizeDistractorFormat,
  DistractorQualityService
} from '@src/services/DistractorQualityService'
import { SimilarityService, TestSimilarityServiceLayer } from '@src/services/SimilarityService'

// Mock SimilarityService for testing
const testSimilarityServiceLayer = (similarPairs: [string, string][]) =>
  TestSimilarityServiceLayer({
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

  // describe('filterQualityDistractors', () => {
  //   it('should filter out low-quality distractors', async () => {
  //     const candidates = [
  //       'Correct Answer',
  //       'short',
  //       'substring of correct',
  //       'Similar To Correct',
  //       'Unique Distractor',
  //       'Unique Distractor',
  //       '  ',
  //       'Another good one'
  //     ]
  //     const correctAnswers = ['Correct Answer', 'Some other answer']
  //     const similarPairs: [string, string][] = [['Similar To Correct', 'Correct Answer']]

  //     const similarityService = testSimilarityServiceLayer(similarPairs)

  //     await Effect.gen(function* () {
  //       const service = yield* SimilarityService
  //       const result = yield* filterQualityDistractors(service)(candidates, correctAnswers)
  //       expect(result).toEqual(['Unique Distractor', 'Another good one'])
  //     }).pipe(Effect.provide(similarityService), Effect.runPromise)
  //   })
  // })

  // describe('applyEnhancedQualityFilters', () => {
  //   it('should apply all quality filters in sequence', async () => {
  //     const candidates = [
  //       'George Washington',
  //       'Abe Lincoln',
  //       'a fragment',
  //       'World War II',
  //       'Declaration of Independence'
  //     ]
  //     const correctAnswers = ['Abraham Lincoln']
  //     const similarPairs: [string, string][] = [['Abe Lincoln', 'Abraham Lincoln']]

  //     const similarityService = testSimilarityServiceLayer(similarPairs)

  //     await Effect.gen(function* () {
  //       const service = yield* SimilarityService
  //       const result = yield* applyEnhancedQualityFilters(service)(
  //         candidates,
  //         correctAnswers,
  //         'president'
  //       )
  //       expect(result).toEqual(['George Washington'])
  //     }).pipe(Effect.provide(similarityService), Effect.runPromise)
  //   })
  // })

  describe('DistractorQualityService via Layer', () => {
    it('should provide a service that can filter distractors', async () => {
      const candidates = ['Good Distractor', 'Bad Distractor']
      const correctAnswers = ['Correct Answer']
      const similarPairs: [string, string][] = [['Bad Distractor', 'Correct Answer']]

      const similarityService = testSimilarityServiceLayer(similarPairs)

      await Effect.gen(function* () {
        const service = yield* SimilarityService
        const result = yield* filterQualityDistractors(service)(candidates, correctAnswers)
        expect(result).toEqual(['Good Distractor'])
      }).pipe(Effect.provide(similarityService), Effect.runPromise)
    })
  })

  describe('standardizeDistractorFormat', () => {
    it('should remove "right to" prefix when correct answers are in short form', () => {
      const correctAnswers = ['speech', 'religion', 'assembly']
      const distractor = 'right to bear arms'
      const result = standardizeDistractorFormat(distractor, correctAnswers)
      expect(result).toBe('bear arms')
    })

    it('should not modify distractors when format already matches', () => {
      const correctAnswers = ['speech', 'religion']
      const distractor = 'vote'
      const result = standardizeDistractorFormat(distractor, correctAnswers)
      expect(result).toBe('vote')
    })

    it('should add "The" prefix for anthem-related distractors when correct answer has it', () => {
      const correctAnswers = ['The Star-Spangled Banner']
      const distractor = 'America the Beautiful'
      const result = standardizeDistractorFormat(distractor, correctAnswers)
      expect(result).toBe('The America the Beautiful')
    })

    it('should handle parentheses correctly for amendment questions', () => {
      const correctAnswers = ['a change (to the Constitution)', 'an addition (to the Constitution)']
      const distractor = 'a law passed by Congress'
      const result = standardizeDistractorFormat(distractor, correctAnswers)
      expect(result).toBe('a law passed by Congress')
    })
  })
})

describe('filterQualityDistractors with government forms (real similarity service)', () => {
  // These tests use the real SimilarityService to verify government-form distractors are preserved
  const correctAnswers = [
    'Republic',
    'Constitution-based federal republic',
    'Representative democracy'
  ]
  const openAIDistractors = [
    'Parliamentary democracy',
    'Constitutional monarchy',
    'Direct democracy',
    'Theocracy',
    'Oligarchy',
    'Plutocracy',
    'Unitary state',
    'Confederation',
    'Federal parliamentary republic',
    'One-party state'
  ]

  it('should preserve valid government-form distractors', async () => {
    const result = await pipe(
      Effect.gen(function* () {
        const qualityService = yield* DistractorQualityService
        return yield* qualityService.filterQualityDistractors(openAIDistractors, correctAnswers)
      }),
      Effect.provide(DistractorQualityService.Default),
      Effect.runPromise
    )

    // These should all be preserved (not filtered as "similar" to correct answers)
    expect(result).toContain('Theocracy')
    expect(result).toContain('Oligarchy')
    expect(result).toContain('Plutocracy')
    expect(result).toContain('Constitutional monarchy')
    expect(result).toContain('Unitary state')
    expect(result).toContain('Confederation')
    expect(result).toContain('One-party state')
  })

  it('should preserve "Parliamentary democracy" despite sharing "democracy" word', async () => {
    const result = await pipe(
      Effect.gen(function* () {
        const qualityService = yield* DistractorQualityService
        return yield* qualityService.filterQualityDistractors(
          ['Parliamentary democracy'],
          correctAnswers
        )
      }),
      Effect.provide(DistractorQualityService.Default),
      Effect.runPromise
    )

    expect(result).toContain('Parliamentary democracy')
  })

  it('should filter exact matches of correct answers', async () => {
    const withExact = [...openAIDistractors, 'Republic', 'Representative democracy']
    const result = await pipe(
      Effect.gen(function* () {
        const qualityService = yield* DistractorQualityService
        return yield* qualityService.filterQualityDistractors(withExact, correctAnswers)
      }),
      Effect.provide(DistractorQualityService.Default),
      Effect.runPromise
    )

    // Exact matches should be filtered out
    expect(result).not.toContain('Republic')
    expect(result).not.toContain('Representative democracy')
  })

  it('should filter case-insensitive exact matches', async () => {
    const withCaseVariant = [...openAIDistractors, 'republic', 'REPUBLIC']
    const result = await pipe(
      Effect.gen(function* () {
        const qualityService = yield* DistractorQualityService
        return yield* qualityService.filterQualityDistractors(withCaseVariant, correctAnswers)
      }),
      Effect.provide(DistractorQualityService.Default),
      Effect.runPromise
    )

    expect(result).not.toContain('republic')
    expect(result).not.toContain('REPUBLIC')
  })
})
