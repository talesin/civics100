import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Command } from '@effect/cli'
import { Effect, Console } from 'effect'
import { StaticGenerator } from '../generators/static-generator'
import { SimilarityService } from '../services/SimilarityService'
import { QuestionsDataService } from '../data/questions-data-service'
import { FileSystem, Path } from '@effect/platform'

const cli = Command.make('distractors', {}, () =>
  Effect.gen(function* () {
    const generator = yield* StaticGenerator
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path

    const questionsWithDistractors = yield* generator.generate()

    const json = JSON.stringify(questionsWithDistractors, null, 2)
    const outputPath = path.join('data', 'distractors-output.json')

    yield* Console.log(`Writing to ${outputPath}`)
    yield* fs.writeFile(outputPath, new TextEncoder().encode(json))
    yield* Console.log('Done')
  })
)

const runnable = Command.run(cli, {
  name: 'Distractor Generator',
  version: '1.0.0'
})

runnable(process.argv).pipe(
  Effect.provide(StaticGenerator.Default),
  Effect.provide(SimilarityService.Default),
  Effect.provide(QuestionsDataService.Default),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
