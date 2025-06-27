import { Chunk, Effect, Schema, Stream } from 'effect'
import { CivicsQuestionsClient } from './CivicsQuestions'
import { SenatorsClient } from './Senators'
import { PlatformError } from '@effect/platform/Error'
import { HttpClientError } from '@effect/platform/HttpClientError'
import {
  Question,
  Representative,
  RepresentativeSchema,
  Senator,
  StateGovernmentLinks,
  StateGovernmentLinkSchema,
  StateGovernmentPage,
  StatesByAbbreviation
} from './types'
import { ParseError } from 'effect/ParseResult'
import { UnknownException } from 'effect/Cause'
import { RepresentativesClient } from './Representatives'
import { FileSystem } from '@effect/platform'
import { CivicsConfig } from './config'
import { Updates } from './Updates'
import { GovernorsClient } from './Governors'

/**
 * The variable questions that are used to identify the senator, representative, and governor questions in the civics questions set.
 */
export const VARIABLE_QUESTIONS = {
  STATE_SENATORS: "Who is one of your state's U.S. Senators now?*",
  STATE_REPRESENTATIVES: 'Name your U.S. Representative.',
  STATE_GOVERNORS: 'Who is the Governor of your state now?',
  STATE_CAPITALS: 'What is the capital of your state?*'
} as const

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
    // TODO check if senators JSON file exists for early return
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
): ((questionMap: Record<string, Question>) => Effect.Effect<Question, Error>) =>
  Effect.fn(function* (questionMap: Record<string, Question>) {
    const senatorsQuestion = questionMap[VARIABLE_QUESTIONS.STATE_SENATORS]

    // fail if we cannot find the senators question
    if (senatorsQuestion === undefined) {
      return yield* Effect.fail(new Error('State senators question not found'))
    }
    const senators = (yield* fetchAndParseSenators(fs, sc, c)()).map((s) => ({
      senator: `${s.first_name} ${s.last_name} (${s.state}-${s.party})`,
      state: s.state
    }))

    // update the senators question
    return {
      ...senatorsQuestion,
      answers: { _type: 'senator', choices: senators }
    }
  })

export const getRepresentativesQuestions = (
  fs: FileSystem.FileSystem,
  rc: RepresentativesClient,
  c: CivicsConfig
): ((questionMap: Record<string, Question>) => Effect.Effect<Question, Error>) =>
  Effect.fn(function* (questionMap: Record<string, Question>) {
    const representativesQuestion = questionMap[VARIABLE_QUESTIONS.STATE_REPRESENTATIVES]

    // fail if we cannot find the representatives question
    if (representativesQuestion === undefined) {
      return yield* Effect.fail(new Error('State representatives question not found'))
    }
    const representatives = (yield* fetchAndParseRepresentatives(fs, rc, c)()).map((r) => ({
      representative: `${r.name} (${r.state}-${r.party})`,
      state: r.state
    }))

    // update the representatives question
    return {
      ...representativesQuestion,
      answers: { _type: 'representative', choices: representatives }
    }
  })

/**
 * Fetches the state governments index HTML using the GovernorsClient.
 * Checks for a local file and uses it unless force is specified.
 * @param fs FileSystem
 * @param gc GovernorsClient
 * @param c CivicsConfig
 * @returns Effect that resolves to the HTML string
 */
export const fetchGovernmentsIndex = (
  fs: FileSystem.FileSystem,
  gc: GovernorsClient,
  c: CivicsConfig
) =>
  Effect.fn(function* (options?: { forceFetch?: boolean }) {
    const exists = yield* fs.exists(c.STATE_GOVERNMENTS_HTML_FILE)
    if (options?.forceFetch !== true && exists) {
      yield* Effect.log(`Using local governments file ${c.STATE_GOVERNMENTS_HTML_FILE}`)
      return yield* fs.readFileString(c.STATE_GOVERNMENTS_HTML_FILE)
    }
    const html = yield* gc.fetchGovernmentsIndex()
    yield* Effect.log(`Saving fetched content to ${c.STATE_GOVERNMENTS_HTML_FILE}`)
    yield* fs.writeFileString(c.STATE_GOVERNMENTS_HTML_FILE, html)
    return html
  })

/**
 * Parses the state governments index HTML to extract state links.
 * Returns an array of { state, url }.
 */
