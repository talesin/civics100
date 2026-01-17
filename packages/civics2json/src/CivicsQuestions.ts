import { Effect, Layer } from 'effect'
import { HttpClient } from '@effect/platform'
import { PlatformError } from '@effect/platform/Error'
import parseQuestionsFile from './parseQuestions'
import { Question } from './types'
import { HttpClientError } from '@effect/platform/HttpClientError'
import { CivicsConfig } from './config'

/**
 * Cleans PDF page markers from extracted text.
 */
const cleanPdfPageMarkers = (text: string): string => {
  return text
    .replace(/,\d+\s+of\s+\d+uscis\.gov\/citizenship/g, '')
    .replace(/^\d+\s+of\s+\d+uscis\.gov\/citizenship$/gm, '')
    .replace(/\d+\s+of\s+\d+uscis\.gov\/citizenship/g, '')
}

/**
 * Extracts text from a PDF buffer using unpdf library.
 *
 * @param buffer - The PDF file as a Buffer
 * @returns An Effect that resolves to the extracted text (cleaned of page markers)
 */
const extractTextFromPdf = (buffer: Buffer) =>
  Effect.tryPromise({
    try: async () => {
      const { extractText } = await import('unpdf')
      const uint8Array = new Uint8Array(buffer)
      const result = await extractText(uint8Array)
      // unpdf returns an object with a text property
      const rawText =
        typeof result === 'object' && result !== null && 'text' in result
          ? String(result.text)
          : String(result)
      // Clean page markers immediately after extraction
      return cleanPdfPageMarkers(rawText)
    },
    catch: (error) => new Error(`Failed to extract text from PDF: ${String(error)}`)
  })

/**
 * Fetches the civics questions from the USCIS website.
 * Supports both text files (.txt) and PDF files (.pdf).
 *
 * This effect:
 * - Makes an HTTP GET request to the USCIS website
 * - If the URL points to a PDF, extracts text using unpdf
 * - Otherwise, returns the text content directly
 * - Fails with a descriptive error if the request fails
 *
 * @returns An Effect that resolves to the civics questions text
 */
export const fetchCivicsQuestions = (httpClient: HttpClient.HttpClient, config: CivicsConfig) =>
  Effect.gen(function* () {
    yield* Effect.log(`Fetching civics questions from ${config.QUESTIONS_URL}`)
    const response = yield* httpClient.get(config.QUESTIONS_URL)

    // Check if the URL points to a PDF file
    const isPdf = config.QUESTIONS_URL.toLowerCase().endsWith('.pdf')

    if (isPdf) {
      yield* Effect.log('Detected PDF format, extracting text...')
      const arrayBuffer = yield* response.arrayBuffer
      const buffer = Buffer.from(arrayBuffer)
      const text = yield* extractTextFromPdf(buffer)
      yield* Effect.log(`Extracted ${text.length} characters from PDF`)
      return text
    } else {
      const text = yield* response.text
      return text
    }
  })

/**
 * CivicsQuestionsClient service class, fetches, parses, and writes civics questions.
 * @example
 * const cq = yield* CivicsQuestionsClient
 * const questions = yield* cq.fetch()
 * const parsed = yield* cq.parse(questions)
 */
export class CivicsQuestionsClient extends Effect.Service<CivicsQuestionsClient>()(
  'civics2json/CivicsQuestionsClient',
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
  fetch?: Effect.Effect<string, HttpClientError | PlatformError | Error>
  parse?: (text: string) => Effect.Effect<readonly Question[]>
}) =>
  Layer.succeed(
    CivicsQuestionsClient,
    CivicsQuestionsClient.of({
      _tag: 'civics2json/CivicsQuestionsClient',
      fetch: fn?.fetch ?? Effect.succeed(''),
      parse: fn?.parse ?? ((_text: string) => Effect.succeed([]))
    })
  )
