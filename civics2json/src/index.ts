import { Effect } from 'effect'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { CivicsQuestionsClient } from './CivicsQuestions'
import { Command } from '@effect/cli'
import { FetchHttpClient } from '@effect/platform'
import { SenatorsClient } from './Senators'
import { QuestionsManager } from './QuestionsManager'

const questionsFetchCommand = Command.make('fetch', {}, () =>
  QuestionsManager.pipe(Effect.flatMap((manager) => manager.fetchCivicsQuestions()))
)

const questionsParseCommand = Command.make('parse', {}, () =>
  QuestionsManager.pipe(Effect.flatMap((manager) => manager.parseCivicsQuestions()))
)

const questionsConstructCommand = Command.make('construct', {}, () =>
  QuestionsManager.pipe(Effect.flatMap((manager) => manager.constructQuestions()))
)

const senatorsFetchCommand = Command.make('fetch', {}, () =>
  QuestionsManager.pipe(Effect.flatMap((manager) => manager.fetchSenators()))
)

const senatorsParseCommand = Command.make('parse', {}, () =>
  QuestionsManager.pipe(Effect.flatMap((manager) => manager.parseSenators()))
)

const representativesCommand = Command.make('representatives', {}, () =>
  QuestionsManager.pipe(Effect.flatMap((manager) => manager.fetchRepresentatives()))
)

const senatorsCommand = Command.make('senators').pipe(
  Command.withSubcommands([senatorsFetchCommand, senatorsParseCommand])
)

const questionsCommand = Command.make('questions').pipe(
  Command.withSubcommands([questionsFetchCommand, questionsParseCommand, questionsConstructCommand])
)

const command = Command.make('civics').pipe(
  Command.withSubcommands([questionsCommand, senatorsCommand, representativesCommand])
)

const cli = Command.run(command, {
  name: 'Civics Questions CLI',
  version: 'v0.1.0'
})

cli(process.argv).pipe(
  Effect.scoped,
  Effect.provide(CivicsQuestionsClient.Default),
  Effect.provide(SenatorsClient.Default),
  Effect.provide(QuestionsManager.Default),
  Effect.provide(FetchHttpClient.layer),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
