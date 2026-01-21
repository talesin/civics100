/**
 * Question data re-exports for consuming packages
 *
 * This module provides centralized access to all civics question data formats:
 * - Raw civics questions from the civics2json package
 * - Questions with distractors from the distractions package
 *
 * Consuming packages can import either data set as needed without depending
 * directly on the underlying data packages.
 */

import type { Question } from 'civics2json'
import type { QuestionWithDistractors } from 'distractions'
import civicsQuestions from 'civics2json/Questions'
import questionsWithDistractors from 'distractions'

/**
 * Raw civics questions from the USCIS Civics Test
 *
 * Contains the complete set of civics questions with their themes, sections,
 * and answer choices. Includes both static text answers and dynamic answers
 * for senators, representatives, governors, and state capitals.
 *
 * @example
 * ```typescript
 * import { rawCivicsQuestions } from 'questionnaire/data'
 *
 * const question = rawCivicsQuestions.find(q => q.questionNumber === 1)
 * console.log(question?.question) // "What is the supreme law of the land?"
 * ```
 */
export const rawCivicsQuestions: readonly Question[] = civicsQuestions

/**
 * Civics questions enhanced with distractor options for multiple choice
 *
 * Each question includes curated distractor answers that can be used to
 * create multiple choice questions. This data set is ready for use in
 * quiz applications and educational games.
 *
 * @example
 * ```typescript
 * import { questionsWithDistractors } from 'questionnaire/data'
 *
 * const question = questionsWithDistractors.find(q => q.questionNumber === 1)
 * console.log(question?.distractors) // Array of distractor answers
 * ```
 */
export const civicsQuestionsWithDistractors: readonly QuestionWithDistractors[] =
  questionsWithDistractors

// Re-export types for convenience
export type { Question, QuestionWithDistractors }

// Total question count derived from source data
export const TOTAL_QUESTION_COUNT = civicsQuestionsWithDistractors.length
