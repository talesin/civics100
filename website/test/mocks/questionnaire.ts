// Mock questionnaire main module for testing
import { Effect } from "effect";
import type { QuestionDataSource, Question } from "./questionnaire-types";

export * from "./questionnaire-data";
export * from "./questionnaire-types";

// Mock loadQuestions function
export const loadQuestions = (
  dataSource: QuestionDataSource,
): Effect.Effect<readonly Question[], never, never> => {
  // Simple mock implementation that returns sample questions
  const mockQuestions: Question[] = [
    {
      questionNumber: "1" as any,
      pairedQuestionNumber: "1-0" as any,
      question: "What is the supreme law of the land?",
      correctAnswer: 0,
      correctAnswerText: "the Constitution",
      answers: ["the Constitution", "the Declaration of Independence", "the Bill of Rights", "the Articles of Confederation"]
    },
    {
      questionNumber: "2" as any,
      pairedQuestionNumber: "2-0" as any,
      question: "What does the Constitution do?",
      correctAnswer: 1,
      correctAnswerText: "sets up the government",
      answers: ["protects basic rights", "sets up the government", "defines the law", "protects the country"]
    },
    {
      questionNumber: "3" as any,
      pairedQuestionNumber: "3-0" as any,
      question: "The idea of self-government is in the first three words of the Constitution. What are these words?",
      correctAnswer: 2,
      correctAnswerText: "We the People",
      answers: ["We the Nation", "We the Government", "We the People", "We the Citizens"]
    },
    {
      questionNumber: "4" as any,
      pairedQuestionNumber: "4-0" as any,
      question: "What is an amendment?",
      correctAnswer: 0,
      correctAnswerText: "a change to the Constitution",
      answers: ["a change to the Constitution", "a new law", "a court decision", "a presidential order"]
    },
    {
      questionNumber: "5" as any,
      pairedQuestionNumber: "5-0" as any,
      question: "What do we call the first ten amendments to the Constitution?",
      correctAnswer: 3,
      correctAnswerText: "the Bill of Rights",
      answers: ["the Constitutional Amendments", "the Original Amendments", "the First Amendments", "the Bill of Rights"]
    },
    {
      questionNumber: "6" as any,
      pairedQuestionNumber: "6-0" as any,
      question: "What is one right or freedom from the First Amendment?",
      correctAnswer: 0,
      correctAnswerText: "speech",
      answers: ["speech", "bear arms", "trial by jury", "due process"]
    }
  ];
  
  return Effect.succeed(mockQuestions);
};