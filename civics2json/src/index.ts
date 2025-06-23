import { Effect } from 'effect'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { CivicsQuestionsClient } from './CivicsQuestions'
import { Command, Options } from '@effect/cli'
import { FetchHttpClient } from '@effect/platform'
import { SenatorsClient } from './Senators'
import { QuestionsManager } from './QuestionsManager'
import { RepresentativesClient } from './Representatives'

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

const representativesFetchCommand = Command.make(
  'fetch',
  { forceFetch: Options.boolean('force').pipe(Options.withDescription('Force fetch')) },
  ({ forceFetch }) =>
    QuestionsManager.pipe(Effect.flatMap((manager) => manager.fetchRepresentatives({ forceFetch })))
).pipe(Command.withDescription('Fetch representatives'))

const representativesParseCommand = Command.make(
  'parse',
  { forceFetch: Options.boolean('force').pipe(Options.withDescription('Force parse')) },
  ({ forceFetch }) =>
    QuestionsManager.pipe(Effect.flatMap((manager) => manager.parseRepresentatives({ forceFetch })))
).pipe(Command.withDescription('Parse representatives'))

const representativesCommand = Command.make('representatives').pipe(
  Command.withSubcommands([representativesFetchCommand, representativesParseCommand])
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
  Effect.provide(RepresentativesClient.Default),
  Effect.provide(FetchHttpClient.layer),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
