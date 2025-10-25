import { Console, Effect, Layer } from 'effect'
import { FileSystem, Path } from '@effect/platform'
import { PlatformError } from '@effect/platform/Error'
import { EnhancedStaticGenerator } from '../generators/EnhancedStaticGenerator'
import { DEFAULT_GENERATION_OPTIONS, DistractorGenerationOptions } from '../types/config'

export const generateAndWrite = (
  generator: EnhancedStaticGenerator,
  fs: FileSystem.FileSystem,
  path: Path.Path,
  options: DistractorGenerationOptions = DEFAULT_GENERATION_OPTIONS
) =>
  Effect.fn(function* () {
    const outputPath = path.join('data', 'questions-with-distractors.json')
    const questionsWithDistractors = yield* generator.generateEnhanced(options)

    const json = JSON.stringify(questionsWithDistractors, null, 2)

    yield* Console.log(`Writing to ${outputPath}`)
    yield* fs.writeFile(outputPath, new TextEncoder().encode(json))
    yield* Console.log('Done')
  })

export class DistractorManager extends Effect.Service<DistractorManager>()('DistractorManager', {
  effect: Effect.gen(function* () {
    const generator = yield* EnhancedStaticGenerator
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    return {
      generateAndWrite: (options?: DistractorGenerationOptions) =>
        generateAndWrite(generator, fs, path, options)()
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
      generateAndWrite: fn?.generateAndWrite ?? ((_options?: DistractorGenerationOptions) => Effect.void)
    })
  )
