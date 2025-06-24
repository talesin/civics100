import { Effect, Schema } from 'effect'

import { CivicsQuestionsClient } from './CivicsQuestions'
import { SenatorsClient } from './Senators'
import { PlatformError } from '@effect/platform/Error'
import { HttpClientError } from '@effect/platform/HttpClientError'
import { Question, Representative, RepresentativeSchema, Senator } from './types'
import { ParseError } from 'effect/ParseResult'
import { UnknownException } from 'effect/Cause'
import { RepresentativesClient } from './Representatives'
import { FileSystem } from '@effect/platform'
import { CivicsConfig } from './config'

/**
 * The canonical question string used to identify the senator question in the civics questions set.
 */
export const STATE_SENATORS_QUESTION = "Who is one of your state's U.S. Senators now?*"

/**
 * The canonical question string used to identify the representative question in the civics questions set.
 */
export const STATE_REPRESENTATIVES_QUESTION = 'Name your U.S. Representative.'

/**
 * Fetches the civics questions text using the CivicsQuestionsClient.
 * @param cq CivicsQuestionsClient instance
 * @returns Effect that resolves to the civics questions text
 */
export const fetchCivicsQuestions = (
  fs: FileSystem.FileSystem,
  cq: CivicsQuestionsClient,
  config: CivicsConfig
): (() => Effect.Effect<string, HttpClientError | PlatformError>) =>
  Effect.fn(function* () {
    const exists = yield* fs.exists(config.QUESTIONS_TEXT_FILE)
    if (exists) {
      yield* Effect.log(`Using local file ${config.QUESTIONS_TEXT_FILE}`)
      return yield* fs.readFileString(config.QUESTIONS_TEXT_FILE)
    }
    const text = yield* cq.fetch()
    yield* Effect.log(`Saving fetched content to ${config.QUESTIONS_TEXT_FILE}`)
    yield* fs.writeFileString(config.QUESTIONS_TEXT_FILE, text)
    return text
  })

/**
 * Fetches, parses, and writes civics questions using the CivicsQuestionsClient.
 * @param cq CivicsQuestionsClient instance
 * @returns Effect that resolves to an array of parsed civics questions
 */
export const fetchAndParseCivicsQuestions = (
  fs: FileSystem.FileSystem,
  cq: CivicsQuestionsClient,
  config: CivicsConfig
): (() => Effect.Effect<readonly Question[], HttpClientError | PlatformError>) =>
  Effect.fn(function* () {
    const text = yield* fetchCivicsQuestions(fs, cq, config)()
    const questions = yield* cq.parse(text)
    yield* Effect.log(`Writing ${questions.length} questions JSON to ${config.QUESTIONS_JSON_FILE}`)
    yield* fs.writeFileString(config.QUESTIONS_JSON_FILE, JSON.stringify(questions, null, 2))
    return questions
  })

/**
 * Fetches the senators XML text using the SenatorsClient.
 * @param sc SenatorsClient instance
 * @returns Effect that resolves to the senators XML text
 */
export const fetchSenators = (
  fs: FileSystem.FileSystem,
  sc: SenatorsClient,
  c: CivicsConfig
): (() => Effect.Effect<string, HttpClientError | PlatformError>) =>
  Effect.fn(function* () {
    const exists = yield* fs.exists(c.SENATORS_XML_FILE)
    if (exists) {
      yield* Effect.log(`Using local senators XML file ${c.SENATORS_XML_FILE}`)
      return yield* fs.readFileString(c.SENATORS_XML_FILE)
    }
    const xml = yield* sc.fetch()
    yield* Effect.log(`Saving fetched senators XML content to ${c.SENATORS_XML_FILE}`)
    yield* fs.writeFileString(c.SENATORS_XML_FILE, xml)
    return xml
  })

/**
 * Fetches, parses, and writes senators using the SenatorsClient.
 * @param sc SenatorsClient instance
 * @returns Effect that resolves to an array of parsed Senator objects
 */
export const fetchAndParseSenators = (
  fs: FileSystem.FileSystem,
  sc: SenatorsClient,
  c: CivicsConfig
): (() => Effect.Effect<
  readonly Senator[],
  ParseError | UnknownException | HttpClientError | PlatformError
>) =>
  Effect.fn(function* () {
    const xml = yield* fetchSenators(fs, sc, c)()
    const senators = yield* sc.parse(xml)
    yield* Effect.log(`Writing senators JSON to ${c.SENATORS_JSON_FILE}`)
    yield* fs.writeFileString(c.SENATORS_JSON_FILE, JSON.stringify(senators, null, 2))
    return senators
  })

export const fetchRepresentatives = (
  fs: FileSystem.FileSystem,
  representatives: RepresentativesClient,
  c: CivicsConfig
) =>
  Effect.fn(function* (options?: { forceFetch?: boolean }) {
    const exists = yield* fs.exists(c.REPRESENTATIVES_HTML_FILE)
    if (options?.forceFetch !== true && exists) {
      yield* Effect.log(`Using local representatives file ${c.REPRESENTATIVES_HTML_FILE}`)
      return yield* fs.readFileString(c.REPRESENTATIVES_HTML_FILE)
    }
    const html = yield* representatives.fetch()
    yield* fs.writeFileString(c.REPRESENTATIVES_HTML_FILE, html)
    return html
  })

