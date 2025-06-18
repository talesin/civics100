// TypeScript types/interfaces for questions & distractors
export interface CivicsQuestion {
  question: string;
  answers: string[];
  possibleDistractors: string[];
  [key: string]: unknown;
}
