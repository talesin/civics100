import { DeepReadonly } from 'ts-essentials'
import { Data } from 'effect'
import type { Question } from 'civics2json'

/**
 * A question with distractors - extends the base Question type from civics2json
 * and adds an array of distractor options for multiple choice questions.
 */
export type QuestionWithDistractors = DeepReadonly<
  Question & {
    distractors: readonly string[]
    _tag: 'QuestionWithDistractors'
  }
>

/**
 * Tagged QuestionWithDistractors for Effect Data
 */
export const QuestionWithDistractors =
  Data.tagged<QuestionWithDistractors>('QuestionWithDistractors')

/**
 * Type for the curated distractor entry used in the service
 */
export type CuratedDistractorEntry = {
  question: string
  answerType: string
  correctAnswers: readonly string[]
  curatedDistractors: readonly string[]
  rationale: string
}

/**
 * Database of curated distractors indexed by question number
 */
export type CuratedDistractorDatabase = {
  readonly [questionNumber: string]: CuratedDistractorEntry
}

/**
 * Statistics about distractor coverage
 */
export type DistractorCoverageStats = {
  covered: number
  total: number
  percentage: number
}
