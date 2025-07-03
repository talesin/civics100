import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Command } from '@effect/cli'
import { Effect } from 'effect'
import { StaticGenerator } from '../generators/StaticGenerator'
import { SimilarityService } from '../services/SimilarityService'
import { QuestionsDataService } from '../data/QuestionsDataService'
import { DistractorManager } from '../services/DistractorManager'

const cli = Command.make('distractors', {}, () =>
  Effect.gen(function* () {
    const manager = yield* DistractorManager
    yield* manager.generateAndWrite()
  })
)

const runnable = Command.run(cli, {
  name: 'Distractor Generator',
  version: '1.0.0'
})

runnable(process.argv).pipe(
  Effect.provide(DistractorManager.Default),
  Effect.provide(StaticGenerator.Default),
  Effect.provide(SimilarityService.Default),
  Effect.provide(QuestionsDataService.Default),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
