import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Command, Options } from '@effect/cli'
import { Effect, Console, Option } from 'effect'
import type { StateAbbreviation } from 'civics2json'
import { GameService, type GameState } from './GameService.js'
import { QuestionDataService } from '../QuestionDataService.js'
import { QuestionSelector } from '../QuestionSelector.js'
import { createInterface } from 'readline'

/**
 * Prompt for user input using readline
 */
const promptForInput = (prompt: string): Effect.Effect<string, never, never> =>
  Effect.async<string>((resume) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question(prompt, (answer: string) => {
      rl.close()
      resume(Effect.succeed(answer.trim()))
    })
  })

/**
 * Main game loop that handles user interaction
 */
const gameLoop = (state: GameState, gameService: GameService): Effect.Effect<void, never, never> =>
  Effect.gen(function* () {
    if (Option.isNone(state.currentQuestion)) {
      const nextQuestionWithWeight = yield* gameService.getNextQuestion(state)

      if (Option.isNone(nextQuestionWithWeight)) {
        yield* Console.log('🎉 No more questions available!')
        return
      }

      const { question, weight } = nextQuestionWithWeight.value
      const newState = { ...state, currentQuestion: Option.some(question) }
      yield* gameService.displayQuestion(question, weight, newState)

      const userInput = yield* promptForInput(
        'Your answer (A/B/C/D) or "stats" for statistics or "quit" to exit: '
      )

      if (userInput.toLowerCase() === 'quit') {
        yield* Console.log('👋 Thanks for practicing!')
        return
      }

      if (userInput.toLowerCase() === 'stats') {
        yield* gameService.displayStats(newState)
        yield* gameLoop(newState, gameService)
        return
      }

      const updatedState = yield* gameService.processAnswer(userInput, question, newState)
      yield* gameLoop(updatedState, gameService)
    }
  })

/**
 * CLI option for user's state
 */
const stateOption = Options.text('state').pipe(
  Options.withAlias('s'),
  Options.withDescription('Your state abbreviation (e.g., CA, NY, TX)')
)

/**
 * Main questionnaire command that starts the interactive game
 */
const cli = Command.make('questionnaire', { state: stateOption }, ({ state }) =>
  Effect.gen(function* () {
    yield* Console.log('🇺🇸 US Civics Questionnaire Engine')
    yield* Console.log('===================================')
    yield* Console.log('Answer questions to test your knowledge!')
    yield* Console.log('Unanswered and incorrect questions will appear more frequently.')
    yield* Console.log('')

    const gameService = yield* GameService
    const initialState = yield* gameService.initializeGame(state as StateAbbreviation)

    yield* Console.log(`Loaded ${initialState.questions.length} questions with distractors.`)
    yield* Console.log(`State: ${state}`)
    yield* Console.log('')

    yield* gameLoop(initialState, gameService)
  })
)

const runnable = Command.run(cli, {
  name: 'US Civics Questionnaire',
  version: '1.0.0'
})

runnable(process.argv).pipe(
  Effect.provide(QuestionDataService.Default),
  Effect.provide(QuestionSelector.Default),
  Effect.provide(GameService.Default),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
