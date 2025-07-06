import { Effect, Option } from "effect";
import {
  QuestionSelector,
  TestQuestionSelectorLayer
} from "@src/QuestionSelector";
import { QuestionNumber, type Answers } from "@src/types";

describe("QuestionSelector", () => {
  const q1 = QuestionNumber("1");
  const q2 = QuestionNumber("2");
  const q3 = QuestionNumber("3");

  describe("selectQuestion", () => {
    it("should select an unanswered question when available", async () => {
      const availableQuestions = [q1, q2, q3];
      const answers: Answers = {};

      await Effect.gen(function* () {
        const questionSelector = yield* QuestionSelector;
        const result = yield* questionSelector.selectQuestion(availableQuestions, answers);

        expect(Option.isSome(result)).toBe(true);
        if (Option.isSome(result)) {
          expect(availableQuestions).toContain(result.value);
        }
      }).pipe(
        Effect.provide(QuestionSelector.Default),
        Effect.runPromise
      );
    });

    it("should return None when no questions are available", async () => {
      const availableQuestions: QuestionNumber[] = [];
      const answers: Answers = {};

      await Effect.gen(function* () {
        const questionSelector = yield* QuestionSelector;
        const result = yield* questionSelector.selectQuestion(availableQuestions, answers);
        expect(Option.isNone(result)).toBe(true);
      }).pipe(
        Effect.provide(QuestionSelector.Default),
        Effect.runPromise
      );
    });

    it("should prefer questions with incorrect answers", async () => {
      const availableQuestions = [q1, q2];
      const answers: Answers = {
        [q1]: [{ ts: new Date(), correct: true }],
        [q2]: [{ ts: new Date(), correct: false }],
      };

      // Run multiple times to check weighting tendency
      const results = await Promise.all(
        Array.from({ length: 20 }, () =>
          Effect.gen(function* () {
            const questionSelector = yield* QuestionSelector;
            return yield* questionSelector.selectQuestion(availableQuestions, answers);
          }).pipe(
            Effect.provide(QuestionSelector.Default),
            Effect.runPromise
          )
        ),
      );

      const q2Count = results.filter(
        (result) => Option.isSome(result) && result.value === q2,
      ).length;

      // Should select incorrect question more often due to higher weight
      expect(q2Count).toBeGreaterThan(5);
    });
  });


  describe("getQuestionStats", () => {
    it("should calculate stats for unanswered question", async () => {
      const answers: Answers = {};
      
      await Effect.gen(function* () {
        const questionSelector = yield* QuestionSelector;
        const stats = questionSelector.getQuestionStats(q1, answers);

        expect(stats.totalAnswered).toBe(0);
        expect(stats.correctAnswers).toBe(0);
        expect(stats.incorrectAnswers).toBe(0);
        expect(stats.accuracy).toBe(0);
      }).pipe(
        Effect.provide(QuestionSelector.Default),
        Effect.runPromise
      );
    });

    it("should calculate stats for answered question", async () => {
      const answers: Answers = {
        [q1]: [
          { ts: new Date(), correct: true },
          { ts: new Date(), correct: false },
          { ts: new Date(), correct: true },
        ],
      };

      await Effect.gen(function* () {
        const questionSelector = yield* QuestionSelector;
        const stats = questionSelector.getQuestionStats(q1, answers);

        expect(stats.totalAnswered).toBe(3);
        expect(stats.correctAnswers).toBe(2);
        expect(stats.incorrectAnswers).toBe(1);
        expect(stats.accuracy).toBeCloseTo(2 / 3);
      }).pipe(
        Effect.provide(QuestionSelector.Default),
        Effect.runPromise
      );
    });

    it("should handle 100% accuracy", async () => {
      const answers: Answers = {
        [q1]: [
          { ts: new Date(), correct: true },
          { ts: new Date(), correct: true },
        ],
      };

      await Effect.gen(function* () {
        const questionSelector = yield* QuestionSelector;
        const stats = questionSelector.getQuestionStats(q1, answers);
        expect(stats.accuracy).toBe(1);
      }).pipe(
        Effect.provide(QuestionSelector.Default),
        Effect.runPromise
      );
    });
  });
});