export const parseStateLinks = (fs: FileSystem.FileSystem, gc: GovernorsClient, c: CivicsConfig) =>
  Effect.fn(function* (options?: { forceFetch?: boolean }) {
    const exists = yield* fs.exists(c.STATE_GOVERNMENTS_JSON_FILE)
    if (options?.forceFetch !== true && exists) {
      yield* Effect.log(`Using local governments JSON file ${c.STATE_GOVERNMENTS_JSON_FILE}`)
      const data = yield* fs.readFileString(c.STATE_GOVERNMENTS_JSON_FILE)
      const json = yield* Schema.decodeUnknown(Schema.parseJson())(data)
      const links: StateGovernmentLinks = yield* Schema.decodeUnknown(
        Schema.Array(StateGovernmentLinkSchema)
      )(json)
      return links
    }
    const html = yield* fetchGovernmentsIndex(fs, gc, c)(options)
    const links: StateGovernmentLinks = yield* gc.parseStateLinks(html)
    yield* fs.writeFileString(c.STATE_GOVERNMENTS_JSON_FILE, JSON.stringify(links, null, 2))
    yield* Effect.log(`Wrote ${links.length} state links to ${c.STATE_GOVERNMENTS_JSON_FILE}`)
    return links
  })

export const fetchGovernmentsPages = (
  fs: FileSystem.FileSystem,
  gc: GovernorsClient,
  c: CivicsConfig
) =>
  Effect.fn(function* (options?: { forceFetch?: boolean }) {
    const links = yield* parseStateLinks(fs, gc, c)(options)

    if (options?.forceFetch !== true) {
      const allPagesExist = yield* Effect.all(
        links
          .map((link) => link.file)
          .filter((file) => file !== undefined)
          .map((file) => fs.exists(file).pipe(Effect.map((exists) => ({ file, exists }))))
      )

      if (allPagesExist.every((p) => p.exists)) {
        yield* Effect.log(
          `Using ${links.length} local governments pages in ${c.STATE_GOVERNMENTS_DATA_DIR}`
        )
        return links
      }
    }

    yield* Effect.log(`Fetching ${links.length} government pages`)
    const pages = gc.fetchAllGovernmentPages(links)

    const dataDirExists = yield* fs.exists(c.STATE_GOVERNMENTS_DATA_DIR)
    if (!dataDirExists) {
      yield* fs.makeDirectory(c.STATE_GOVERNMENTS_DATA_DIR)
    }

    const writtenFiles: StateGovernmentLinks = yield* pages.pipe(
      Stream.mapEffect((page) =>
        Effect.gen(function* () {
          const file = `${c.STATE_GOVERNMENTS_DATA_DIR}/${page.state}.html`
          yield* Effect.log(
            `Writing ${StatesByAbbreviation[page.state].name} government page to '${file}'`
          )
          yield* fs.writeFileString(file, page.html)
          return { state: page.state, url: page.url, file }
        })
      ),
      Stream.runCollect,
      Effect.map(Chunk.toReadonlyArray)
    )

    yield* Effect.log(
      `Wrote ${links.length} state government pages to ${c.STATE_GOVERNMENTS_DATA_DIR}`
    )

    yield* fs.writeFileString(c.STATE_GOVERNMENTS_JSON_FILE, JSON.stringify(writtenFiles, null, 2))
    yield* Effect.log(
      `Wrote index of ${writtenFiles.length} state government pages to ${c.STATE_GOVERNMENTS_JSON_FILE}`
    )
    return writtenFiles
  })

export const fetchAndParseGovernors = (
  fs: FileSystem.FileSystem,
  gc: GovernorsClient,
  c: CivicsConfig
) =>
  Effect.fn(function* (options?: { forceFetch?: boolean }) {
    const pages = yield* fetchGovernmentsPages(fs, gc, c)(options)
    const governors = yield* Effect.all(
      pages
        .filter((page): page is StateGovernmentPage & { file: string } => page.file !== undefined)
        .map((page) =>
          fs
            .readFileString(page.file)
            .pipe(Effect.flatMap((html) => gc.parseGovernorInfo(html, page.state)))
        )
    ).pipe(Effect.map((governors) => governors.sort((a, b) => a.state.localeCompare(b.state))))

    yield* Effect.log(`Parsed ${governors.length} governors from ${pages.length} pages`)
    yield* fs.writeFileString(c.GOVERNORS_JSON_FILE, JSON.stringify(governors, null, 2))
    yield* Effect.log(`Wrote ${governors.length} governors to ${c.GOVERNORS_JSON_FILE}`)
    return governors
  })

export const getGovernorsQuestions = (
  fs: FileSystem.FileSystem,
  gc: GovernorsClient,
  c: CivicsConfig
): ((questionMap: Record<string, Question>) => Effect.Effect<Question, Error>) =>
  Effect.fn(function* (questionMap: Record<string, Question>) {
    const governorsQuestion = questionMap[VARIABLE_QUESTIONS.STATE_GOVERNORS]

    // fail if we cannot find the governors question
    if (governorsQuestion === undefined) {
      return yield* Effect.fail(new Error('State governors question not found'))
    }
    const governors = (yield* fetchAndParseGovernors(fs, gc, c)()).map((g) => ({
      governor: g.name,
      state: g.state
    }))

    // update the governors question
    return {
      ...governorsQuestion,
      answers: { _type: 'governor', choices: governors }
    }
  })

