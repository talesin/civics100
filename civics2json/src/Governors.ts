import { Effect, Layer, Stream } from 'effect'
import { HttpClient } from '@effect/platform'
import { CivicsConfig } from './config'
import { HttpClientError } from '@effect/platform/HttpClientError'
import { parseHTML } from 'linkedom'
import {
  isStateAbbreviation,
  StateAbbreviation,
  StateGovernmentLink,
  StateGovernmentLinks,
  StateGovernmentPage
} from './types'
import { UnknownException } from 'effect/Cause'

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
 * Attempts to extract the governor's name from a state's page HTML.
 * This is a best-effort and may need to be customized per state.
 */
export const parseGovernorName = (html: string): string | undefined => {
  const { document } = parseHTML(html)
  // Try some common selectors/heuristics
  const selectors = [
    'h1:contains("Governor")',
    'h2:contains("Governor")',
    'a[title*="Governor"]',
    'p:contains("Governor")',
    'title',
    'meta[name="description"]'
  ]
  // Try to find the governor's name in the page content
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    if (el != null && el.textContent != null) {
      // Try to extract a name from the text
      const match = el.textContent.match(/Governor\s+([A-Z][a-zA-Z\-'. ]+)/)
      if (match != null && match[1] != null) {
        return match[1].trim()
      }
    }
  }
  // Fallback: look for the first occurrence of 'Governor <Name>'
  const match = html.match(/Governor\s+([A-Z][a-zA-Z\-'. ]+)/)
  if (match != null && match[1] != null) {
    return match[1].trim()
  }
  return undefined
}

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
      parseStateLinks: (html: string) => parseStateLinks(html)
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
      parseStateLinks: fn?.parseStateLinks ?? ((_html) => Effect.succeed([]))
    })
  )
