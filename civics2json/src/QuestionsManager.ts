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
import config from './config'

/**
 * The canonical question string used to identify the senator question in the civics questions set.
 */
export const STATE_SENATORS_QUESTION = "Who is one of your state's U.S. Senators now?*"

/**
 * Fetches the civics questions text using the CivicsQuestionsClient.
 * @param cq CivicsQuestionsClient instance
 * @returns Effect that resolves to the civics questions text
 */
export const fetchCivicsQuestions = (
  cq: CivicsQuestionsClient
): (() => Effect.Effect<string, PlatformError | HttpClientError>) =>
  Effect.fn(function* () {
    const text = yield* cq.fetch()
    return text
  })

/**
 * Fetches, parses, and writes civics questions using the CivicsQuestionsClient.
 * @param cq CivicsQuestionsClient instance
 * @returns Effect that resolves to an array of parsed civics questions
 */
export const fetchAndParseCivicsQuestions = (
  cq: CivicsQuestionsClient
): (() => Effect.Effect<readonly Question[], PlatformError | HttpClientError>) =>
  Effect.fn(function* () {
    const text = yield* cq.fetch()
    const questions = yield* cq.parse(text)
    yield* cq.write(questions)
    return questions
  })

/**
 * Fetches the senators XML text using the SenatorsClient.
 * @param senators SenatorsClient instance
 * @returns Effect that resolves to the senators XML text
 */
export const fetchSenators = (
  senators: SenatorsClient
): (() => Effect.Effect<string, PlatformError | HttpClientError>) =>
  Effect.fn(function* () {
    const text = yield* senators.fetch()
    return text
  })

/**
 * Fetches, parses, and writes senators using the SenatorsClient.
 * @param senators SenatorsClient instance
 * @returns Effect that resolves to an array of parsed Senator objects
 */
export const fetchAndParseSenators = (
  senators: SenatorsClient
): (() => Effect.Effect<
  readonly Senator[],
  ParseError | UnknownException | PlatformError | HttpClientError
>) =>
  Effect.fn(function* () {
    const text = yield* senators.fetch()
    const parsed = yield* senators.parse(text)
    yield* senators.write(parsed)
    return parsed
  })

export const fetchRepresentatives = (
  fs: FileSystem.FileSystem,
  representatives: RepresentativesClient,
  htmlFile: string
) =>
  Effect.fn(function* (options?: { forceFetch?: boolean }) {
    const exists = yield* fs.exists(htmlFile)
    if (options?.forceFetch !== true && exists) {
      yield* Effect.log(`Using local representatives file ${htmlFile}`)
      return yield* fs.readFileString(htmlFile)
    }
    const text = yield* representatives.fetch()
    yield* fs.writeFileString(htmlFile, text)
    return text
  })

export const parseRepresentatives = (
  fs: FileSystem.FileSystem,
  rc: RepresentativesClient,
  htmlFile: string,
  jsonFile: string
): ((options?: {
  forceFetch?: boolean
}) => Effect.Effect<
  readonly Representative[],
  ParseError | UnknownException | PlatformError | HttpClientError
>) =>
  Effect.fn(function* (options?: { forceFetch?: boolean }) {
    const exists = yield* fs.exists(jsonFile)
    if (options?.forceFetch !== true && exists) {
      yield* Effect.log(`Using local representatives JSON file ${jsonFile}`)
      const json = yield* Schema.decodeUnknown(Schema.parseJson())(
        yield* fs.readFileString(jsonFile)
      )
      return yield* Schema.decodeUnknown(Schema.Array(RepresentativeSchema))(json)
    }
    const text = yield* fetchRepresentatives(fs, rc, htmlFile)(options)
    const representatives = yield* rc.parse(text)
    yield* fs.writeFileString(jsonFile, JSON.stringify(representatives, null, 2))
    return representatives
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
export const constructQuestions = (cq: CivicsQuestionsClient, sc: SenatorsClient) =>
  Effect.fn(function* () {
    yield* Effect.log('Constructing questions...')
    const senators = (yield* fetchAndParseSenators(sc)()).map((s) => ({
      senator: `${s.first_name} ${s.last_name} (${s.state}-${s.party})`,
      state: s.state
    }))

    // map of questions by question text
    const questionMap = Object.fromEntries(
      (yield* fetchAndParseCivicsQuestions(cq)()).map((q) => [q.question, q])
    )

    // fail if we cannot find the senators question
    if (questionMap[STATE_SENATORS_QUESTION] === undefined) {
      return yield* Effect.fail(new Error('State senators question not found'))
    }

    // update the senators question
    const senatorsQuestion: Question = {
      ...questionMap[STATE_SENATORS_QUESTION],
      answers: { _type: 'senator', choices: senators }
    }

    // update the senators question in the map
    const questions = Object.values({
      ...questionMap,
      [STATE_SENATORS_QUESTION]: senatorsQuestion
    })

    yield* Effect.log(`Writing updated questions to file`)
    yield* cq.write(questions)
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
    const senators = yield* SenatorsClient
    const representatives = yield* RepresentativesClient
    const fs = yield* FileSystem.FileSystem
    const c = yield* config

    return {
      fetchCivicsQuestions: fetchCivicsQuestions(cq),
      parseCivicsQuestions: fetchAndParseCivicsQuestions(cq),
      fetchSenators: fetchSenators(senators),
      parseSenators: fetchAndParseSenators(senators),
      fetchRepresentatives: fetchRepresentatives(fs, representatives, c.REPRESENTATIVES_HTML_FILE),
      parseRepresentatives: parseRepresentatives(
        fs,
        representatives,
        c.REPRESENTATIVES_HTML_FILE,
        c.REPRESENTATIVES_JSON_FILE
      ),
      constructQuestions: constructQuestions(cq, senators)
    }
  }),
  dependencies: [CivicsQuestionsClient.Default, SenatorsClient.Default]
}) {}
