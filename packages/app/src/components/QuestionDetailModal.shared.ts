/**
 * Shared contract for the platform-split question detail modal (same pattern
 * as useKeyboardNavigation.shared.ts): the props interface lives here so the
 * web half and the native stub half cannot drift.
 */
import type { PairedAnswers } from 'questionnaire'
import type { QuestionStatistics } from '../types'

export interface QuestionDetailModalProps {
  readonly question: QuestionStatistics
  readonly pairedAnswers: PairedAnswers
  readonly onClose: () => void
}
