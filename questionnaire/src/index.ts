export type {
  AnswerHistory,
  Answers,
  PairedAnswers,
  Question,
  QuestionStats,
  SelectionWeights,
  GameSettings,
  WebGameSession,
  UserAnswer,
  GameResult,
  QuestionDisplay
} from './types.js'

export { QuestionNumber, PairedQuestionNumber } from './types.js'

export { QuestionSelector, TestQuestionSelectorLayer } from './services/QuestionSelector.js'

export type { QuestionDataSource } from './services/QuestionDataService.js'

export {
  QuestionDataService,
  TestQuestionDataServiceLayer,
  loadQuestions,
  getAvailablePairedQuestionNumbers,
  findQuestionByPairedNumber,
  getQuestionCount
} from './services/QuestionDataService.js'

export { GameService, TestGameServiceLayer } from './services/GameService.js'

// Import services to access their defaults
import { GameService } from './services/GameService.js'
import { QuestionDataService } from './services/QuestionDataService.js'
import { QuestionSelector } from './services/QuestionSelector.js'

// Export service defaults for dependency injection
export const GameServiceDefault = GameService.Default
export const QuestionDataServiceDefault = QuestionDataService.Default
export const QuestionSelectorDefault = QuestionSelector.Default

// Re-export question data for consuming packages
export { rawCivicsQuestions, civicsQuestionsWithDistractors } from './data/index.js'
export type { QuestionWithDistractors } from './data/index.js'
