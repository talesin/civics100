export type {
  AnswerHistory,
  Answers,
  PairedAnswers,
  Question,
  QuestionStats,
  SelectionWeights,
  GameSettings,
  GameSession,
  UserAnswer,
  GameResult,
  QuestionDisplay
} from './types'

export { QuestionNumber, PairedQuestionNumber } from './types'

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

export { GameService, TestGameServiceLayer } from './services/GameService'

// Import services to access their defaults
import { GameService } from './services/GameService'
import { QuestionDataService } from './services/QuestionDataService'
import { QuestionSelector } from './services/QuestionSelector'

// Export service defaults for dependency injection
export const GameServiceDefault = GameService.Default
export const QuestionDataServiceDefault = QuestionDataService.Default
export const QuestionSelectorDefault = QuestionSelector.Default

// Re-export question data for consuming packages
export { rawCivicsQuestions, civicsQuestionsWithDistractors } from './data/index'
export type { QuestionWithDistractors } from './data/index'
