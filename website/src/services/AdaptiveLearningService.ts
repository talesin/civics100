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
import { loadQuestions } from "questionnaire";

/**
 * Service for managing adaptive learning with answer tracking and weighted question selection
 * Integrates the sophisticated QuestionSelector from the questionnaire package
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
    const availablePairedQuestions = allQuestions.map(
      (q) => q.pairedQuestionNumber,
    );

    // Use QuestionSelector to get the next question with adaptive weighting
    const selectedPairedQuestionNumber =
      yield* questionSelector.selectPairedQuestion(
        availablePairedQuestions,
        pairedAnswers,
      );

    // Find the actual question object
    return Option.flatMap(selectedPairedQuestionNumber, (pairedQNum) =>
      Option.fromNullable(
        allQuestions.find((q) => q.pairedQuestionNumber === pairedQNum),
      ),
    );
  });
};

/**
 * Record an answer for adaptive learning
 * Updates the paired answers history for future question selection
 */
const recordAnswer = (
  pairedQuestionNumber: PairedQuestionNumber,
  isCorrect: boolean,
  pairedAnswers: PairedAnswers,
): PairedAnswers => {
  const currentHistory = pairedAnswers[pairedQuestionNumber] ?? [];
  const newAnswer = {
    ts: new Date(),
    correct: isCorrect,
  };

  return {
    ...pairedAnswers,
    [pairedQuestionNumber]: [...currentHistory, newAnswer],
  };
};

/**
 * Get statistics for a specific paired question
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
 */
const getLearningProgress = (
  pairedAnswers: PairedAnswers,
): {
  totalQuestionsAttempted: number;
  totalAnswers: number;
  overallAccuracy: number;
  masteredQuestions: number;
} => {
  const pairedQuestionNumbers = Object.keys(
    pairedAnswers,
  ) as PairedQuestionNumber[];

  let totalAnswers = 0;
  let correctAnswers = 0;
  let masteredQuestions = 0;

  for (const pairedQuestionNumber of pairedQuestionNumbers) {
    const history = pairedAnswers[pairedQuestionNumber] ?? [];
    totalAnswers += history.length;
    correctAnswers += history.filter((answer) => answer.correct).length;

    // Consider a question "mastered" if last 3 answers were correct
    const recentAnswers = history.slice(-3);
    if (
      recentAnswers.length >= 3 &&
      recentAnswers.every((answer) => answer.correct)
    ) {
      masteredQuestions++;
    }
  }

  return {
    totalQuestionsAttempted: pairedQuestionNumbers.length,
    totalAnswers,
    overallAccuracy: totalAnswers > 0 ? correctAnswers / totalAnswers : 0,
    masteredQuestions,
  };
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
  ) => PairedAnswers;
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
  getLearningProgress?: (pairedAnswers: PairedAnswers) => {
    totalQuestionsAttempted: number;
    totalAnswers: number;
    overallAccuracy: number;
    masteredQuestions: number;
  };
}) =>
  Layer.succeed(
    AdaptiveLearningService,
    AdaptiveLearningService.of({
      _tag: "AdaptiveLearningService",
      loadAllQuestions: fn?.loadAllQuestions ?? (() => Effect.succeed([])),
      getNextQuestion:
        fn?.getNextQuestion ?? (() => Effect.succeed(Option.none())),
      recordAnswer: fn?.recordAnswer ?? ((_, __, answers) => answers),
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
        (() => ({
          totalQuestionsAttempted: 0,
          totalAnswers: 0,
          overallAccuracy: 0,
          masteredQuestions: 0,
        })),
    }),
  );
