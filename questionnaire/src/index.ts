export type {
  AnswerHistory,
  Answers,
  PairedAnswers,
  Question,
  QuestionStats,
  SelectionWeights
} from './types.js'

export { QuestionNumber, PairedQuestionNumber } from './types.js'

export { QuestionSelector, TestQuestionSelectorLayer } from './QuestionSelector.js'

export type { QuestionDataSource } from './QuestionDataService.js'

export { QuestionDataService, TestQuestionDataServiceLayer, loadQuestions } from './QuestionDataService.js'

// Re-export question data for consuming packages
export { rawCivicsQuestions, civicsQuestionsWithDistractors } from './data/index.js'
export type { QuestionWithDistractors } from './data/index.js'
