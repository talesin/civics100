import { Effect, Layer } from 'effect'
import { HttpClient, FileSystem } from '@effect/platform'
import parseQuestionsFile from './parseQuestions'
import config from './config'
import { Question } from './types'
import { PlatformError } from '@effect/platform/Error'
import { HttpClientError } from '@effect/platform/HttpClientError'

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

export const writeQuestionsJson = (fs: FileSystem.FileSystem, localFile: string) =>
  Effect.fn(function* (questions: readonly Question[]) {
    yield* Effect.log(`Writing ${questions.length} questions JSON to ${localFile}`)
    yield* fs.writeFileString(localFile, JSON.stringify(questions, null, 2))
  })

export class CivicsQuestionsClient extends Effect.Service<CivicsQuestionsClient>()(
  'CivicsQuestionsClient',
  {
    effect: Effect.gen(function* () {
      const httpClient = yield* HttpClient.HttpClient
      const fs = yield* FileSystem.FileSystem
      const c = yield* config

      return {
        fetch: fetchCivicsQuestions(httpClient, fs, c.CIVICS_QUESTIONS_URL, c.QUESTIONS_TEXT_FILE),
        parse: parseQuestionsFile,
        write: writeQuestionsJson(fs, c.QUESTIONS_JSON_FILE)
      }
    })
  }
) {}

export const TestCivicsQuestionsClientLayer = (fn?: {
  fetch?: () => Effect.Effect<string, PlatformError | HttpClientError>
  parse?: () => Effect.Effect<readonly Question[]>
  write?: () => Effect.Effect<void, PlatformError>
}) =>
  Layer.succeed(
    CivicsQuestionsClient,
    CivicsQuestionsClient.of({
      _tag: 'CivicsQuestionsClient',
      fetch: fn?.fetch ?? (() => Effect.succeed('')),
      parse: fn?.parse ?? (() => Effect.succeed([])),
      write: fn?.write ?? (() => Effect.succeed(undefined))
    })
  )
