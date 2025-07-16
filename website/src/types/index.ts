// Re-export types from questionnaire package for consistency
export type {
  WebGameSession as GameSession,
  GameResult,
  UserAnswer as QuestionAnswer,
  QuestionDisplay,
  GameSettings as QuestionnaireGameSettings
} from 'questionnaire'

import type { GameSettings as QuestionnaireGameSettings } from 'questionnaire'

// Website-specific GameSettings that extends questionnaire GameSettings
export interface WebsiteGameSettings extends QuestionnaireGameSettings {
  darkMode: boolean
}

export interface GameStats {
  totalGames: number
  averageScore: number
  bestScore: number
  earlyWins: number
}

export const DEFAULT_GAME_SETTINGS: WebsiteGameSettings = {
  maxQuestions: 10,
  winThreshold: 6,
  userState: 'CA' as import('civics2json').StateAbbreviation,
  darkMode: false
}
