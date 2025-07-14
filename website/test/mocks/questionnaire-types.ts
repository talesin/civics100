// Mock types for questionnaire package
import type { StateAbbreviation } from "civics2json";

export type QuestionNumber = string & { readonly _tag: unique symbol };
export type PairedQuestionNumber = string & { readonly _tag: unique symbol };

export interface Question {
  questionNumber: QuestionNumber;
  pairedQuestionNumber: PairedQuestionNumber;
  question: string;
  correctAnswer: number;
  correctAnswerText: string;
  answers: readonly string[];
}

export interface QuestionDataSource {
  questions: readonly any[];
  userState: StateAbbreviation;
  questionNumbers?: readonly number[] | undefined;
}

export type PairedAnswers = Record<PairedQuestionNumber, Array<{
  ts: Date;
  correct: boolean;
}>>;

export type AnswerHistory = Array<{
  ts: Date;
  correct: boolean;
}>;

export type QuestionStats = {
  totalAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
};

export type SelectionWeights = {
  recentWeight: number;
  correctWeight: number;
  incorrectWeight: number;
  unansweredWeight: number;
};

export type Answers = PairedAnswers;