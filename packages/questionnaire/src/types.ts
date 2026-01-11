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
 * Base session data shared across all game states
 */
type BaseSessionData = {
  readonly id: string
  readonly questions: ReadonlyArray<string> // Question IDs
  readonly currentQuestionIndex: number
  readonly correctAnswers: number
  readonly incorrectAnswers: number
  readonly totalAnswered: number
  readonly startedAt: Date
  readonly pairedAnswers: PairedAnswers
  readonly settings: GameSettings
}

/**
 * Game session in progress - not yet completed
 */
export type InProgressSession = BaseSessionData & {
  readonly _tag: 'InProgress'
}

/**
 * Game session completed normally (all questions answered)
 */
export type CompletedNormalSession = BaseSessionData & {
  readonly _tag: 'CompletedNormal'
  readonly completedAt: Date
}

/**
 * Game session ended early due to winning (reached threshold)
 */
export type EarlyWinSession = BaseSessionData & {
  readonly _tag: 'EarlyWin'
  readonly completedAt: Date
}

/**
 * Game session ended early due to failing (9 incorrect answers)
 */
export type EarlyFailSession = BaseSessionData & {
  readonly _tag: 'EarlyFail'
  readonly completedAt: Date
}

/**
 * Web/GUI game session state - discriminated union of all possible states
 *
 * States:
 * - InProgress: Game is still ongoing
 * - CompletedNormal: All questions answered
 * - EarlyWin: Won by reaching win threshold
 * - EarlyFail: Lost by accumulating 9 incorrect answers
 */
export type GameSession = InProgressSession | CompletedNormalSession | EarlyWinSession | EarlyFailSession

// Type guards for GameSession states
export const isSessionInProgress = (session: GameSession): session is InProgressSession =>
  session._tag === 'InProgress'

export const isSessionCompleted = (session: GameSession): session is CompletedNormalSession | EarlyWinSession | EarlyFailSession =>
  session._tag !== 'InProgress'

export const isSessionEarlyWin = (session: GameSession): session is EarlyWinSession =>
  session._tag === 'EarlyWin'

export const isSessionEarlyFail = (session: GameSession): session is EarlyFailSession =>
  session._tag === 'EarlyFail'

export const isSessionCompletedNormal = (session: GameSession): session is CompletedNormalSession =>
  session._tag === 'CompletedNormal'

/**
 * Get completedAt date from a completed session, or undefined for in-progress
 */
export const getSessionCompletedAt = (session: GameSession): Date | undefined =>
  isSessionCompleted(session) ? session.completedAt : undefined

/**
 * Legacy compatibility helpers - derive boolean flags from discriminated union
 * @deprecated Use type guards instead (isSessionInProgress, isSessionCompleted, etc.)
 */
export const getSessionFlags = (session: GameSession) => ({
  isCompleted: isSessionCompleted(session),
  isEarlyWin: isSessionEarlyWin(session),
  isEarlyFail: isSessionEarlyFail(session)
})

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
  incorrectAnswers: number
  percentage: number
  isEarlyWin: boolean
  isEarlyFail: boolean
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
