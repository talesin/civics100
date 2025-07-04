import { Console, Effect, Layer } from 'effect'
import { FileSystem, Path } from '@effect/platform'
import { PlatformError } from '@effect/platform/Error'
import { StaticGenerator } from '../generators/StaticGenerator'

export const generateAndWrite = (
  generator: StaticGenerator,
  fs: FileSystem.FileSystem,
  path: Path.Path
) =>
  Effect.fn(function* () {
    const outputPath = path.join('data', 'questions-with-distractors.json')
    const questionsWithDistractors = yield* generator.generate()

    const json = JSON.stringify(questionsWithDistractors, null, 2)

    yield* Console.log(`Writing to ${outputPath}`)
    yield* fs.writeFile(outputPath, new TextEncoder().encode(json))
    yield* Console.log('Done')
  })

export class DistractorManager extends Effect.Service<DistractorManager>()('DistractorManager', {
  effect: Effect.gen(function* () {
    const generator = yield* StaticGenerator
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    return {
      generateAndWrite: generateAndWrite(generator, fs, path)
    }
  }),
  dependencies: [StaticGenerator.Default]
}) {}

export const TestDistractorManagerLayer = (fn?: {
  generateAndWrite?: () => Effect.Effect<void, PlatformError>
}) =>
  Layer.succeed(
    DistractorManager,
    DistractorManager.of({
      _tag: 'DistractorManager',
      generateAndWrite: fn?.generateAndWrite ?? (() => Effect.void)
    })
  )
