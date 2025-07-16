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

export { QuestionSelector, TestQuestionSelectorLayer } from './QuestionSelector.js'

export type { QuestionDataSource } from './QuestionDataService.js'

export {
  QuestionDataService,
  TestQuestionDataServiceLayer,
  loadQuestions,
  getAvailablePairedQuestionNumbers,
  findQuestionByPairedNumber,
  getQuestionCount
} from './QuestionDataService.js'

export { GameService, TestGameServiceLayer } from './cli/GameService.js'

// Re-export question data for consuming packages
export { rawCivicsQuestions, civicsQuestionsWithDistractors } from './data/index.js'
export type { QuestionWithDistractors } from './data/index.js'
