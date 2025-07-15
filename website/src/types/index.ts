export interface GameSession {
  id: string
  questions: string[]
  currentQuestionIndex: number
  correctAnswers: number
  totalAnswered: number
  isCompleted: boolean
  isEarlyWin: boolean
  startedAt: Date
  completedAt?: Date | undefined
  // Add adaptive learning state
  pairedAnswers?: import('questionnaire').PairedAnswers
}

export interface QuestionDisplay {
  id: string
  questionText: string
  answers: string[]
  correctAnswerIndex: number
  questionNumber: number
  totalQuestions: number
}

export interface GameSettings {
  maxQuestions: number
  winThreshold: number
  userState: import('civics2json').StateAbbreviation
  darkMode: boolean
}

export interface GameResult {
  sessionId: string
  totalQuestions: number
  correctAnswers: number
  percentage: number
  isEarlyWin: boolean
  completedAt: Date
}

export interface UserAnswer {
  questionId: string
  selectedAnswerIndex: number
  isCorrect: boolean
  answeredAt: Date
}

export type QuestionAnswer = UserAnswer

export type GameQuestion = QuestionDisplay

export interface GameStats {
  totalGames: number
  averageScore: number
  bestScore: number
  earlyWins: number
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxQuestions: 10,
  winThreshold: 6,
  userState: 'CA' as import('civics2json').StateAbbreviation,
  darkMode: false
}
