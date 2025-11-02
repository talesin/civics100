import { GameSettings } from 'questionnaire'

// Re-export types from questionnaire package for consistency
export type {
  GameSession,
  GameResult,
  UserAnswer as QuestionAnswer,
  QuestionDisplay,
  GameSettings
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

export const DEFAULT_GAME_SETTINGS: WebsiteGameSettings = {
  maxQuestions: 20,
  winThreshold: 12,
  userState: 'CA' as import('civics2json').StateAbbreviation,
  userDistrict: undefined,
  darkMode: false
}
