import { Effect, Layer, Stream, Schema } from 'effect'
import { HttpClient } from '@effect/platform'
import { CivicsConfig } from './config'
import { HttpClientError } from '@effect/platform/HttpClientError'
import { parseHTML } from 'linkedom'
import { isStateAbbreviation, StateAbbreviation } from './types'
import {
  Governor,
  GovernorSchema,
  StateGovernmentLink,
  StateGovernmentLinks,
  StateGovernmentPage
} from './schema'
import { UnknownException } from 'effect/Cause'
import { ParseError } from 'effect/ParseResult'

/**
 * Fetches the state governments index HTML from usa.gov
 */
export const fetchGovernmentsIndex = (httpClient: HttpClient.HttpClient, config: CivicsConfig) =>
  Effect.gen(function* () {
    yield* Effect.log(`Fetching state governments index from ${config.STATE_GOVERNMENTS_URL}`)
    const response = yield* httpClient.get(config.STATE_GOVERNMENTS_URL)
    const html = yield* response.text
    return html
  })

/**
 * Parses the index HTML to extract state links.
 * Returns an array of { state, url }.
 */
export const parseStateLinks = (
  html: string
): Effect.Effect<StateGovernmentLinks, UnknownException> =>
  Effect.gen(function* () {
    const document = yield* Effect.try(() => parseHTML(html).document)
    const nodes = Array.from(document.querySelectorAll('ul#statelist li a'))
    const links = nodes
      .map((a) => ({ state: a.getAttribute('id')?.trim(), url: a.getAttribute('href')?.trim() }))
      .filter(
        (link): link is StateGovernmentLink =>
          link.state !== undefined && link.url !== undefined && isStateAbbreviation(link.state)
      )
      .sort((a, b) => a.state.localeCompare(b.state))
    yield* Effect.log(`Parsed ${links.length} state links`)
    return links
  })

/**
 * Fetches the state government page for a given state.
 */
export const fetchGovernmentPage = (
  httpClient: HttpClient.HttpClient,
  config: CivicsConfig
): ((
  path: string,
  state: StateAbbreviation
) => Effect.Effect<StateGovernmentPage, HttpClientError | UnknownException>) =>
  Effect.fn(function* (path: string, state: StateAbbreviation) {
    const url = yield* Effect.try(() => new URL(path, config.STATE_GOVERNMENTS_URL).toString())
    yield* Effect.log(`Fetching government page for ${state} from ${url}`)
    const response = yield* httpClient.get(url)
    const html = yield* response.text
    return { state, url, html }
  })

export const fetchAllGovernmentPages =
  (httpClient: HttpClient.HttpClient, config: CivicsConfig) =>
  (
    stateLinks: StateGovernmentLinks
  ): Stream.Stream<StateGovernmentPage, HttpClientError | UnknownException> =>
    Stream.mapEffect(Stream.fromIterable(stateLinks), (link) =>
      fetchGovernmentPage(httpClient, config)(link.url, link.state)
    )

/**
 * Parses the #State-Directory-Table for governor info: name, URLs, phone, address, and website.
 * Returns a Governor object or undefined if not found/invalid.
 */
export const parseGovernorInfo = (
  html: string,
  state: StateAbbreviation
): Effect.Effect<Governor, ParseError | UnknownException> =>
  Effect.gen(function* () {
    const document = yield* Effect.try(() => parseHTML(html).document)
    const table = document.querySelector('#State-Directory-Table')

    // State government website
    const websiteAnchor = table?.querySelector('span.field--name-field-website a')
    const stateGovernmentWebsite = websiteAnchor?.getAttribute('href')?.trim()

    // Governor name and URL
    const govAnchor = table?.querySelector('span.field--name-field-governor a')
    const name = govAnchor?.textContent?.replace(/\s*(Contact|Governor|Mayor)\s*/g, '').trim()
    const governorUrl = govAnchor?.getAttribute('href')?.trim()

    // Contact URL
    const contactAnchor = table?.querySelector('span.field--name-field-governor-contact a')
    const contactUrl = contactAnchor?.getAttribute('href')?.trim()

    // Phone
    const phoneElem = table?.querySelector('p.phoneNumberField')
    const phone = phoneElem?.textContent?.trim()

    // Address
    const street = table?.querySelector('span.field--name-field-street-1')?.textContent?.trim()
    const city = table?.querySelector('span.field--name-field-city')?.textContent?.trim()
    const stateAbbr = table?.querySelector('span.field--name-field-state-abbr')?.textContent?.trim()
    const zip = table?.querySelector('span.field--name-field-zip')?.textContent?.trim()
    const address = { street, city, state: stateAbbr, zip }

    const json = {
      state,
      name:
        name !== undefined && state === 'DC'
          ? `D.C. does not have a Governor, but the Mayor is ${name}`
          : name,
      governorUrl,
      contactUrl,
      phone,
      address,
      stateGovernmentWebsite
    }

    const governor: Governor = yield* Schema.decodeUnknown(GovernorSchema)(json)
    return governor
  })

/**
 * GovernorsClient service for dependency injection.
 */
export class GovernorsClient extends Effect.Service<GovernorsClient>()('GovernorsClient', {
  effect: Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient
    const config = yield* CivicsConfig
    return {
      fetchGovernmentsIndex: () => fetchGovernmentsIndex(httpClient, config),
      fetchGovernmentPage: (url: string, state: StateAbbreviation) =>
        fetchGovernmentPage(httpClient, config)(url, state),
      fetchAllGovernmentPages: fetchAllGovernmentPages(httpClient, config),
      parseStateLinks: (html: string) => parseStateLinks(html),
      parseGovernorInfo: parseGovernorInfo
    }
  })
}) {}

/**
 * TestGovernorsClientLayer allows dependency injection of mock/test implementations for unit testing.
 * @param fn Optional overrides for service methods.
 * @returns A Layer providing a test GovernorsClient.
 */
export const TestGovernorsClientLayer = (fn?: {
  fetchGovernmentsIndex?: () => Effect.Effect<string, HttpClientError>
  fetchGovernmentPage?: (
    url: string,
    state: StateAbbreviation
  ) => Effect.Effect<StateGovernmentPage, HttpClientError>
  fetchAllGovernmentPages?: (
    stateLinks: ReadonlyArray<StateGovernmentLink>
  ) => Stream.Stream<
    { state: StateAbbreviation; url: string; html: string },
    HttpClientError | UnknownException
  >
  parseStateLinks?: (
    html: string
  ) => Effect.Effect<ReadonlyArray<StateGovernmentLink>, UnknownException>
  parseGovernorInfo?: (
    html: string,
    state: StateAbbreviation
  ) => Effect.Effect<Governor, ParseError | UnknownException>
}) =>
  Layer.succeed(
    GovernorsClient,
    GovernorsClient.of({
      _tag: 'GovernorsClient',
      fetchGovernmentsIndex: fn?.fetchGovernmentsIndex ?? (() => Effect.succeed('<html></html>')),
      fetchGovernmentPage:
        fn?.fetchGovernmentPage ??
        ((_url, _state) => Effect.succeed({ state: _state, url: _url, html: '<html></html>' })),
      fetchAllGovernmentPages:
        fn?.fetchAllGovernmentPages ??
        ((_stateLinks) =>
          Stream.fromIterable<{ state: StateAbbreviation; url: string; html: string }>([])),
      parseStateLinks: fn?.parseStateLinks ?? ((_html) => Effect.succeed([])),
      parseGovernorInfo:
        fn?.parseGovernorInfo ?? ((_html, _state) => Effect.succeed({} as Governor))
    })
  )
