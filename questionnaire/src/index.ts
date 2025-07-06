export type {
  AnswerHistory,
  Answers,
  Question,
  QuestionStats,
  SelectionWeights,
} from "./types.js";

export { QuestionNumber } from "./types.js";

export {
  selectQuestion,
  createQuestion,
  getQuestionStats,
} from "./QuestionSelector.js";

export type { QuestionDataSource } from "./QuestionDataService.js";

export {
  loadQuestions,
  getAvailableQuestionNumbers,
  findQuestionByNumber,
  getQuestionCount,
  getQuestionsWithMissingDistractors,
} from "./QuestionDataService.js";
