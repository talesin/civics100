import { Effect, Layer, Schema } from 'effect'
import { HttpClient, FileSystem } from '@effect/platform'
import config from './config'
import { XMLParser } from 'fast-xml-parser'
import { ParseError } from 'effect/ParseResult'
import { UnknownException } from 'effect/Cause'
import { Senator, SenatorSchema } from './types'
import { PlatformError } from '@effect/platform/Error'
import { HttpClientError } from '@effect/platform/HttpClientError'

/**
 * Fetches the full US senators XML file from the Senate website.
 *
 * This effect:
 * - Checks for a local XML file
 * - If not present, fetches from the remote URL and saves locally
 * - Returns the XML text content
 *
 * @param httpClient Effect HttpClient
 * @param fs Effect FileSystem
 * @returns Effect that resolves to the XML text content
 */
export const fetchSenators = (
  httpClient: HttpClient.HttpClient,
  fs: FileSystem.FileSystem,
  url: string,
  localFile: string
) =>
  Effect.fn(function* () {
    const exists = yield* fs.exists(localFile)
    if (exists) {
      yield* Effect.log(`Using local file ${localFile}`)
      return yield* fs.readFileString(localFile)
    }
    yield* Effect.log(`Fetching senators XML from ${url}`)
    const response = yield* httpClient.get(url)
    const text = yield* response.text
    yield* Effect.log(`Saving fetched content to ${localFile}`)
    yield* fs.writeFileString(localFile, text)
    return text
  })

const ContactInformationSchema = Schema.Struct({
  contact_information: Schema.Struct({
    member: Schema.Union(Schema.Array(SenatorSchema), SenatorSchema)
  })
})

/**
 * Parses the senators.xml file and returns an array of senator objects.
 * Each object contains: last_name, first_name, party, state, address, phone, email, website, class, bioguide_id
 */
export const parseSenators = (
  xml: string
): Effect.Effect<readonly Senator[], ParseError | UnknownException> =>
  Effect.gen(function* () {
    yield* Effect.log(`Parsing senators XML`)
    const json = yield* Effect.try(() => new XMLParser().parse(xml) as unknown)
    const parsed = yield* Schema.decodeUnknown(ContactInformationSchema)(json)
    // if there is one xml element XMLParser will return an object instead of an array - we always return an array
    const senators = new Array(parsed.contact_information.member).flat()
    yield* Effect.log(`Parsed ${senators.length} senators`)
    return senators
  })

/**
 * Writes the senators array to a JSON file.
 *
 * @param fs Effect FileSystem
 * @param localFile Local file path
 * @returns Effect that resolves when writing is complete
 */
export const writeSenatorsJson = (fs: FileSystem.FileSystem, localFile: string) =>
  Effect.fn(function* (senators: readonly Senator[]) {
    yield* Effect.log(`Writing senators JSON to ${localFile}`)
    yield* fs.writeFileString(localFile, JSON.stringify(senators, null, 2))
  })

/**
 * Senators service class, similar to CivicsQuestionsClient.
 * Usage: yield* SenatorsClient.fetch()
 */
export class SenatorsClient extends Effect.Service<SenatorsClient>()('SenatorsClient', {
  effect: Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient
    const fs = yield* FileSystem.FileSystem
    const c = yield* config
    return {
      fetch: fetchSenators(httpClient, fs, c.SENATORS_URL, c.SENATORS_XML_FILE),
      parse: parseSenators,
      write: writeSenatorsJson(fs, c.SENATORS_JSON_FILE)
    }
  })
}) {}

export const TestSenatorsClientLayer = (fn?: {
  fetch?: () => Effect.Effect<string, PlatformError | HttpClientError>
  parse?: () => Effect.Effect<readonly Senator[], ParseError | UnknownException>
  write?: () => Effect.Effect<void, PlatformError>
}) =>
  Layer.succeed(
    SenatorsClient,
    SenatorsClient.of({
      _tag: 'SenatorsClient',
      fetch: fn?.fetch ?? (() => Effect.succeed('')),
      parse: fn?.parse ?? (() => Effect.succeed([])),
      write: fn?.write ?? (() => Effect.succeed(undefined))
    })
  )
