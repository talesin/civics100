import { Effect, Layer } from 'effect'
import { HttpClient } from '@effect/platform'
import parseQuestionsFile from './parseQuestions'
import { Question } from './types'
import { HttpClientError } from '@effect/platform/HttpClientError'
import { CivicsConfig } from './config'

/**
 * Fetches the civics questions text from the USCIS website.
 *
 * This effect:
 * - Makes an HTTP GET request to the USCIS website
 * - Fails with a descriptive error if the request fails
 * - Returns the text content if successful
 *
 * @returns An Effect that resolves to the civics questions text
 */
export const fetchCivicsQuestions = (httpClient: HttpClient.HttpClient, config: CivicsConfig) =>
  Effect.fn(function* () {
    yield* Effect.log(`Fetching civics questions from ${config.QUESTIONS_URL}`)
    const response = yield* httpClient.get(config.QUESTIONS_URL)
    const text = yield* response.text

    return text
  })

/**
 * CivicsQuestionsClient service class, fetches, parses, and writes civics questions.
 * @example
 * const cq = yield* CivicsQuestionsClient
 * const questions = yield* cq.fetch()
 * const parsed = yield* cq.parse(questions)
 */
export class CivicsQuestionsClient extends Effect.Service<CivicsQuestionsClient>()(
  'CivicsQuestionsClient',
  {
    effect: Effect.gen(function* () {
      const httpClient = yield* HttpClient.HttpClient
      const config = yield* CivicsConfig

      return {
        fetch: fetchCivicsQuestions(httpClient, config),
        parse: parseQuestionsFile
      }
    })
  }
) {}

/**
 * Test CivicsQuestionsClient layer.
 *
 * @param fn Optional functions to override default behavior
 * @returns Test layer
 */
export const TestCivicsQuestionsClientLayer = (fn?: {
  fetch?: () => Effect.Effect<string, HttpClientError>
  parse?: () => Effect.Effect<readonly Question[]>
}) =>
  Layer.succeed(
    CivicsQuestionsClient,
    CivicsQuestionsClient.of({
      _tag: 'CivicsQuestionsClient',
      fetch: fn?.fetch ?? (() => Effect.succeed('')),
      parse: fn?.parse ?? (() => Effect.succeed([]))
    })
  )
