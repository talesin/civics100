import type { Question as BaseQuestion } from 'civics2json'

export type QuestionWithDistractors = BaseQuestion & {
  distractors: string[]
}
