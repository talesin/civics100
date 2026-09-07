/**
 * Shared contract for the platform-split statistics table (same pattern as
 * useKeyboardNavigation.shared.ts): the props interface and the pure display
 * helpers live here so the web <table> half and the native stub half cannot
 * drift.
 */
import type { QuestionStatistics, QuestionSortField } from '../types'

export interface QuestionStatisticsTableProps {
  readonly statistics: ReadonlyArray<QuestionStatistics>
  readonly sortField: QuestionSortField
  readonly sortAscending: boolean
  readonly onSort: (field: QuestionSortField) => void
  readonly onQuestionClick: (stat: QuestionStatistics) => void
}

export type AccuracyLevel = 'high' | 'mid' | 'low' | 'none'
export type ProbabilityLevel = 'veryHigh' | 'high' | 'mid' | 'low'

export const getAccuracyLevel = (accuracy: number, timesAsked: number): AccuracyLevel => {
  if (timesAsked === 0) return 'none'
  if (accuracy >= 0.8) return 'high'
  if (accuracy >= 0.6) return 'mid'
  return 'low'
}

export const getProbabilityLevel = (probability: number): ProbabilityLevel => {
  if (probability >= 8) return 'veryHigh'
  if (probability >= 5) return 'high'
  if (probability >= 2) return 'mid'
  return 'low'
}

export const formatAccuracy = (accuracy: number): string => `${Math.round(accuracy * 100)}%`

export const formatProbability = (probability: number): string => `${probability.toFixed(2)}%`

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
