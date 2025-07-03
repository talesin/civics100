import { Console, Effect } from 'effect'
import { FileSystem, Path } from '@effect/platform'
import { StaticGenerator } from '../generators/StaticGenerator'

export class DistractorManager extends Effect.Service<DistractorManager>()('DistractorManager', {
  effect: Effect.gen(function* () {
    const generator = yield* StaticGenerator
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    const generateAndWrite = () =>
      Effect.gen(function* () {
        const questionsWithDistractors = yield* generator.generate()

        const json = JSON.stringify(questionsWithDistractors, null, 2)
        const outputPath = path.join('data', 'distractors-output.json')

        yield* Console.log(`Writing to ${outputPath}`)
        yield* fs.writeFile(outputPath, new TextEncoder().encode(json))
        yield* Console.log('Done')
      })

    return {
      generateAndWrite
    }
  })
}) {}
