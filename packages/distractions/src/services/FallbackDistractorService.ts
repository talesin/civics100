import { Effect, Layer } from 'effect'
import type { Question } from 'civics2json'
import {
  FallbackDistractorDatabase,
  FallbackDistractorEntry
} from '../data/FallbackDistractorDatabase'

/**
 * FallbackDistractorService - Provides fallback distractors when OpenAI fails or padding is needed
 *
 * @module FallbackDistractorService
 *
 * This service provides access to the FallbackDistractorDatabase, containing pre-validated
 * fallback distractors for all 128 civics questions. Used when:
 * 1. OpenAI requests fail
 * 2. Generated distractors need padding to reach target count
 */

const getFallbackDistractorDatabase = (): FallbackDistractorDatabase => FallbackDistractorDatabase

export const getFallbackDistractors =
  (fallbackDatabase: FallbackDistractorDatabase) =>
  (question: Question): readonly string[] => {
    const questionKey = question.questionNumber.toString()
    const entry = fallbackDatabase[questionKey]
    return entry?.fallbackDistractors ?? []
  }

export const hasFallbackDistractors =
  (fallbackDatabase: FallbackDistractorDatabase) =>
  (question: Question): boolean => {
    const questionKey = question.questionNumber.toString()
    return questionKey in fallbackDatabase
  }

export const getFallbackEntry =
  (fallbackDatabase: FallbackDistractorDatabase) =>
  (question: Question): FallbackDistractorEntry | undefined => {
    const questionKey = question.questionNumber.toString()
    return fallbackDatabase[questionKey]
  }

export const getFallbackCount =
  (fallbackDatabase: FallbackDistractorDatabase) =>
  (question: Question): number => {
    const questionKey = question.questionNumber.toString()
    const entry = fallbackDatabase[questionKey]
    return entry?.fallbackDistractors.length ?? 0
  }

export class FallbackDistractorService extends Effect.Service<FallbackDistractorService>()(
  'FallbackDistractorService',
  {
    effect: Effect.sync(() => {
      const fallbackDatabase = getFallbackDistractorDatabase()

      return {
        getFallbackDistractors: getFallbackDistractors(fallbackDatabase),
        hasFallbackDistractors: hasFallbackDistractors(fallbackDatabase),
        getFallbackEntry: getFallbackEntry(fallbackDatabase),
        getFallbackCount: getFallbackCount(fallbackDatabase)
      }
    })
  }
) {}

export const TestFallbackDistractorServiceLayer = (fn?: {
  getFallbackDistractors?: (question: Question) => readonly string[]
  hasFallbackDistractors?: (question: Question) => boolean
  getFallbackEntry?: (question: Question) => FallbackDistractorEntry | undefined
  getFallbackCount?: (question: Question) => number
}) =>
  Layer.succeed(
    FallbackDistractorService,
    FallbackDistractorService.of({
      _tag: 'FallbackDistractorService',
      getFallbackDistractors: fn?.getFallbackDistractors ?? (() => []),
      hasFallbackDistractors: fn?.hasFallbackDistractors ?? (() => false),
      getFallbackEntry: fn?.getFallbackEntry ?? (() => undefined),
      getFallbackCount: fn?.getFallbackCount ?? (() => 0)
    })
  )
