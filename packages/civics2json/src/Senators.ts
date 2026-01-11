import { Effect, Layer, Schema } from 'effect'
import { HttpClient } from '@effect/platform'
import { CivicsConfig } from './config'
import { XMLParser } from 'fast-xml-parser'
import { ParseError } from 'effect/ParseResult'
import { UnknownException } from 'effect/Cause'
import { Senator, SenatorSchema } from './schema'
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
 * @returns Effect that resolves to the XML text content
 */
export const fetchSenators = (httpClient: HttpClient.HttpClient, config: CivicsConfig) =>
  Effect.fn(function* () {
    yield* Effect.log(`Fetching senators XML from ${config.SENATORS_URL}`)
    const response = yield* httpClient.get(config.SENATORS_URL)
    const text = yield* response.text
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
 * Senators service class, fetches, parses, and writes senators.
 * @example
 * const senators = yield* SenatorsClient.fetch()
 * const parsed = yield* SenatorsClient.parse(senators)
 */
export class SenatorsClient extends Effect.Service<SenatorsClient>()('civics2json/SenatorsClient', {
  effect: Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient
    const config = yield* CivicsConfig
    return {
      fetch: fetchSenators(httpClient, config),
      parse: parseSenators
    }
  })
}) {}

/**
 * Test SenatorsClient layer.
 *
 * @param fn Optional functions to override default behavior
 * @returns Test layer
 */
export const TestSenatorsClientLayer = (fn?: {
  fetch?: () => Effect.Effect<string, HttpClientError>
  parse?: () => Effect.Effect<readonly Senator[], ParseError | UnknownException>
}) =>
  Layer.succeed(
    SenatorsClient,
    SenatorsClient.of({
      _tag: 'civics2json/SenatorsClient',
      fetch: fn?.fetch ?? (() => Effect.succeed('')),
      parse: fn?.parse ?? (() => Effect.succeed([]))
    })
  )
