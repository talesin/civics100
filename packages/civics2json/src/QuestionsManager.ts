import { Chunk, Data, Effect, Schema, Stream } from 'effect'
import { CivicsQuestionsClient } from './CivicsQuestions'
import { SenatorsClient } from './Senators'
import { PlatformError } from '@effect/platform/Error'
import { HttpClientError } from '@effect/platform/HttpClientError'
import { Question, StatesByAbbreviation } from './types'
import {
  GovernorSchema,
  Representative,
  RepresentativeSchema,
  Senator,
  StateGovernmentLinks,
  StateGovernmentLinkSchema,
  StateGovernmentPage
} from './schema'
import { ParseError } from 'effect/ParseResult'
import { UnknownException } from 'effect/Cause'
import { RepresentativesClient } from './Representatives'
import { FileSystem } from '@effect/platform'
import { CivicsConfig } from './config'
import { Updates } from './Updates'
import { GovernorsClient } from './Governors'
import { ParseHTMLError } from './utils'

/**
 * The variable questions that are used to identify the senator, representative, and governor questions in the civics questions set.
 */
export const VARIABLE_QUESTIONS = {
  STATE_SENATORS: "Who is one of your state’s U.S. senators now?",
  STATE_REPRESENTATIVES: "Name your U.S. representative.",
  STATE_GOVERNORS: "Who is the governor of your state now? *",
  STATE_CAPITALS: "What is the capital of your state?",
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
): (() => Effect.Effect<string, HttpClientError | PlatformError | Error>) =>
  Effect.fn(function* () {
    const exists = yield* fs.exists(config.QUESTIONS_TEXT_FILE)
    if (exists) {
      yield* Effect.log(`Using local file ${config.QUESTIONS_TEXT_FILE}`)
      return yield* fs.readFileString(config.QUESTIONS_TEXT_FILE)
    }
    const text = yield* cq.fetch
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
): (() => Effect.Effect<readonly Question[], HttpClientError | PlatformError | Error>) =>
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
      senator: `${s.first_name} ${s.last_name}`,
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
      representative: `${r.name}`,
      state: r.state,
      district: r.district
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
    // Check if we should use existing data (unless force fetch is requested)
    if (options?.forceFetch !== true) {
      const governorsFileExists = yield* fs.exists(c.GOVERNORS_JSON_FILE)

      if (governorsFileExists) {
        const governorsData = yield* fs.readFileString(c.GOVERNORS_JSON_FILE)
        const parsedData = yield* Schema.decodeUnknown(Schema.parseJson())(governorsData)
        const governors = yield* Schema.decodeUnknown(Schema.Array(GovernorSchema))(parsedData)

        // If we have valid governor data (non-empty array), use it
        if (governors.length > 0) {
          yield* Effect.log(`Using existing governors data from ${c.GOVERNORS_JSON_FILE}`)
          return governors
        } else {
          yield* Effect.log('Existing governors file is empty, proceeding with fresh fetch')
        }
      }
    }

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

    // Check if governors.json exists and has data
    const governorsFileExists = yield* fs.exists(c.GOVERNORS_JSON_FILE)
    let shouldForceFetch = false

    if (governorsFileExists) {
      // Check if the file contains actual governor data (not just an empty array)
      const governorsData = yield* fs.readFileString(c.GOVERNORS_JSON_FILE)
      const parsedData = yield* Schema.decodeUnknown(Schema.parseJson())(governorsData)
      const governors = yield* Schema.decodeUnknown(Schema.Array(GovernorSchema))(parsedData)

      if (governors.length === 0) {
        yield* Effect.log('Governors file is empty, forcing data refresh')
        shouldForceFetch = true
      }
    } else {
      yield* Effect.log('Governors file does not exist, forcing data fetch')
      shouldForceFetch = true
    }

    const governors = (yield* fetchAndParseGovernors(
      fs,
      gc,
      c
    )({ forceFetch: shouldForceFetch })).map((g) => ({
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

export class UpdatedQuestionNotFoundError extends Data.TaggedError('UpdatedQuestionNotFoundError')<{
  readonly question: string
}> {}

/**
 * Normalizes question text for comparison by handling asterisk formatting variations.
 * Removes spaces before asterisks, trailing asterisks, normalizes apostrophes, and converts to lowercase.
 * This allows matching questions regardless of whether they have " *", "*", or no asterisk,
 * regardless of capitalization differences, and regardless of apostrophe style (straight ' vs curly ').
 */
const normalizeQuestionText = (text: string): string => {
  return text
    .replace(/\s*\*\s*$/g, '') // Remove trailing asterisk with optional spaces
    .replace(/[\u2018\u2019]/g, "'") // Normalize curly apostrophes (U+2018, U+2019) to straight apostrophes
    .trim()
    .toLowerCase() // Case-insensitive matching
}

export const getUpdatedQuestions = (
  fs: FileSystem.FileSystem,
  config: CivicsConfig,
  updatesClient: Updates
): ((
  questionMap: Record<string, Question>
) => Effect.Effect<
  Question[],
  UpdatedQuestionNotFoundError | PlatformError | HttpClientError | ParseHTMLError
>) =>
  Effect.fn(function* (questionMap: Record<string, Question>) {
    const updatedQuestionPartials = yield* fetchAndParseUpdates(fs, config, updatesClient)()

    // Create a normalized lookup map for flexible matching
    const normalizedMap: Record<string, Question> = {}
    Object.values(questionMap).forEach((q) => {
      normalizedMap[normalizeQuestionText(q.question)] = q
    })

    const results = yield* Effect.forEach(updatedQuestionPartials, (partial) =>
      Effect.gen(function* () {
        if (partial.question === undefined || partial.question.length === 0) {
          // This should not be reachable if parseUpdates is correct
          return yield* Effect.die(new Error('Partial question missing question text'))
        }

        // Try exact match first, then normalized match
        let originalQuestion = questionMap[partial.question]
        if (originalQuestion === undefined) {
          const normalized = normalizeQuestionText(partial.question)
          originalQuestion = normalizedMap[normalized]
          if (originalQuestion === undefined) {
            // Question from updates page doesn't exist in the 2025 questions set
            // This can happen when USCIS changes question wording between versions
            // Skip this update rather than failing
            yield* Effect.log(
              `Skipping update for question not found in 2025 set: "${partial.question}"`
            )
            return null // Return null to be filtered out
          }
        }

        if (partial.answers === undefined) {
          return yield* Effect.die(new Error(`Partial question missing answers for: ${partial.question}`))
        }

        // The partial from parseUpdates has `question`, `questionNumber`, and `answers`.
        // The `Question` type has `theme`, `section`, `question`, `questionNumber`, `answers`.
        // We need to merge them.
        const updatedQuestion: Question = {
          ...originalQuestion,
          answers: partial.answers
        }
        return updatedQuestion
      })
    )

    // Filter out null results (questions that didn't match)
    return results.filter((q): q is Question => q !== null)
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
  cqc: CivicsQuestionsClient,
  sc: SenatorsClient,
  rc: RepresentativesClient,
  gc: GovernorsClient,
  uc: Updates,
  c: CivicsConfig
) =>
  Effect.fn(function* () {
    // 1. get all questions
    const questions = yield* fetchAndParseCivicsQuestions(fs, cqc, c)()
    const questionMap = questions.reduce(
      (acc, q) => ({ ...acc, [q.question]: q }),
      {} as Record<string, Question>
    )

    // 2. get variable questions
    const updatedSenatorsQuestion = yield* getSenatorsQuestion(fs, sc, c)(questionMap)
    const updatedRepresentativesQuestion = yield* getRepresentativesQuestions(
      fs,
      rc,
      c
    )(questionMap)
    const updatedGovernorsQuestion = yield* getGovernorsQuestions(fs, gc, c)(questionMap)
    const updatedCapitalsQuestion = yield* getStateCapitalsQuestions(questionMap)
    const updatedCivicsQuestions = yield* getUpdatedQuestions(fs, c, uc)(questionMap)

    // 3. update question map
    // Filter out variable questions from civics updates to avoid overwriting
    const variableQuestionTexts = new Set([
      updatedSenatorsQuestion.question,
      updatedRepresentativesQuestion.question,
      updatedGovernorsQuestion.question,
      updatedCapitalsQuestion.question
    ])
    const filteredCivicsUpdates = updatedCivicsQuestions.filter(
      (q) => !variableQuestionTexts.has(q.question)
    )

    const updatedQuestionMap = {
      ...questionMap,
      ...filteredCivicsUpdates.reduce(
        (acc, q) => ({ ...acc, [q.question]: q }),
        {} as Record<string, Question>
      ),
      // Variable questions must come AFTER civics updates to take precedence
      [updatedSenatorsQuestion.question]: updatedSenatorsQuestion,
      [updatedRepresentativesQuestion.question]: updatedRepresentativesQuestion,
      [updatedGovernorsQuestion.question]: updatedGovernorsQuestion,
      [updatedCapitalsQuestion.question]: updatedCapitalsQuestion
    }

    // 4. write to file
    const updatedQuestions = Object.values(updatedQuestionMap)
    yield* Effect.log(`Writing updated questions to file`)
    yield* fs.writeFileString(c.QUESTIONS_JSON_FILE, JSON.stringify(updatedQuestions, null, 2))
    yield* Effect.log(`Completed constructing questions`)
    return updatedQuestions
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
