import { Effect, Layer } from 'effect'
import { QuestionDisplay, GameSettings } from '@/types'
import type { StateAbbreviation } from 'civics2json'
import { GameService, GameServiceDefault, PairedAnswers } from 'questionnaire'

/**
 * Convert website GameSettings to questionnaire GameSettings
 */
const convertToQuestionnaireSettings = (
  maxQuestions: number,
  userState: StateAbbreviation = 'CA',
  questionNumbers?: readonly number[] | undefined
): GameSettings => ({
  maxQuestions,
  winThreshold: 6, // Default win threshold
  userState,
  questionNumbers
})

/**
 * Generate game questions using the questionnaire package's GameService
 * This delegates all game logic to the questionnaire package
 */
const generateGameQuestions = (gameService: GameService) =>
  Effect.fn(function* (
    questionCount: number,
    userState: StateAbbreviation = 'CA',
    pairedAnswers: PairedAnswers = {}
  ) {
    const settings = convertToQuestionnaireSettings(questionCount, userState)

    const { questions } = yield* gameService.createGameSession(settings, pairedAnswers)

    // Transform questions to UI format
    const questionDisplays: QuestionDisplay[] = questions.map((question, index) =>
      gameService.transformQuestionToDisplay(question, index + 1, questionCount)
    )

    return questionDisplays
  })

/**
 * Website's QuestionDataService that delegates to questionnaire package's GameService
 * Provides UI-specific transformations while keeping all game logic in questionnaire package
 */
export class QuestionDataService extends Effect.Service<QuestionDataService>()(
  'QuestionDataService',
  {
    effect: Effect.gen(function* () {
      const gameService = yield* GameService

      return {
        generateGameQuestions: generateGameQuestions(gameService)
      }
    }),
    dependencies: [GameServiceDefault]
  }
) {}

export const TestQuestionDataServiceLayer = (fn?: {
  generateGameQuestions?: (
    questionCount: number,
    userState?: StateAbbreviation,
    pairedAnswers?: PairedAnswers
  ) => Effect.Effect<QuestionDisplay[], never, never>
}) =>
  Layer.succeed(
    QuestionDataService,
    QuestionDataService.of({
      _tag: 'QuestionDataService',
      generateGameQuestions: fn?.generateGameQuestions ?? (() => Effect.succeed([]))
    })
  )
