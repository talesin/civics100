import { GameSettings } from 'questionnaire'

// Re-export types from questionnaire package for consistency
export type {
  GameSession,
  GameResult,
  UserAnswer as QuestionAnswer,
  QuestionDisplay,
  GameSettings,
  InProgressSession,
  CompletedNormalSession,
  EarlyWinSession,
  EarlyFailSession
} from 'questionnaire'

// Re-export type guards and helpers from questionnaire
export {
  isSessionInProgress,
  isSessionCompleted,
  isSessionEarlyWin,
  isSessionEarlyFail,
  isSessionCompletedNormal,
  getSessionCompletedAt,
  getSessionFlags
} from 'questionnaire'

// Website-specific GameSettings that extends questionnaire GameSettings
export interface WebsiteGameSettings extends GameSettings {
  darkMode: boolean
}

export interface GameStats {
  totalGames: number
  averageScore: number
  bestScore: number
  earlyWins: number
  earlyFailures: number
}

// Win threshold percentage used for calculating pass requirements
export const WIN_THRESHOLD_PERCENTAGE = 0.6

export const DEFAULT_GAME_SETTINGS: WebsiteGameSettings = {
  maxQuestions: 20,
  winThreshold: Math.ceil(20 * WIN_THRESHOLD_PERCENTAGE), // 12 (60% of 20)
  userState: 'CA' as import('civics2json').StateAbbreviation,
  userDistrict: undefined,
  darkMode: false
}

// Statistics types
export interface QuestionStatistics {
  pairedQuestionNumber: string
  questionNumber: string
  questionText: string
  correctAnswerText: string
  timesAsked: number
  timesCorrect: number
  timesIncorrect: number
  accuracy: number
  selectionProbability: number
  lastAsked?: Date
}

export enum QuestionFilter {
  All = 'all',
  Mastered = 'mastered',
  NeedsPractice = 'needs-practice',
  NeverAsked = 'never-asked'
}

export enum QuestionSortField {
  QuestionNumber = 'question-number',
  TimesAsked = 'times-asked',
  Accuracy = 'accuracy',
  Probability = 'probability'
}
