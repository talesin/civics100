import { Effect, Schema } from 'effect'
import { HttpClient, FileSystem } from '@effect/platform'
import config from './config'
import { XMLParser } from 'fast-xml-parser'
import { ParseError } from 'effect/ParseResult'
import { UnknownException } from 'effect/Cause'

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

const SenatorSchema = Schema.Struct({
  last_name: Schema.String,
  first_name: Schema.String,
  party: Schema.String,
  state: Schema.String,
  address: Schema.String,
  phone: Schema.String,
  email: Schema.String,
  website: Schema.String,
  class: Schema.String,
  bioguide_id: Schema.String,
  member_full: Schema.String
})
type Senator = typeof SenatorSchema.Type

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
    const json = yield* Effect.try(() => new XMLParser().parse(xml) as unknown)
    const senators = yield* Schema.decodeUnknown(ContactInformationSchema)(json)
    // if there is one xml element XMLParser will return an object instead of an array - we always return an array
    return new Array(senators.contact_information.member).flat()
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
      parse: parseSenators
    }
  })
}) {}
