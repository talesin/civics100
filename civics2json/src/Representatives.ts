import { Effect, Layer, Schema } from 'effect'
import { HttpClient } from '@effect/platform'
import {
  Representative,
  RepresentativeSchema,
  StateAbbreviation,
  StateName,
  StatesByAbbreviation,
  StatesByName
} from './types'
import config from './config'
import { parseHTML } from 'linkedom'
import { UnknownException } from 'effect/Cause'
import { ParseError } from 'effect/ParseResult'
import { HttpClientError } from '@effect/platform/HttpClientError'

/**
 * Fetches the full US representatives HTML or data file from the House website.
 *
 * This effect:
 * - Returns the text content
 *
 * @param httpClient Effect HttpClient
 * @param url Source URL
 * @returns Effect that resolves to the text content
 */
export const fetchRepresentatives = (httpClient: HttpClient.HttpClient, url: string) =>
  Effect.fn(function* () {
    yield* Effect.log(`Fetching representatives HTML from ${url}`)
    const response = yield* httpClient.get(url)
    const text = yield* response.text
    yield* Effect.log(`Fetched ${text.length} bytes for representatives HTML`)
    return text
  })

/**
 * Parses the representatives data.
 * @returns Effect that resolves to an array of Representative objects
 */
export const parseRepresentatives = (
  html: string
): Effect.Effect<readonly Representative[], UnknownException | ParseError> => {
  const getCellText = (td: HTMLTableCellElement | undefined) =>
    td?.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  const parseRow = (stateAbbr: StateAbbreviation) =>
    Effect.fn(function* (row: Element) {
      const tds = row.querySelectorAll('td')
      const json = {
        name: getCellText(tds[1]),
        website: tds[1]?.querySelector('a')?.getAttribute('href') ?? '',
        party: getCellText(tds[2]),
        officeRoom: getCellText(tds[3]),
        phone: getCellText(tds[4]),
        committeeAssignment: getCellText(tds[5]),
        district: getCellText(tds[0]),
        state: stateAbbr
      }

      return yield* Schema.decodeUnknown(RepresentativeSchema)(json)
    })

  const parseTable = Effect.fn(function* (table: Element) {
    // Caption id is like "state-california"; state name is innerText
    const stateName = table.querySelector('caption')?.textContent?.trim()
    if (stateName === undefined) return []

    const state =
      stateName === 'Virgin Islands' // Representatives site states 'Virgin Islands' not 'U.S. Virgin Islands'
        ? StatesByAbbreviation['VI']
        : StatesByName[stateName as StateName]

    if (state === undefined) {
      yield* Effect.logWarning(`Ignoring table with invalid state name: ${stateName}`)
      return []
    }

    const effects = table
      .querySelectorAll('tbody > tr')
      .values()
      .toArray()
      .map(parseRow(state.abbreviation))
    return yield* Effect.all(effects)
  })

  return Effect.gen(function* () {
    yield* Effect.log(`Parsing representatives HTML`)
    const doc = yield* Effect.try(() => parseHTML(html).document)
    // Each state has a <table> with a <caption> (state name) and <tbody> of <tr> rows
    const effects = doc.querySelectorAll('table.table').values().toArray().map(parseTable)
    const representatives = yield* Effect.all(effects).pipe(Effect.map((xs) => xs.flat()))
    yield* Effect.log(`Parsed ${representatives.length} representatives`)
    return representatives
  }).pipe(Effect.tapError((e) => Effect.logError(e)))
}

/**
 * Represents a service for fetching, parsing, and writing representatives.
 */
export class RepresentativesClient extends Effect.Service<RepresentativesClient>()(
  'RepresentativesClient',
  {
    effect: Effect.gen(function* () {
      const httpClient = yield* HttpClient.HttpClient
      const c = yield* config
      return {
        fetch: fetchRepresentatives(httpClient, c.REPRESENTATIVES_URL),
        parse: parseRepresentatives
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
  fetch?: () => Effect.Effect<string, HttpClientError>
  parse?: () => Effect.Effect<readonly Representative[], UnknownException | ParseError>
}) =>
  Layer.succeed(
    RepresentativesClient,
    RepresentativesClient.of({
      _tag: 'RepresentativesClient',
      fetch: fn?.fetch ?? (() => Effect.succeed('')),
      parse: fn?.parse ?? (() => Effect.succeed([]))
    })
  )