export const getStateCapitalsQuestions: (
  questionMap: Record<string, Question>
) => Effect.Effect<Question, Error> = Effect.fn(function* (questionMap: Record<string, Question>) {
  const capitalsQuestion = questionMap[VARIABLE_QUESTIONS.STATE_CAPITALS]

  // fail if we cannot find the governors question
  if (capitalsQuestion === undefined) {
    return yield* Effect.fail(new Error('State capitals question not found'))
  }
  const capitals = Object.values(StatesByAbbreviation).map((state) => ({
    capital: state.capital,
    state: state.abbreviation
  }))

  // update the governors question
  return {
    ...capitalsQuestion,
    answers: { _type: 'capital', choices: capitals }
  }
})

// Fetch updates HTML, using local file unless forceFetch is true
export const fetchUpdates = (
  fs: FileSystem.FileSystem,
  config: CivicsConfig,
  updatesClient: Updates
) =>
  Effect.fn(function* (options?: { forceFetch?: boolean }) {
    const exists = yield* fs.exists(config.UPDATES_HTML_FILE)
    if (options?.forceFetch !== true && exists) {
      yield* Effect.log(`Using local updates HTML file ${config.UPDATES_HTML_FILE}`)
      return yield* fs.readFileString(config.UPDATES_HTML_FILE)
    }
    const html = yield* updatesClient.fetchUpdates()
    yield* Effect.log(`Saving fetched updates HTML to ${config.UPDATES_HTML_FILE}`)
    yield* fs.writeFileString(config.UPDATES_HTML_FILE, html)
    return html
  })

// Parse updates HTML and write parsed questions to JSON file
export const fetchAndParseUpdates = (
  fs: FileSystem.FileSystem,
  config: CivicsConfig,
  updatesClient: Updates
) =>
  Effect.fn(function* (options?: { forceFetch?: boolean }) {
    const html = yield* fetchUpdates(fs, config, updatesClient)(options)
    const updates = yield* updatesClient.parseUpdates(html)

    yield* Effect.log(
      `Writing ${updates.length} updated questions JSON to ${config.UPDATES_JSON_FILE}`
    )
    yield* fs.writeFileString(config.UPDATES_JSON_FILE, JSON.stringify(updates, null, 2))

    return updates
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
  gc: GovernorsClient,
  uc: Updates,
  c: CivicsConfig
) =>
  Effect.fn(function* () {
    yield* Effect.log('Constructing questions...')

    // map of questions by question text
    const questionMap = Object.fromEntries(
      (yield* fetchAndParseCivicsQuestions(fs, cq, c)()).map((q) => [q.question, q])
    )

    // update the senators question in the map
    const questions = Object.values({
      ...questionMap,
      [VARIABLE_QUESTIONS.STATE_SENATORS]: yield* getSenatorsQuestion(fs, sc, c)(questionMap),
      [VARIABLE_QUESTIONS.STATE_REPRESENTATIVES]: yield* getRepresentativesQuestions(
        fs,
        rc,
        c
      )(questionMap),
      [VARIABLE_QUESTIONS.STATE_GOVERNORS]: yield* getGovernorsQuestions(fs, gc, c)(questionMap),
      [VARIABLE_QUESTIONS.STATE_CAPITALS]: yield* getStateCapitalsQuestions(questionMap)
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
    const fs = yield* FileSystem.FileSystem
    const config = yield* CivicsConfig
    const civicQuestionsClient = yield* CivicsQuestionsClient
    const senatorsClient = yield* SenatorsClient
    const representativesClient = yield* RepresentativesClient
    const governorsClient = yield* GovernorsClient
    const updatesClient = yield* Updates

    return {
      fetchCivicsQuestions: fetchCivicsQuestions(fs, civicQuestionsClient, config),
      parseCivicsQuestions: fetchAndParseCivicsQuestions(fs, civicQuestionsClient, config),
      fetchSenators: fetchSenators(fs, senatorsClient, config),
      parseSenators: fetchAndParseSenators(fs, senatorsClient, config),
      fetchRepresentatives: fetchRepresentatives(fs, representativesClient, config),
      parseRepresentatives: fetchAndParseRepresentatives(fs, representativesClient, config),
      constructQuestions: constructQuestions(
        fs,
        civicQuestionsClient,
        senatorsClient,
        representativesClient,
        governorsClient,
        updatesClient,
        config
      ),
      fetchGovernmentsIndex: fetchGovernmentsIndex(fs, governorsClient, config),
      parseStateLinks: parseStateLinks(fs, governorsClient, config),
      fetchAndParseGovernors: fetchAndParseGovernors(fs, governorsClient, config),
      fetchUpdates: fetchUpdates(fs, config, updatesClient),
      fetchAndParseUpdates: fetchAndParseUpdates(fs, config, updatesClient)
    }
  }),
  dependencies: [
    CivicsQuestionsClient.Default,
    SenatorsClient.Default,
    RepresentativesClient.Default,
    GovernorsClient.Default,
    Updates.Default
  ]
}) {}
