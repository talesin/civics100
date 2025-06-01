import { Effect } from 'effect'
import { HttpClient, HttpClientError } from '@effect/platform'

/**
 * URL for the USCIS 100 civics questions document
 */
const CIVICS_QUESTIONS_URL =
  'https://www.uscis.gov/sites/default/files/document/questions-and-answers/100q.txt'

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
export const fetchCivicsQuestions: Effect.Effect<
  string,
  HttpClientError.HttpClientError,
  HttpClient.HttpClient
> = Effect.gen(function* () {
  // Check if HttpClient is available in the current runtime
  const httpClient = yield* HttpClient.HttpClient

  const response = yield* httpClient.get(CIVICS_QUESTIONS_URL)

  return yield* response.text
})

export default fetchCivicsQuestions
