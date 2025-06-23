import { Effect, Layer } from 'effect'
import { FileSystem, HttpClient } from '@effect/platform'
import { PlatformError } from '@effect/platform/Error'
import { HttpClientError } from '@effect/platform/HttpClientError'
import { Representative, StateName, StatesByName } from './types'
import config from './config'
import { parseHTML } from 'linkedom'
import { UnknownException } from 'effect/Cause'

/**
 * Fetches the full US representatives HTML or data file from the House website.
 *
 * This effect:
 * - Checks for a local file
 * - If not present, fetches from the remote URL and saves locally
 * - Returns the text content
 *
 * @param httpClient Effect HttpClient
 * @param fs Effect FileSystem
 * @param url Source URL
 * @param localFile Local file path
 * @returns Effect that resolves to the text content
 */
export const fetchRepresentatives = (
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
    yield* Effect.log(`Fetching representatives data from ${url}`)
    const response = yield* httpClient.get(url)
    const text = yield* response.text
    yield* Effect.log(`Saving fetched content to ${localFile}`)
    yield* fs.writeFileString(localFile, text)
    return text
  })

/**
 * Stub: Parses the representatives data.
 * @returns Effect that resolves to an array of Representative objects
 */
export const parseRepresentatives = (
  data: string
): Effect.Effect<readonly Representative[], UnknownException> =>
  Effect.try(() => {
    const doc = parseHTML(data).document
    const representatives: Representative[] = []
    // Each state has a <table> with a <caption> (state name) and <tbody> of <tr> rows
    const tables = doc.querySelectorAll('table.table')
    for (const table of tables) {
      const caption = table.querySelector('caption')
      if (!caption) continue
      // Caption id is like "state-california"; state name is innerText
      const stateName = caption.textContent?.trim() ?? ''

      if (StatesByName[stateName as StateName] === undefined) continue

      // Try to map state name to abbreviation
      // We'll use a lookup from the STATES constant in types.ts
      // For now, fallback to stateName if not found
      const stateAbbr = StatesByName[stateName as StateName].abbreviation
      const rows = table.querySelectorAll('tbody > tr')
      for (const row of rows) {
        const tds = row.querySelectorAll('td')
        if (tds.length < 4) continue
        const district = tds[0]?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
        // Name and website
        const nameLink = tds[1]?.querySelector('a')
        const name = nameLink?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
        const website = nameLink?.getAttribute('href') ?? ''
        const party = tds[2]?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
        const officeRoom = tds[3]?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
        // phone and committeeAssignment can be blank for now
        const rep: Representative = {
          name,
          state: stateAbbr,
          district,
          party,
          officeRoom,
          phone: '',
          committeeAssignment: '',
          website
        }
        representatives.push(rep)
      }
    }
    return representatives
  })

/**
 * Stub: Writes the representatives data to a JSON file.
 * @returns Effect that resolves when writing is complete
 */
export const writeRepresentativesJson = (fs: FileSystem.FileSystem, localFile: string) =>
  Effect.fn(function* (representatives: readonly Representative[]) {
    // TODO: Implement actual write logic
    yield* Effect.log(`Writing representatives JSON to ${localFile}`)
    yield* fs.writeFileString(localFile, JSON.stringify(representatives, null, 2))
  })

/**
 * Representatives service class, fetches, parses, and writes representatives.
 */
export class RepresentativesClient extends Effect.Service<RepresentativesClient>()(
  'RepresentativesClient',
  {
    effect: Effect.gen(function* () {
      const httpClient = yield* HttpClient.HttpClient
      const fs = yield* FileSystem.FileSystem
      const c = yield* config
      return {
        fetch: fetchRepresentatives(
          httpClient,
          fs,
          c.REPRESENTATIVES_URL,
          c.REPRESENTATIVES_HTML_FILE
        ),
        parse: parseRepresentatives,
        write: writeRepresentativesJson(fs, c.REPRESENTATIVES_JSON_FILE)
      }
    })
  }
) {}

/**
 * Test RepresentativesClient layer.
 *
 * @param fn Optional functions to override default behavior
 * @returns Test layer
 */
export const TestRepresentativesClientLayer = (fn?: {
  fetch?: () => Effect.Effect<string, PlatformError | HttpClientError>
  parse?: () => Effect.Effect<readonly Representative[]>
  write?: () => Effect.Effect<void, PlatformError>
}) =>
  Layer.succeed(
    RepresentativesClient,
    RepresentativesClient.of({
      _tag: 'RepresentativesClient',
      fetch: fn?.fetch ?? (() => Effect.succeed('')),
      parse: fn?.parse ?? (() => Effect.succeed([])),
      write: fn?.write ?? (() => Effect.succeed(undefined))
    })
  )
