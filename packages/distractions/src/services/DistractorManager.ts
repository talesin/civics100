import { Console, Effect, Layer } from 'effect'
import { FileSystem, Path } from '@effect/platform'
import { PlatformError } from '@effect/platform/Error'
import { EnhancedStaticGenerator } from '../generators/EnhancedStaticGenerator'
import { QuestionWithDistractors } from '../generators/StaticGenerator'
import { DEFAULT_GENERATION_OPTIONS, DistractorGenerationOptions } from '../types/config'
import { distractorTargetCountConfig } from '../config/environment'

export const generateAndWrite = (
  generator: EnhancedStaticGenerator,
  fs: FileSystem.FileSystem,
  path: Path.Path,
  options: DistractorGenerationOptions = DEFAULT_GENERATION_OPTIONS
) =>
  Effect.fn(function* () {
    const outputPath = path.join('data', 'questions-with-distractors.json')
    const newQuestions = yield* generator.generateEnhanced(options)

    // When updating a single question, merge with existing data
    let questionsToWrite: QuestionWithDistractors[]
    if (options.questionNumber !== undefined) {
      // Read existing file
      const existingData = yield* fs.readFileString(outputPath).pipe(
        Effect.map((content) => JSON.parse(content) as QuestionWithDistractors[]),
        Effect.catchAll(() => Effect.succeed([] as QuestionWithDistractors[]))
      )

      const updatedQuestion = newQuestions[0]
      if (existingData.length > 0 && newQuestions.length === 1 && updatedQuestion !== undefined) {
        // Replace the updated question, keep others unchanged
        questionsToWrite = existingData.map((q) =>
          q.questionNumber === options.questionNumber ? updatedQuestion : q
        )
        yield* Console.log(
          `Merged question ${options.questionNumber} with ${existingData.length - 1} existing questions`
        )
      } else {
        // No existing data or unexpected result count - just write what we have
        questionsToWrite = newQuestions
      }
    } else {
      questionsToWrite = newQuestions
    }

    const json = JSON.stringify(questionsToWrite, null, 2)

    yield* Console.log(`Writing to ${outputPath}`)
    yield* fs.writeFile(outputPath, new TextEncoder().encode(json))
    yield* Console.log('Done')
  })

export class DistractorManager extends Effect.Service<DistractorManager>()('DistractorManager', {
  effect: Effect.gen(function* () {
    const generator = yield* EnhancedStaticGenerator
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    // Read target count from environment config
    const envTargetCount = yield* distractorTargetCountConfig

    return {
      generateAndWrite: (options?: DistractorGenerationOptions) => {
        // Merge environment config with provided options, using env as default
        const mergedOptions: DistractorGenerationOptions = {
          ...DEFAULT_GENERATION_OPTIONS,
          targetCount: envTargetCount,
          ...options
        }
        return generateAndWrite(generator, fs, path, mergedOptions)()
      }
    }
  }),
  dependencies: [EnhancedStaticGenerator.Default]
}) {}

export const TestDistractorManagerLayer = (fn?: {
  generateAndWrite?: (options?: DistractorGenerationOptions) => Effect.Effect<void, PlatformError>
}) =>
  Layer.succeed(
    DistractorManager,
    DistractorManager.of({
      _tag: 'DistractorManager',
      generateAndWrite:
        fn?.generateAndWrite ?? ((_options?: DistractorGenerationOptions) => Effect.void)
    })
  )
