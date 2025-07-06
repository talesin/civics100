import { Effect, Option } from "effect";
import {
  selectQuestion,
  createQuestion,
  getQuestionStats,
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

      const result = await Effect.runPromise(
        selectQuestion(availableQuestions, answers),
      );

      expect(Option.isSome(result)).toBe(true);
      if (Option.isSome(result)) {
        expect(availableQuestions).toContain(result.value);
      }
    });

    it("should return None when no questions are available", async () => {
      const availableQuestions: QuestionNumber[] = [];
      const answers: Answers = {};

      const result = await Effect.runPromise(
        selectQuestion(availableQuestions, answers),
      );

      expect(Option.isNone(result)).toBe(true);
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
          Effect.runPromise(selectQuestion(availableQuestions, answers)),
        ),
      );

      const q2Count = results.filter(
        (result) => Option.isSome(result) && result.value === q2,
      ).length;

      // Should select incorrect question more often due to higher weight
      expect(q2Count).toBeGreaterThan(5);
    });
  });

  describe("createQuestion", () => {
    it("should create a question with shuffled answers", async () => {
      const questionNumber = QuestionNumber("1");
      const questionText = "What is the capital of the United States?";
      const correctAnswers = ["Washington, D.C."];
      const distractors = ["New York", "Los Angeles", "Chicago"];

      const question = await Effect.runPromise(
        createQuestion(
          questionNumber,
          questionText,
          correctAnswers,
          distractors,
        ),
      );

      expect(question.questionNumber).toBe(questionNumber);
      expect(question.question).toBe(questionText);
      expect(question.answers).toHaveLength(4);
      expect(question.answers).toContain("Washington, D.C.");
      expect(question.answers).toContain("New York");
      expect(question.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(question.correctAnswer).toBeLessThan(4);
      expect(question.answers[question.correctAnswer]).toBe("Washington, D.C.");
    });

    it("should handle empty correct answers", async () => {
      const questionNumber = QuestionNumber("1");
      const questionText = "Test question";
      const correctAnswers: string[] = [];
      const distractors = ["A", "B", "C"];

      const question = await Effect.runPromise(
        createQuestion(
          questionNumber,
          questionText,
          correctAnswers,
          distractors,
        ),
      );

      expect(question.answers).toHaveLength(0);
      expect(question.correctAnswer).toBe(-1);
    });
  });

  describe("getQuestionStats", () => {
    it("should calculate stats for unanswered question", () => {
      const answers: Answers = {};
      const stats = getQuestionStats(q1, answers);

      expect(stats.totalAnswered).toBe(0);
      expect(stats.correctAnswers).toBe(0);
      expect(stats.incorrectAnswers).toBe(0);
      expect(stats.accuracy).toBe(0);
    });

    it("should calculate stats for answered question", () => {
      const answers: Answers = {
        [q1]: [
          { ts: new Date(), correct: true },
          { ts: new Date(), correct: false },
          { ts: new Date(), correct: true },
        ],
      };

      const stats = getQuestionStats(q1, answers);

      expect(stats.totalAnswered).toBe(3);
      expect(stats.correctAnswers).toBe(2);
      expect(stats.incorrectAnswers).toBe(1);
      expect(stats.accuracy).toBeCloseTo(2 / 3);
    });

    it("should handle 100% accuracy", () => {
      const answers: Answers = {
        [q1]: [
          { ts: new Date(), correct: true },
          { ts: new Date(), correct: true },
        ],
      };

      const stats = getQuestionStats(q1, answers);

      expect(stats.accuracy).toBe(1);
    });
  });
});
