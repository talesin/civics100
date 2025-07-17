// Mock questionnaire main module for testing
import { Effect, Option, Brand } from 'effect'

// Mock Brand types - these need to be defined here instead of imported
export type QuestionNumber = string & Brand.Brand<'QuestionNumber'>
export const QuestionNumber = Brand.nominal<QuestionNumber>()

export type PairedQuestionNumber = string & Brand.Brand<'PairedQuestionNumber'>
export const PairedQuestionNumber = Brand.nominal<PairedQuestionNumber>()

// Mock other types that are imported
export type Question = {
  questionNumber: QuestionNumber
  pairedQuestionNumber: PairedQuestionNumber
  question: string
  correctAnswer: number
  correctAnswerText: string
  answers: ReadonlyArray<string>
}

export type QuestionDataSource = {
  questions: unknown
  userState: string
  questionNumbers?: readonly number[]
}

export type PairedAnswers = Record<PairedQuestionNumber, Array<{ ts: Date; correct: boolean }>>

export type GameSettings = {
  maxQuestions: number
  winThreshold: number
  userState: string
  questionNumbers?: readonly number[]
}

export type WebGameSession = {
  id: string
  questions: ReadonlyArray<string>
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

export type UserAnswer = {
  questionId: string
  selectedAnswerIndex: number
  isCorrect: boolean
  answeredAt: Date
}

export type GameResult = {
  sessionId: string
  totalQuestions: number
  correctAnswers: number
  percentage: number
  isEarlyWin: boolean
  completedAt: Date
}

export type QuestionDisplay = {
  id: string
  questionText: string
  answers: ReadonlyArray<string>
  correctAnswerIndex: number
  questionNumber: number
  totalQuestions: number
}

export * from './questionnaire-data'

// Mock utility functions
export const getAvailablePairedQuestionNumbers = (questions: Question[]): PairedQuestionNumber[] =>
  questions.map((q) => q.pairedQuestionNumber)

export const findQuestionByPairedNumber = (
  pairedQuestionNumber: PairedQuestionNumber,
  questions: Question[]
) => {
  const found = questions.find((q) => q.pairedQuestionNumber === pairedQuestionNumber)
  return Option.fromNullable(found)
}

export const getQuestionCount = (questions: Question[]): number => questions.length

// Mock QuestionSelector - not used in current implementation but kept for future use
export const QuestionSelector = {
  selectPairedQuestion: () => Option.some(PairedQuestionNumber('1-0')),
  getPairedQuestionStats: () => ({
    totalAnswered: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    accuracy: 0
  }),
  recordPairedAnswer: (_: unknown, __: unknown, answers: unknown) => answers,
  getLearningProgress: () => ({
    totalQuestionsAttempted: 0,
    totalAnswers: 0,
    overallAccuracy: 0,
    masteredQuestions: 0
  })
}

// Mock loadQuestions function
// Mock services
import { Layer, Effect } from 'effect'

// Create a proper mock GameService
export class GameService extends Effect.Service<GameService>()('GameService', {
  effect: Effect.succeed({
    initializeGame: () => Effect.succeed({ questions: [], answers: {}, currentQuestion: null }),
    getNextQuestion: () => Effect.succeed(null),
    displayQuestion: () => Effect.succeed(undefined),
    displayStats: () => Effect.succeed(undefined),
    processAnswer: () => Effect.succeed({}),
    createWebGameSession: () => Effect.succeed({ 
      session: {
        id: 'test-session',
        questions: [],
        currentQuestionIndex: 0,
        correctAnswers: 0,
        totalAnswered: 0,
        isCompleted: false,
        isEarlyWin: false,
        startedAt: new Date(),
        pairedAnswers: {},
        settings: {
          maxQuestions: 10,
          winThreshold: 6,
          userState: 'CA'
        }
      }, 
      questions: [] 
    }),
    processWebGameAnswer: (session: any) => session,
    calculateGameResult: () => ({
      sessionId: 'test',
      totalQuestions: 0,
      correctAnswers: 0,
      percentage: 0,
      isEarlyWin: false,
      completedAt: new Date()
    }),
    transformQuestionToDisplay: (question: any, questionNumber: number, totalQuestions: number) => ({
      id: 'test-question',
      questionText: 'Test question',
      answers: [],
      correctAnswerIndex: 0,
      questionNumber,
      totalQuestions
    }),
    generateSessionId: () => 'test-session-id'
  })
}) {}

export const GameServiceDefault = GameService.Default

export const TestGameServiceLayer = (fn?: any) =>
  Layer.succeed(GameService, GameService.of({
    _tag: 'GameService',
    initializeGame: fn?.initializeGame ?? (() => Effect.succeed({ questions: [], answers: {}, currentQuestion: null })),
    getNextQuestion: fn?.getNextQuestion ?? (() => Effect.succeed(null)),
    displayQuestion: fn?.displayQuestion ?? (() => Effect.succeed(undefined)),
    displayStats: fn?.displayStats ?? (() => Effect.succeed(undefined)),
    processAnswer: fn?.processAnswer ?? (() => Effect.succeed({})),
    createWebGameSession: fn?.createWebGameSession ?? ((settings: any) => Effect.succeed({
      session: {
        id: 'test-session',
        questions: Array.from({ length: settings.maxQuestions }, (_, i) => `${i + 1}-0`),
        currentQuestionIndex: 0,
        correctAnswers: 0,
        totalAnswered: 0,
        isCompleted: false,
        isEarlyWin: false,
        startedAt: new Date(),
        pairedAnswers: {},
        settings
      },
      questions: Array.from({ length: settings.maxQuestions }, (_, i) => ({
        questionNumber: QuestionNumber((i + 1).toString()),
        pairedQuestionNumber: PairedQuestionNumber(`${i + 1}-0`),
        question: `Test question ${i + 1}`,
        correctAnswer: 0,
        correctAnswerText: `Test answer ${i + 1}`,
        answers: [`Test answer ${i + 1}`, 'Wrong answer 1', 'Wrong answer 2', 'Wrong answer 3']
      }))
    })),
    processWebGameAnswer: fn?.processWebGameAnswer ?? ((session: any, answer: any) => {
      const newCorrectAnswers = session.correctAnswers + (answer.isCorrect ? 1 : 0)
      const newTotalAnswered = session.totalAnswered + 1
      const newCurrentIndex = session.currentQuestionIndex + 1
      const isEarlyWin = newCorrectAnswers >= session.settings.winThreshold
      const isCompleted = isEarlyWin || newTotalAnswered >= session.settings.maxQuestions
      
      const updatedSession = {
        ...session,
        currentQuestionIndex: newCurrentIndex,
        correctAnswers: newCorrectAnswers,
        totalAnswered: newTotalAnswered,
        isCompleted,
        isEarlyWin
      }
      
      if (isCompleted) {
        updatedSession.completedAt = new Date()
      }
      
      return updatedSession
    }),
    calculateGameResult: fn?.calculateGameResult ?? ((session: any) => ({
      sessionId: session.id,
      totalQuestions: session.totalAnswered,
      correctAnswers: session.correctAnswers,
      percentage: session.totalAnswered > 0 ? Math.round((session.correctAnswers / session.totalAnswered) * 100) : 0,
      isEarlyWin: session.isEarlyWin,
      completedAt: session.completedAt ?? new Date()
    })),
    transformQuestionToDisplay: fn?.transformQuestionToDisplay ?? ((question: any, questionNumber: number, totalQuestions: number) => ({
      id: 'test-question',
      questionText: 'Test question',
      answers: [],
      correctAnswerIndex: 0,
      questionNumber,
      totalQuestions
    })),
    generateSessionId: fn?.generateSessionId ?? (() => 'test-session-id')
  }))

export const loadQuestions = (
  _dataSource: QuestionDataSource
): Effect.Effect<readonly Question[], never, never> => {
  // Simple mock implementation that returns sample questions
  const mockQuestions: Question[] = [
    {
      questionNumber: QuestionNumber('1'),
      pairedQuestionNumber: PairedQuestionNumber('1-0'),
      question: 'What is the supreme law of the land?',
      correctAnswer: 0,
      correctAnswerText: 'the Constitution',
      answers: [
        'the Constitution',
        'the Declaration of Independence',
        'the Bill of Rights',
        'the Articles of Confederation'
      ]
    },
    {
      questionNumber: QuestionNumber('2'),
      pairedQuestionNumber: PairedQuestionNumber('2-0'),
      question: 'What does the Constitution do?',
      correctAnswer: 1,
      correctAnswerText: 'sets up the government',
      answers: [
        'protects basic rights',
        'sets up the government',
        'defines the law',
        'protects the country'
      ]
    },
    {
      questionNumber: QuestionNumber('3'),
      pairedQuestionNumber: PairedQuestionNumber('3-0'),
      question:
        'The idea of self-government is in the first three words of the Constitution. What are these words?',
      correctAnswer: 2,
      correctAnswerText: 'We the People',
      answers: ['We the Nation', 'We the Government', 'We the People', 'We the Citizens']
    },
    {
      questionNumber: QuestionNumber('4'),
      pairedQuestionNumber: PairedQuestionNumber('4-0'),
      question: 'What is an amendment?',
      correctAnswer: 0,
      correctAnswerText: 'a change to the Constitution',
      answers: [
        'a change to the Constitution',
        'a new law',
        'a court decision',
        'a presidential order'
      ]
    },
    {
      questionNumber: QuestionNumber('5'),
      pairedQuestionNumber: PairedQuestionNumber('5-0'),
      question: 'What do we call the first ten amendments to the Constitution?',
      correctAnswer: 3,
      correctAnswerText: 'the Bill of Rights',
      answers: [
        'the Constitutional Amendments',
        'the Original Amendments',
        'the First Amendments',
        'the Bill of Rights'
      ]
    },
    {
      questionNumber: QuestionNumber('6'),
      pairedQuestionNumber: PairedQuestionNumber('6-0'),
      question: 'What is one right or freedom from the First Amendment?',
      correctAnswer: 0,
      correctAnswerText: 'speech',
      answers: ['speech', 'bear arms', 'trial by jury', 'due process']
    }
  ]

  return Effect.succeed(mockQuestions)
}
