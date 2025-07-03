import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Command } from '@effect/cli'
import { Effect } from 'effect'
import { StaticGenerator } from '../generators/StaticGenerator'
import { QuestionsDataService } from '../data/QuestionsDataService'
import { DistractorManager } from '../services/DistractorManager'
import { CuratedDistractorService } from '../services/CuratedDistractorService'

const cli = Command.make('distractors', {}, () =>
  Effect.gen(function* () {
    console.log('Starting distractor generation...')
    const manager = yield* DistractorManager
    console.log('Got DistractorManager, calling generateAndWrite...')
    yield* manager.generateAndWrite()
    console.log('Generation complete!')
  })
)

const runnable = Command.run(cli, {
  name: 'Distractor Generator',
  version: '1.0.0'
})

runnable(process.argv).pipe(
  Effect.provide(CuratedDistractorService.Default),
  Effect.provide(StaticGenerator.Default),
  Effect.provide(QuestionsDataService.Default),
  Effect.provide(DistractorManager.Default),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
