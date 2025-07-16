import { Effect, Layer } from 'effect'
import { QuestionDisplay, WebsiteGameSettings as WebsiteGameSettings } from '@/types'
import type {
  WebGameSession,
  GameResult,
  UserAnswer,
  GameSettings as QuestionnaireGameSettings
} from 'questionnaire'
import { GameService } from 'questionnaire'

/**
 * Convert website GameSettings to questionnaire GameSettings
 */
const convertWebsiteToQuestionnaireSettings = (
  websiteSettings: WebsiteGameSettings
): QuestionnaireGameSettings => {
  const { darkMode: _darkMode, ...questionnaireSettings } = websiteSettings
  return questionnaireSettings
}

/**
 * Create a new web game session using questionnaire's GameService
 */
const createNewSession = (gameService: GameService) =>
  Effect.fn(function* (
    settings: WebsiteGameSettings,
    existingPairedAnswers?: import('questionnaire').PairedAnswers
  ) {
    const questionnaireSettings = convertWebsiteToQuestionnaireSettings(settings)
    const { session } = yield* gameService.createWebGameSession(
      questionnaireSettings,
      existingPairedAnswers
    )
    return session
  })

/**
 * Process answer using questionnaire's GameService
 */
const processAnswer =
  (gameService: GameService) =>
  (session: WebGameSession, answer: UserAnswer): WebGameSession => {
    return gameService.processWebGameAnswer(session, answer)
  }

/**
 * Calculate result using questionnaire's GameService
 */
const calculateResult =
  (gameService: GameService) =>
  (session: WebGameSession): GameResult => {
    return gameService.calculateGameResult(session)
  }

/**
 * Get current question from a list of questions
 */
const getCurrentQuestion = (
  session: WebGameSession,
  questions: QuestionDisplay[]
): QuestionDisplay | undefined => {
  return questions.find((q) => q.id === session.questions[session.currentQuestionIndex])
}

/**
 * Check if the session can continue
 */
const canContinue = (session: WebGameSession): boolean => {
  return (
    !session.isCompleted &&
    session.currentQuestionIndex < session.questions.length &&
    session.correctAnswers < session.settings.winThreshold
  )
}

export class SessionService extends Effect.Service<SessionService>()('SessionService', {
  effect: Effect.gen(function* () {
    const gameService = yield* GameService

    return {
      createNewSession: createNewSession(gameService),
      processAnswer: processAnswer(gameService),
      calculateResult: calculateResult(gameService),
      getCurrentQuestion,
      canContinue,
      generateSessionId: () => gameService.generateSessionId()
    }
  }),
  dependencies: [GameService.Default]
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
            pairedAnswers: {},
            settings: {
              maxQuestions: 10,
              winThreshold: 6,
              userState: 'CA' as import('civics2json').StateAbbreviation
            }
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
