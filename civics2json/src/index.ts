import { Effect } from 'effect'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { CivicsQuestionsClient } from './CivicsQuestions'
import { Command } from '@effect/cli'
import { FetchHttpClient } from '@effect/platform'
import { FileSystem } from '@effect/platform'
import { SenatorsClient } from './Senators'
import config from './config'

const questionsFetchCommand = Command.make(
  'fetch',
  {},
  Effect.fn(function* () {
    yield* Effect.log('Fetching civics questions from USCIS website...')
    const cq = yield* CivicsQuestionsClient
    const text = yield* cq.fetch()
    yield* Effect.log(`Fetched ${text.length} characters`)
  })
)

const questionsParseCommand = Command.make(
  'parse',
  {},
  Effect.fn(function* () {
    yield* Effect.log('Parsing civics questions...')
    const cq = yield* CivicsQuestionsClient
    const text = yield* cq.fetch()
    const questions = yield* cq.parse(text)
    const fs = yield* FileSystem.FileSystem
    const c = yield* config
    yield* fs.writeFileString(c.QUESTIONS_JSON_FILE, JSON.stringify(questions, null, 2))
    yield* Effect.log(`Parsed ${questions.length} questions to ${c.QUESTIONS_JSON_FILE}`)
  })
)

const senatorsFetchCommand = Command.make(
  'fetch',
  {},
  Effect.fn(function* () {
    yield* Effect.log('Fetching senators XML from Senate website...')
    const senators = yield* SenatorsClient
    const text = yield* senators.fetch()
    yield* Effect.log(`Fetched ${text.length} characters`)
  })
)

const representativesCommand = Command.make(
  'representatives',
  {},
  Effect.fn(function* () {
    yield* Effect.log('Not implemented')
  })
)

const senatorsCommand = Command.make('senators').pipe(
  Command.withSubcommands([senatorsFetchCommand])
)

const questionsCommand = Command.make('questions').pipe(
  Command.withSubcommands([questionsFetchCommand, questionsParseCommand])
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
  Effect.provide(FetchHttpClient.layer),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
