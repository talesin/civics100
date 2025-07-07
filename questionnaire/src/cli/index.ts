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
const promptForInput = (prompt: string): Effect.Effect<string> =>
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
const gameLoop = (state: GameState, gameService: GameService): Effect.Effect<void> =>
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
 * CLI option for filtering questions by question numbers (for testing)
 */
const questionsOption = Options.text('questions').pipe(
  Options.optional,
  Options.withAlias('q'),
  Options.withDescription('Comma-separated list of question numbers to test (e.g., "1,20,43,100")')
)

/**
 * Parse and validate question numbers from comma-separated string
 */
const parseQuestionNumbers = (questionsStr: string): readonly number[] =>
  questionsStr
    .split(',')
    .map((num) => num.trim())
    .filter((num) => num.length > 0)
    .map((num) => parseInt(num, 10))
    .filter((num) => !isNaN(num) && num > 0)

/**
 * Main questionnaire command that starts the interactive game
 */
const cli = Command.make(
  'questionnaire',
  { state: stateOption, questions: questionsOption },
  ({ state, questions }) =>
    Effect.gen(function* () {
      yield* Console.log('🇺🇸 US Civics Questionnaire Engine')
      yield* Console.log('===================================')
      yield* Console.log('Answer questions to test your knowledge!')
      yield* Console.log('Unanswered and incorrect questions will appear more frequently.')
      yield* Console.log('')

      // Parse question numbers if provided
      const questionNumbers = Option.isSome(questions)
        ? parseQuestionNumbers(questions.value)
        : undefined

      if (questionNumbers && questionNumbers.length > 0) {
        yield* Console.log(`🎯 Testing with specific questions: ${questionNumbers.join(', ')}`)
        yield* Console.log('')
      }

      const gameService = yield* GameService
      const initialState = yield* gameService.initializeGame(
        state as StateAbbreviation,
        questionNumbers
      )

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