export const fetchAndParseRepresentatives = (
  fs: FileSystem.FileSystem,
  rc: RepresentativesClient,
  c: CivicsConfig
): ((options?: {
  forceFetch?: boolean
}) => Effect.Effect<
  readonly Representative[],
  ParseError | UnknownException | HttpClientError | PlatformError
>) =>
  Effect.fn(function* (options?: { forceFetch?: boolean }) {
    const exists = yield* fs.exists(c.REPRESENTATIVES_JSON_FILE)
    if (options?.forceFetch !== true && exists) {
      yield* Effect.log(`Using local representatives JSON file ${c.REPRESENTATIVES_JSON_FILE}`)
      const json = yield* Schema.decodeUnknown(Schema.parseJson())(
        yield* fs.readFileString(c.REPRESENTATIVES_JSON_FILE)
      )
      return yield* Schema.decodeUnknown(Schema.Array(RepresentativeSchema))(json)
    }
    const html = yield* fetchRepresentatives(fs, rc, c)(options)
    const representatives = yield* rc.parse(html)
    yield* fs.writeFileString(c.REPRESENTATIVES_JSON_FILE, JSON.stringify(representatives, null, 2))
    return representatives
  })

export const getSenatorsQuestion = (
  fs: FileSystem.FileSystem,
  sc: SenatorsClient,
  c: CivicsConfig
) =>
  Effect.fn(function* (questionMap: Record<string, Question>) {
    // fail if we cannot find the senators question
    if (questionMap[STATE_SENATORS_QUESTION] === undefined) {
      return yield* Effect.fail(new Error('State senators question not found'))
    }
    const senators = (yield* fetchAndParseSenators(fs, sc, c)()).map((s) => ({
      senator: `${s.first_name} ${s.last_name} (${s.state}-${s.party})`,
      state: s.state
    }))

    // update the senators question
    const senatorsQuestion: Question = {
      ...questionMap[STATE_SENATORS_QUESTION],
      answers: { _type: 'senator', choices: senators }
    }
    return senatorsQuestion
  })

export const getRepresentativesQuestions = (
  fs: FileSystem.FileSystem,
  rc: RepresentativesClient,
  c: CivicsConfig
) =>
  Effect.fn(function* (questionMap: Record<string, Question>) {
    // fail if we cannot find the representatives question
    if (questionMap[STATE_REPRESENTATIVES_QUESTION] === undefined) {
      return yield* Effect.fail(new Error('State representatives question not found'))
    }
    const representatives = (yield* fetchAndParseRepresentatives(fs, rc, c)()).map((r) => ({
      representative: `${r.name} (${r.state}-${r.party})`,
      state: r.state
    }))

    // update the representatives question
    const representativesQuestion: Question = {
      ...questionMap[STATE_REPRESENTATIVES_QUESTION],
      answers: { _type: 'representative', choices: representatives }
    }
    return representativesQuestion
  })

/**
 * Constructs the civics questions set, replacing the senator question's answers with the current list of senators.
 * Fetches and parses both the civics questions and senators, then updates the senator question.
 * Writes the updated questions back to disk.
 *
 * @param cq CivicsQuestionsClient instance
 * @param sc SenatorsClient instance
 * @returns Effect that resolves to the updated array of civics questions
 */
export const constructQuestions = (
  fs: FileSystem.FileSystem,
  cq: CivicsQuestionsClient,
  sc: SenatorsClient,
  rc: RepresentativesClient,
  c: CivicsConfig
) =>
  Effect.fn(function* () {
    yield* Effect.log('Constructing questions...')

    // map of questions by question text
    const questionMap = Object.fromEntries(
      (yield* fetchAndParseCivicsQuestions(fs, cq, c)()).map((q) => [q.question, q])
    )

    // get updated senators question
    const senatorsQuestion = yield* getSenatorsQuestion(fs, sc, c)(questionMap)

    // get updated representatives question
    const representativesQuestion = yield* getRepresentativesQuestions(fs, rc, c)(questionMap)

    // update the senators question in the map
    const questions = Object.values({
      ...questionMap,
      [STATE_SENATORS_QUESTION]: senatorsQuestion,
      [STATE_REPRESENTATIVES_QUESTION]: representativesQuestion
    })

    yield* Effect.log(`Writing updated questions to file`)
    yield* fs.writeFileString(c.QUESTIONS_JSON_FILE, JSON.stringify(questions, null, 2))
    yield* Effect.log(`Completed constructing questions`)
    return questions
  })

/**
 * The QuestionsManager class provides a service for managing civics questions.
 * It provides methods for fetching, parsing, and writing civics questions,
 * as well as fetching and parsing senators.
 */
export class QuestionsManager extends Effect.Service<QuestionsManager>()('QuestionsManager', {
  effect: Effect.gen(function* () {
    const cq = yield* CivicsQuestionsClient
    const senatorsClient = yield* SenatorsClient
    const representativesClient = yield* RepresentativesClient
    const fs = yield* FileSystem.FileSystem
    const config = yield* CivicsConfig

    return {
      fetchCivicsQuestions: fetchCivicsQuestions(fs, cq, config),
      parseCivicsQuestions: fetchAndParseCivicsQuestions(fs, cq, config),
      fetchSenators: fetchSenators(fs, senatorsClient, config),
      parseSenators: fetchAndParseSenators(fs, senatorsClient, config),
      fetchRepresentatives: fetchRepresentatives(fs, representativesClient, config),
      parseRepresentatives: fetchAndParseRepresentatives(fs, representativesClient, config),
      constructQuestions: constructQuestions(fs, cq, senatorsClient, representativesClient, config)
    }
  }),
  dependencies: [
    CivicsQuestionsClient.Default,
    SenatorsClient.Default,
    RepresentativesClient.Default
  ]
}) {}
