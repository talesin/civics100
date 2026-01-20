export type {
  AnswerHistory,
  Answers,
  PairedAnswers,
  Question,
  QuestionStats,
  SelectionWeights,
  GameSettings,
  GameSession,
  InProgressSession,
  CompletedNormalSession,
  EarlyWinSession,
  EarlyFailSession,
  UserAnswer,
  GameResult,
  QuestionDisplay
} from './types'

export {
  QuestionNumber,
  PairedQuestionNumber,
  // Session state type guards
  isSessionInProgress,
  isSessionCompleted,
  isSessionEarlyWin,
  isSessionEarlyFail,
  isSessionCompletedNormal,
  getSessionCompletedAt,
  getSessionFlags
} from './types'

export { QuestionSelector, TestQuestionSelectorLayer } from './services/QuestionSelector'

export type { QuestionDataSource } from './services/QuestionDataService'

export {
  QuestionDataService,
  TestQuestionDataServiceLayer,
  loadQuestions,
  getAvailablePairedQuestionNumbers,
  findQuestionByPairedNumber,
  getQuestionCount
} from './services/QuestionDataService'

export { GameService, TestGameServiceLayer, createInProgressSession } from './services/GameService'

// Import services to access their defaults
import { GameService } from './services/GameService'
import { QuestionDataService } from './services/QuestionDataService'
import { QuestionSelector } from './services/QuestionSelector'

// Export service defaults for dependency injection
export const GameServiceDefault = GameService.Default
export const QuestionDataServiceDefault = QuestionDataService.Default
export const QuestionSelectorDefault = QuestionSelector.Default

// Re-export question data for consuming packages
export {
  rawCivicsQuestions,
  civicsQuestionsWithDistractors,
  TOTAL_QUESTION_COUNT
} from './data/index'
export type { QuestionWithDistractors } from './data/index'
