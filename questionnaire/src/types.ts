import { Brand } from 'effect'
import { DeepReadonly } from 'ts-essentials'

export type QuestionNumber = string & Brand.Brand<'QuestionNumber'>
export const QuestionNumber = Brand.nominal<QuestionNumber>()

export type AnswerHistory = ReadonlyArray<{ ts: Date; correct: boolean }>

export type Answers = Record<QuestionNumber, AnswerHistory>

export type Question = DeepReadonly<{
  questionNumber: QuestionNumber
  question: string
  correctAnswer: number
  answers: ReadonlyArray<string>
}>

export type WeightedQuestion = {
  questionNumber: QuestionNumber
  weight: number
}

export type QuestionStats = {
  totalAnswered: number
  correctAnswers: number
  incorrectAnswers: number
  accuracy: number
}

export type SelectionWeights = {
  unanswered: number
  incorrect: number
  correct: number
}
