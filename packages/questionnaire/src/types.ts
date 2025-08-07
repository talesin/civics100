import { Brand } from 'effect'
import { DeepReadonly } from 'ts-essentials'

/**
 * Original question number from the civics test (e.g., "1", "20", "100")
 */
export type QuestionNumber = string & Brand.Brand<'QuestionNumber'>
export const QuestionNumber = Brand.nominal<QuestionNumber>()

/**
 * Paired question identifier that combines original question number with answer index
 *
 * The paired question system transforms single questions with multiple correct answers
 * into multiple individual questions, each paired with a specific correct answer.
 * This enables granular tracking of user performance on each answer choice.
 *
 * Format: "{questionNumber}-{answerIndex}"
 * Examples: "20-0", "20-1" for a question with 2 correct answers
 */
export type PairedQuestionNumber = string & Brand.Brand<'PairedQuestionNumber'>
export const PairedQuestionNumber = Brand.nominal<PairedQuestionNumber>()

/**
 * History of attempts for a specific question/answer combination
 * Tracks timestamp and correctness of each attempt
 */
export type AnswerHistory = ReadonlyArray<{ ts: Date; correct: boolean }>

/**
 * Legacy answer tracking by original question number
 * @deprecated Use PairedAnswers for granular tracking
 */
export type Answers = Record<QuestionNumber, AnswerHistory>

/**
 * Answer history tracked per paired question for granular performance analysis
 * Each paired question (specific answer choice) maintains its own history
 */
export type PairedAnswers = Record<PairedQuestionNumber, AnswerHistory>

/**
 * Individual question instance with a specific correct answer
 *
 * In the paired question system, each Question represents one possible correct answer
 * for an original civics question. Multiple Questions can share the same questionNumber
 * but have different pairedQuestionNumbers and correctAnswerText values.
 *
 * Example: Original question "Name one U.S. Senator from your state" creates:
 * - Question 1: pairedQuestionNumber "20-0", correctAnswerText "Dianne Feinstein"
 * - Question 2: pairedQuestionNumber "20-1", correctAnswerText "Alex Padilla"
 */
export type Question = DeepReadonly<{
  questionNumber: QuestionNumber
  pairedQuestionNumber: PairedQuestionNumber
  question: string
  correctAnswer: number | ReadonlyArray<number>
  correctAnswerText: string
  answers: ReadonlyArray<string>
  expectedAnswers?: number
}>

export type QuestionArray = ReadonlyArray<Question>

export type WeightedQuestion = {
  questionNumber: QuestionNumber
  weight: number
}

export type PairedWeightedQuestion = {
  pairedQuestionNumber: PairedQuestionNumber
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

/**
 * Game session configuration for both CLI and web games
 */
export type GameSettings = {
  maxQuestions: number
  winThreshold: number
  userState: import('civics2json').StateAbbreviation
  userDistrict?: string | undefined
  questionNumbers?: ReadonlyArray<number> | undefined
}

/**
 * Web/GUI game session state
 * Tracks session-based game progress with session ID and completion status
 */
export type GameSession = {
  id: string
  questions: ReadonlyArray<string> // Question IDs
  currentQuestionIndex: number
  correctAnswers: number
  totalAnswered: number
  isCompleted: boolean
  isEarlyWin: boolean
  startedAt: Date
  completedAt?: Date
  pairedAnswers: PairedAnswers
  settings: GameSettings
}

/**
 * User's answer to a specific question
 */
export type UserAnswer = {
  questionId: string
  selectedAnswerIndex: number | ReadonlyArray<number>
  isCorrect: boolean
  answeredAt: Date
}

/**
 * Final game result after completion
 */
export type GameResult = {
  sessionId: string
  totalQuestions: number
  correctAnswers: number
  percentage: number
  isEarlyWin: boolean
  completedAt: Date
}

/**
 * Question formatted for UI display
 * Transformation of core Question type for web/GUI consumption
 */
export type QuestionDisplay = {
  id: string
  questionText: string
  answers: ReadonlyArray<string>
  correctAnswerIndex: number | ReadonlyArray<number>
  questionNumber: number
  totalQuestions: number
  expectedAnswers?: number | undefined
}
