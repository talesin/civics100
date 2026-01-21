/**
 * FallbackDistractorDatabase - Pre-validated fallback distractors for all civics questions
 *
 * @module FallbackDistractorDatabase
 *
 * This database provides pre-validated fallback distractors for all 128 civics questions.
 * Used when:
 * 1. OpenAI requests fail
 * 2. Generated distractors need padding to reach target count
 *
 * Each question has unique, contextually appropriate distractors that:
 * - Are plausible given the question domain
 * - Could reasonably confuse someone who doesn't know the answer
 * - Are clearly wrong (not alternative correct answers)
 */

import fallbackData from './fallback-distractors.json'

export type FallbackDistractorDatabase = {
  readonly [questionNumber: string]: readonly string[]
}

export const FallbackDistractorDatabase: FallbackDistractorDatabase = fallbackData

// Simplified entry type for backwards compatibility
export type FallbackDistractorEntry = {
  readonly questionNumber: number
  readonly fallbackDistractors: readonly string[]
}
