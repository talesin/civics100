import { Effect, Option } from "effect";
import type { Question as CivicsQuestion } from "civics2json";
import type { QuestionWithDistractors } from "distractions";
import {
  loadQuestions,
  getAvailableQuestionNumbers,
  findQuestionByNumber,
  getQuestionCount,
  getQuestionsWithMissingDistractors,
  type QuestionDataSource,
} from "@src/QuestionDataService";
import { QuestionNumber } from "@src/types";

describe("QuestionDataService", () => {
  const mockCivicsQuestions: CivicsQuestion[] = [
    {
      questionNumber: "1",
      theme: "AMERICAN GOVERNMENT",
      section: "Principles of American Democracy",
      question: "What is the supreme law of the land?",
      answers: {
        _type: "text",
        choices: ["the Constitution"],
      },
    },
    {
      questionNumber: "2",
      theme: "AMERICAN GOVERNMENT",
      section: "Principles of American Democracy",
      question: "What does the Constitution do?",
      answers: {
        _type: "text",
        choices: ["sets up the government", "defines the government"],
      },
    },
  ];

  const mockQuestionsWithDistractors: QuestionWithDistractors[] = [
    {
      questionNumber: "1",
      theme: "AMERICAN GOVERNMENT",
      section: "Principles of American Democracy",
      question: "What is the supreme law of the land?",
      answers: {
        _type: "text",
        choices: ["the Constitution"],
      },
      distractors: [
        "the Declaration of Independence",
        "the Bill of Rights",
        "the Articles of Confederation",
      ],
      _tag: "QuestionWithDistractors",
    },
  ];

  const dataSource: QuestionDataSource = {
    civicsQuestions: mockCivicsQuestions,
    questionsWithDistractors: mockQuestionsWithDistractors,
  };

  describe("loadQuestions", () => {
    it("should load questions that have distractors", async () => {
      const questions = await Effect.runPromise(loadQuestions(dataSource));

      expect(questions).toHaveLength(1);
      expect(questions[0]?.questionNumber).toBe("1");
      expect(questions[0]?.question).toBe(
        "What is the supreme law of the land?",
      );
      expect(questions[0]?.answers).toHaveLength(4); // 1 correct + 3 distractors
    });

    it("should exclude questions without distractors", async () => {
      const questions = await Effect.runPromise(loadQuestions(dataSource));

      const question2 = questions.find((q) => q.questionNumber === "2");
      expect(question2).toBeUndefined();
    });

    it("should handle empty data sources", async () => {
      const emptyDataSource: QuestionDataSource = {
        civicsQuestions: [],
        questionsWithDistractors: [],
      };

      const questions = await Effect.runPromise(loadQuestions(emptyDataSource));
      expect(questions).toHaveLength(0);
    });
  });

  describe("getAvailableQuestionNumbers", () => {
    it("should return question numbers from loaded questions", async () => {
      const questions = await Effect.runPromise(loadQuestions(dataSource));
      const questionNumbers = getAvailableQuestionNumbers(questions);

      expect(questionNumbers).toEqual(["1"]);
    });

    it("should return empty array for no questions", () => {
      const questionNumbers = getAvailableQuestionNumbers([]);
      expect(questionNumbers).toEqual([]);
    });
  });

  describe("findQuestionByNumber", () => {
    it("should find existing question", async () => {
      const questions = await Effect.runPromise(loadQuestions(dataSource));
      const questionNumber = QuestionNumber("1");
      const found = findQuestionByNumber(questionNumber, questions);

      expect(Option.isSome(found)).toBe(true);
      if (Option.isSome(found)) {
        expect(found.value.questionNumber).toBe("1");
      }
    });

    it("should return None for non-existing question", async () => {
      const questions = await Effect.runPromise(loadQuestions(dataSource));
      const questionNumber = QuestionNumber("999");
      const found = findQuestionByNumber(questionNumber, questions);

      expect(Option.isNone(found)).toBe(true);
    });
  });

  describe("getQuestionCount", () => {
    it("should return correct count", async () => {
      const questions = await Effect.runPromise(loadQuestions(dataSource));
      const count = getQuestionCount(questions);

      expect(count).toBe(1);
    });
  });

  describe("getQuestionsWithMissingDistractors", () => {
    it("should identify questions without distractors", () => {
      const missing = getQuestionsWithMissingDistractors(
        mockCivicsQuestions,
        mockQuestionsWithDistractors,
      );

      expect(missing).toEqual(["2"]);
    });

    it("should return empty array when all questions have distractors", () => {
      const allCovered = mockQuestionsWithDistractors.map((q) => ({
        questionNumber: q.questionNumber,
        theme: q.theme,
        section: q.section,
        question: q.question,
        answers: q.answers,
      }));

      const missing = getQuestionsWithMissingDistractors(
        allCovered,
        mockQuestionsWithDistractors,
      );

      expect(missing).toEqual([]);
    });
  });
});
