# US Civics Questionnaire Engine

## Overview

This project is a library that will provide a way to pick a semi random question from the US Civics Questionnaire. The users answer history will be used to determine which questions will test them the most. For example, to begin with all 100 questions will be ranked equally, but as the user answers questions, their incorrect ones will be weight slightly higher than their correct ones. Unanswered questions will be weight the highest.

The library will be used in both a web app and a mobile app. It will also provide a console entry point for testing and development.

## Tech Stack

- [TypeScript](https://www.typescriptlang.org/)
- [Effect](https://effect-ts.github.io/effect/)

## API

The API will contain no state, only contain pure functions, with state being managed by the user of the API.

```typescript
export type QuestionNumber = string & Brand.Brand<"QuestionNumber">;
export const QuestionNumber = Brand.nominal<QuestionNumber>();

export type AnswerHistory = ReadonlyArray<{ ts: Date; correct: boolean }>;

export type Answers = Record<QuestionNumber, AnswerHistory>;

export type Question = {
  questionNumber: QuestionNumber; // The question number as found in the US Civics Questionnaire
  question: string;
  correctAnswer: number; // The index of the correct answer in the answers array
  answers: ReadonlyArray<string>; // The answers in the order they should be displayed, one correct answer and the rest distractors
};

const getQuestion = (answers: Answers) => Effect.Effect<Question>;
```

## Command Line Interface

The CLI will provide a way to test the API. It will be a simple REPL that will allow the user to answer questions and see the results. Answers will be kept in memory and will be reset when the CLI is restarted.

```bash
npx tsx src/cli/index.ts
```
