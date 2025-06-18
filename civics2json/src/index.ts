import { Effect } from 'effect'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { CivicsQuestionsClient } from './CivicsQuestions'
import { Command } from '@effect/cli'
import { FetchHttpClient } from '@effect/platform'
import { QUESTIONS_JSON_FILE } from './config'
import { FileSystem } from '@effect/platform'

const fetchCommand = Command.make(
  'fetch',
  {},
  Effect.fn(function* () {
    yield* Effect.log('Fetching civics questions from USCIS website...')
    const cq = yield* CivicsQuestionsClient
    const text = yield* cq.fetch()
    yield* Effect.log(`Fetched ${text.length} characters`)
  })
)

const parseCommand = Command.make(
  'parse',
  {},
  Effect.fn(function* () {
    yield* Effect.log('Parsing civics questions...')
    const cq = yield* CivicsQuestionsClient
    const text = yield* cq.fetch()
    const questions = yield* cq.parse(text)
    const fs = yield* FileSystem.FileSystem
    const questionsJsonFile = yield* QUESTIONS_JSON_FILE
    yield* fs.writeFileString(questionsJsonFile, JSON.stringify(questions, null, 2))
    yield* Effect.log(`Parsed ${questions.length} questions to ${questionsJsonFile}`)
  })
)

const command = Command.make('civics-questions').pipe(
  Command.withSubcommands([fetchCommand, parseCommand])
)

const cli = Command.run(command, {
  name: 'Civics Questions CLI',
  version: 'v1.0.0'
})

cli(process.argv).pipe(
  Effect.scoped,
  Effect.provide(CivicsQuestionsClient.Default),
  Effect.provide(FetchHttpClient.layer),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
