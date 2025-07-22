import { Effect, Layer } from 'effect'
import { HttpClient, HttpClientError } from '@effect/platform'
import { CivicsConfig } from './config'
import { Question } from './types'
import { getDOMDocument, getElementSiblings, ParseHTMLError } from './utils'

/**
 * Filtered set of updated questions
 */
export const UPDATED_QUESTIONS = new Set([
  'What is the name of the President of the United States now?*',
  'What is the name of the Vice President of the United States now?',
  'How many justices are on the Supreme Court?',
  'Who is the Chief Justice of the United States now?',
  'What is the political party of the President now?',
  'What is the name of the Speaker of the House of Representatives now?',
  'Name two national U.S. holidays.'
])

/**
 * Fetches the updates HTML from the UPDATES_URL in config.
 * Returns the text content as an Effect.
 */
export const fetchUpdates = (httpClient: HttpClient.HttpClient, config: CivicsConfig) =>
  Effect.fn(function* () {
    yield* Effect.log(`Fetching updates HTML from ${config.UPDATES_URL}`)
    const response = yield* httpClient.get(config.UPDATES_URL)
    const text = yield* response.text
    yield* Effect.log(`Fetched ${text.length} bytes for updates HTML`)
    return text
  })

/**
 * Parses the updates HTML and returns an array of Question objects.
 */
export const parseUpdates: (html: string) => Effect.Effect<Partial<Question>[], ParseHTMLError> = (
  html: string
) =>
  Effect.gen(function* () {
    const doc = yield* getDOMDocument(html)

    // cleanse text by removing leading and trailing whitespace, newlines, and multiple spaces
    const cleanse = (text: string | null) => text?.trim().replaceAll('\n', '').replace(/\s+/g, ' ')

    // split question text into question number and question text
    const splitQuestion = (text: string | null) => {
      const split = cleanse(text)?.split(/(?<=\d+)\. /)
      if (split?.length !== 2) return undefined
      return { text: split?.[1], number: parseInt(split?.[0] ?? '0') }
    }

    const questions: Partial<Question>[] = Array.from(
      // select all <p> elements that are children of <div> elements with class "accordion__panel"
      doc.querySelectorAll(`div[class="accordion__panel"] > p`)
    )
      .map((p) => ({
        // extract question number and question text from <p> element
        question: splitQuestion(p.textContent),
        // extract answers from <ul> elements that are siblings of <p> element
        answers: Array.from(
          getElementSiblings(p)
            .find((node) => node.nodeName === 'UL')
            ?.querySelectorAll('li') ?? []
        )
          .map((li) => cleanse(li.textContent))
          .filter((li): li is string => li !== null)
      }))
      // filter out any questions that don't have a question number or question text
      .filter(
        (item): item is { question: { text: string; number: number }; answers: string[] } =>
          item.question?.text !== undefined &&
          item.question?.number !== undefined &&
          UPDATED_QUESTIONS.has(item.question.text)
      )
      // map each object to a Partial<Question> object
      .map((item) => ({
        question: item.question.text,
        questionNumber: item.question.number,
        answers: { _type: 'text', choices: item.answers }
      }))

    yield* Effect.log(`Found ${questions.length} questions`)

    return questions
  })

/**
 * Updates service class for dependency injection
 */
export class Updates extends Effect.Service<Updates>()('Updates', {
  effect: Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient
    const config = yield* CivicsConfig
    return {
      fetchUpdates: fetchUpdates(httpClient, config),
      parseUpdates: parseUpdates
    }
  })
}) {}

/**
 * Test Updates layer.
 *
 * @param fn Optional functions to override default behavior
 * @returns Test layer
 */
export const TestUpdatesClientLayer = (fn?: {
  fetchUpdates?: () => Effect.Effect<string, HttpClientError.HttpClientError>
  parseUpdates?: (html: string) => Effect.Effect<Partial<Question>[], ParseHTMLError>
}) =>
  Layer.succeed(
    Updates,
    Updates.of({
      _tag: 'Updates',
      fetchUpdates: fn?.fetchUpdates ?? (() => Effect.succeed('')),
      parseUpdates: fn?.parseUpdates ?? ((_html: string) => Effect.succeed([]))
    })
  )
