import { Effect, Layer } from "effect";
import { QuestionDisplay } from "@/types";
import type { StateAbbreviation } from "civics2json";
import { civicsQuestionsWithDistractors } from "questionnaire/data";
import type { QuestionDataSource, Question } from "questionnaire";

// Import loadQuestions function directly from the QuestionDataService module
import { loadQuestions } from "questionnaire";

/**
 * Transform a questionnaire Question into a QuestionDisplay for the website UI
 */
const transformQuestionToDisplay = (
  question: Question,
  questionNumber: number,
  totalQuestions: number,
): QuestionDisplay => {
  return {
    id: question.pairedQuestionNumber,
    questionText: question.question,
    answers: [...question.answers],
    correctAnswerIndex: question.correctAnswer,
    questionNumber,
    totalQuestions,
  };
};

/**
 * Load questions using the questionnaire package's sophisticated data service
 */
const loadCivicsQuestions = (
  userState: StateAbbreviation = "CA",
  questionNumbers?: readonly number[],
): Effect.Effect<readonly Question[], never, never> => {
  const dataSource: QuestionDataSource = {
    questions: civicsQuestionsWithDistractors,
    userState,
    questionNumbers,
  };

  return loadQuestions(dataSource);
};

/**
 * Generate game questions using the questionnaire package's Question format
 * This creates paired questions for better learning analytics
 */
const generateGameQuestions = (
  questionCount: number,
  userState: StateAbbreviation = "CA",
): Effect.Effect<QuestionDisplay[], never, never> => {
  return Effect.gen(function* () {
    const allQuestions = yield* loadCivicsQuestions(userState);

    // Simple random selection for now - will be replaced with adaptive selection
    const shuffled = [...allQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selectedQuestions = shuffled.slice(0, questionCount);

    return selectedQuestions.map((question, index) =>
      transformQuestionToDisplay(question, index + 1, questionCount),
    );
  });
};

/**
 * Get all available questions for a user's state
 */
const getAllQuestions = (
  userState: StateAbbreviation = "CA",
): Effect.Effect<readonly Question[], never, never> => {
  return loadCivicsQuestions(userState);
};

/**
 * Website's QuestionDataService that wraps the questionnaire package services
 * Provides compatibility with existing website interfaces while using advanced features
 */
export class QuestionDataService extends Effect.Service<QuestionDataService>()(
  "QuestionDataService",
  {
    effect: Effect.succeed({
      loadCivicsQuestions,
      generateGameQuestions,
      getAllQuestions,
    }),
  },
) {}

export const TestQuestionDataServiceLayer = (fn?: {
  loadCivicsQuestions?: (
    userState?: StateAbbreviation,
    questionNumbers?: readonly number[],
  ) => Effect.Effect<readonly Question[], never, never>;
  generateGameQuestions?: (
    questionCount: number,
    userState?: StateAbbreviation,
  ) => Effect.Effect<QuestionDisplay[], never, never>;
  getAllQuestions?: (
    userState?: StateAbbreviation,
  ) => Effect.Effect<readonly Question[], never, never>;
}) =>
  Layer.succeed(
    QuestionDataService,
    QuestionDataService.of({
      _tag: "QuestionDataService",
      loadCivicsQuestions:
        fn?.loadCivicsQuestions ?? (() => Effect.succeed([])),
      generateGameQuestions:
        fn?.generateGameQuestions ?? (() => Effect.succeed([])),
      getAllQuestions: fn?.getAllQuestions ?? (() => Effect.succeed([])),
    }),
  );
