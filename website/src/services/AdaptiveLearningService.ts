import { Effect, Layer, Option } from "effect";
import type { StateAbbreviation } from "civics2json";
import { QuestionSelector } from "questionnaire";
import type {
  PairedAnswers,
  PairedQuestionNumber,
  Question,
  QuestionDataSource,
} from "questionnaire";
import { civicsQuestionsWithDistractors } from "questionnaire/data";
import {
  loadQuestions,
  getAvailablePairedQuestionNumbers,
  findQuestionByPairedNumber,
} from "questionnaire";

/**
 * Service for managing adaptive learning with answer tracking and weighted question selection
 * This is now a thin wrapper around the questionnaire package's comprehensive QuestionSelector
 */

/**
 * Load all available paired questions for a user's state
 */
const loadAllQuestions = (
  userState: StateAbbreviation = "CA",
): Effect.Effect<readonly Question[], never, never> => {
  const dataSource: QuestionDataSource = {
    questions: civicsQuestionsWithDistractors,
    userState,
  };

  return loadQuestions(dataSource);
};

/**
 * Get the next question using adaptive learning algorithm
 * Uses weighted selection based on answer history
 */
const getNextQuestion = (
  userState: StateAbbreviation,
  pairedAnswers: PairedAnswers,
): Effect.Effect<Option.Option<Question>, never, QuestionSelector> => {
  return Effect.gen(function* () {
    const questionSelector = yield* QuestionSelector;
    const allQuestions = yield* loadAllQuestions(userState);

    // Get all available paired question numbers
    const availablePairedQuestions =
      getAvailablePairedQuestionNumbers(allQuestions);

    // Use QuestionSelector to get the next question with adaptive weighting
    const selectedPairedQuestionNumber =
      yield* questionSelector.selectPairedQuestion(
        availablePairedQuestions,
        pairedAnswers,
      );

    // Find the actual question object
    return Option.flatMap(selectedPairedQuestionNumber, (pairedQNum) =>
      findQuestionByPairedNumber(pairedQNum, allQuestions),
    );
  });
};

/**
 * Record an answer for adaptive learning
 * Delegates to QuestionSelector's recordPairedAnswer function
 */
const recordAnswer = (
  pairedQuestionNumber: PairedQuestionNumber,
  isCorrect: boolean,
  pairedAnswers: PairedAnswers,
): Effect.Effect<PairedAnswers, never, QuestionSelector> => {
  return Effect.gen(function* () {
    const questionSelector = yield* QuestionSelector;
    return questionSelector.recordPairedAnswer(
      pairedQuestionNumber,
      isCorrect,
      pairedAnswers,
    );
  });
};

/**
 * Get statistics for a specific paired question
 * Delegates to QuestionSelector's getPairedQuestionStats function
 */
const getQuestionStats = (
  pairedQuestionNumber: PairedQuestionNumber,
  pairedAnswers: PairedAnswers,
): Effect.Effect<
  {
    totalAnswered: number;
    correctAnswers: number;
    incorrectAnswers: number;
    accuracy: number;
  },
  never,
  QuestionSelector
> => {
  return Effect.gen(function* () {
    const questionSelector = yield* QuestionSelector;
    return questionSelector.getPairedQuestionStats(
      pairedQuestionNumber,
      pairedAnswers,
    );
  });
};

/**
 * Get overall learning progress statistics
 * Delegates to QuestionSelector's getLearningProgress function
 */
const getLearningProgress = (
  pairedAnswers: PairedAnswers,
): Effect.Effect<
  {
    totalQuestionsAttempted: number;
    totalAnswers: number;
    overallAccuracy: number;
    masteredQuestions: number;
  },
  never,
  QuestionSelector
> => {
  return Effect.gen(function* () {
    const questionSelector = yield* QuestionSelector;
    return questionSelector.getLearningProgress(pairedAnswers);
  });
};

export class AdaptiveLearningService extends Effect.Service<AdaptiveLearningService>()(
  "AdaptiveLearningService",
  {
    effect: Effect.succeed({
      loadAllQuestions,
      getNextQuestion,
      recordAnswer,
      getQuestionStats,
      getLearningProgress,
    }),
  },
) {}

export const TestAdaptiveLearningServiceLayer = (fn?: {
  loadAllQuestions?: (
    userState?: StateAbbreviation,
  ) => Effect.Effect<readonly Question[], never, never>;
  getNextQuestion?: (
    userState: StateAbbreviation,
    pairedAnswers: PairedAnswers,
  ) => Effect.Effect<Option.Option<Question>, never, never>;
  recordAnswer?: (
    pairedQuestionNumber: PairedQuestionNumber,
    isCorrect: boolean,
    pairedAnswers: PairedAnswers,
  ) => Effect.Effect<PairedAnswers, never, never>;
  getQuestionStats?: (
    pairedQuestionNumber: PairedQuestionNumber,
    pairedAnswers: PairedAnswers,
  ) => Effect.Effect<
    {
      totalAnswered: number;
      correctAnswers: number;
      incorrectAnswers: number;
      accuracy: number;
    },
    never,
    never
  >;
  getLearningProgress?: (pairedAnswers: PairedAnswers) => Effect.Effect<
    {
      totalQuestionsAttempted: number;
      totalAnswers: number;
      overallAccuracy: number;
      masteredQuestions: number;
    },
    never,
    never
  >;
}) =>
  Layer.succeed(
    AdaptiveLearningService,
    AdaptiveLearningService.of({
      _tag: "AdaptiveLearningService",
      loadAllQuestions: fn?.loadAllQuestions ?? (() => Effect.succeed([])),
      getNextQuestion:
        fn?.getNextQuestion ?? (() => Effect.succeed(Option.none())),
      recordAnswer: fn?.recordAnswer ?? (() => Effect.succeed({})),
      getQuestionStats:
        fn?.getQuestionStats ??
        (() =>
          Effect.succeed({
            totalAnswered: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            accuracy: 0,
          })),
      getLearningProgress:
        fn?.getLearningProgress ??
        (() =>
          Effect.succeed({
            totalQuestionsAttempted: 0,
            totalAnswers: 0,
            overallAccuracy: 0,
            masteredQuestions: 0,
          })),
    }),
  );
