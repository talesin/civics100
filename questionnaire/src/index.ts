export type { AnswerHistory, Answers, Question, QuestionStats, SelectionWeights } from './types.js'

export { QuestionNumber } from './types.js'

export { QuestionSelector, TestQuestionSelectorLayer } from './QuestionSelector.js'

export type { QuestionDataSource } from './QuestionDataService.js'

export { QuestionDataService, TestQuestionDataServiceLayer } from './QuestionDataService.js'

// Re-export question data for consuming packages
export { rawCivicsQuestions, civicsQuestionsWithDistractors } from './data/index.js'
export type { QuestionWithDistractors } from './data/index.js'
