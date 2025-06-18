import { Effect } from 'effect'
import { HttpClient, FileSystem } from '@effect/platform'
import parseQuestionsFile from './parseQuestions'
import { CIVICS_QUESTIONS_URL, QUESTIONS_TEXT_FILE } from './config'

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
export const fetchCivicsQuestions = (
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
    yield* Effect.log(`Fetching civics questions from ${url}`)
    const response = yield* httpClient.get(url)
    const text = yield* response.text
    yield* Effect.log(`Saving fetched content to ${localFile}`)
    yield* fs.writeFileString(localFile, text)
    return text
  })

export class CivicsQuestionsClient extends Effect.Service<CivicsQuestionsClient>()(
  'CivicsQuestionsClient',
  {
    effect: Effect.gen(function* () {
      const httpClient = yield* HttpClient.HttpClient
      const fs = yield* FileSystem.FileSystem
      const localFile = yield* QUESTIONS_TEXT_FILE
      const url = yield* CIVICS_QUESTIONS_URL

      return {
        fetch: fetchCivicsQuestions(httpClient, fs, url, localFile),
        parse: parseQuestionsFile
      }
    })
  }
) {}
