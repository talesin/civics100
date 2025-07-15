import { Effect, Layer } from 'effect'
import { GameSession, GameResult, UserAnswer, QuestionDisplay, GameSettings } from '@/types'
import { QuestionDataService } from './QuestionDataService'

const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

const createNewSession = (
  questionDataService: QuestionDataService
): ((
  settings: GameSettings,
  existingPairedAnswers?: import('questionnaire').PairedAnswers
) => Effect.Effect<GameSession>) =>
  Effect.fn(function* (
    settings: GameSettings,
    existingPairedAnswers?: import('questionnaire').PairedAnswers
  ) {
    const questions = yield* questionDataService.generateGameQuestions(
      settings.maxQuestions,
      settings.userState,
      existingPairedAnswers ?? {}
    )

    return {
      id: generateSessionId(),
      questions: questions.map((q) => q.id),
      currentQuestionIndex: 0,
      correctAnswers: 0,
      totalAnswered: 0,
      isCompleted: false,
      isEarlyWin: false,
      startedAt: new Date(),
      pairedAnswers: existingPairedAnswers ?? {}
    }
  })

const processAnswer = (
  session: GameSession,
  answer: UserAnswer,
  settings: GameSettings
): GameSession => {
  const newCorrectAnswers = session.correctAnswers + (answer.isCorrect ? 1 : 0)
  const newTotalAnswered = session.totalAnswered + 1
  const newCurrentIndex = session.currentQuestionIndex + 1

  const isEarlyWin = newCorrectAnswers >= settings.winThreshold
  const isCompleted = isEarlyWin || newTotalAnswered >= settings.maxQuestions

  return {
    ...session,
    currentQuestionIndex: newCurrentIndex,
    correctAnswers: newCorrectAnswers,
    totalAnswered: newTotalAnswered,
    isCompleted,
    isEarlyWin,
    completedAt: isCompleted ? new Date() : undefined
  }
}

const calculateResult = (session: GameSession): GameResult => {
  const percentage =
    session.totalAnswered > 0
      ? Math.round((session.correctAnswers / session.totalAnswered) * 100)
      : 0

  return {
    sessionId: session.id,
    totalQuestions: session.totalAnswered,
    correctAnswers: session.correctAnswers,
    percentage,
    isEarlyWin: session.isEarlyWin,
    completedAt: session.completedAt ?? new Date()
  }
}

const getCurrentQuestion = (
  session: GameSession,
  questions: QuestionDisplay[]
): QuestionDisplay | undefined => {
  return questions.find((q) => q.id === session.questions[session.currentQuestionIndex])
}

const canContinue = (session: GameSession, settings: GameSettings): boolean => {
  return (
    !session.isCompleted &&
    session.currentQuestionIndex < session.questions.length &&
    session.correctAnswers < settings.winThreshold
  )
}

export class SessionService extends Effect.Service<SessionService>()('SessionService', {
  effect: Effect.gen(function* () {
    const questionDataService = yield* QuestionDataService

    return {
      createNewSession: createNewSession(questionDataService),
      processAnswer,
      calculateResult,
      getCurrentQuestion,
      canContinue,
      generateSessionId: () => generateSessionId()
    }
  }),
  dependencies: [QuestionDataService.Default]
}) {}

export const TestSessionServiceLayer = (fn?: {
  createNewSession?: SessionService['createNewSession']
  processAnswer?: SessionService['processAnswer']
  calculateResult?: SessionService['calculateResult']
  getCurrentQuestion?: SessionService['getCurrentQuestion']
  canContinue?: SessionService['canContinue']
  generateSessionId?: SessionService['generateSessionId']
}) =>
  Layer.succeed(
    SessionService,
    SessionService.of({
      _tag: 'SessionService',
      createNewSession:
        fn?.createNewSession ??
        (() =>
          Effect.succeed({
            id: 'test-session',
            questions: [],
            currentQuestionIndex: 0,
            correctAnswers: 0,
            totalAnswered: 0,
            isCompleted: false,
            isEarlyWin: false,
            startedAt: new Date(),
            pairedAnswers: {}
          })),
      processAnswer: fn?.processAnswer ?? ((session) => session),
      calculateResult:
        fn?.calculateResult ??
        (() => ({
          sessionId: 'test',
          totalQuestions: 0,
          correctAnswers: 0,
          percentage: 0,
          isEarlyWin: false,
          completedAt: new Date()
        })),
      getCurrentQuestion: fn?.getCurrentQuestion ?? (() => undefined),
      canContinue: fn?.canContinue ?? (() => false),
      generateSessionId: fn?.generateSessionId ?? (() => 'test-id')
    })
  )
