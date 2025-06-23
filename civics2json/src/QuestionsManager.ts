import { Effect } from 'effect'

import { CivicsQuestionsClient } from './CivicsQuestions'
import { SenatorsClient } from './Senators'
import { PlatformError } from '@effect/platform/Error'
import { HttpClientError } from '@effect/platform/HttpClientError'
import { Question, Senator } from './types'
import { ParseError } from 'effect/ParseResult'
import { UnknownException } from 'effect/Cause'

export const STATE_SENATORS_QUESTION = "Who is one of your state's U.S. Senators now?*"

export const fetchCivicsQuestions = (
  cq: CivicsQuestionsClient
): (() => Effect.Effect<string, PlatformError | HttpClientError>) =>
  Effect.fn(function* () {
    const text = yield* cq.fetch()
    return text
  })

export const fetchAndParseCivicsQuestions = (
  cq: CivicsQuestionsClient
): (() => Effect.Effect<readonly Question[], PlatformError | HttpClientError>) =>
  Effect.fn(function* () {
    const text = yield* cq.fetch()
    const questions = yield* cq.parse(text)
    yield* cq.write(questions)
    return questions
  })

export const fetchSenators = (
  senators: SenatorsClient
): (() => Effect.Effect<string, PlatformError | HttpClientError>) =>
  Effect.fn(function* () {
    const text = yield* senators.fetch()
    return text
  })

export const fetchAndParseSenators = (
  senators: SenatorsClient
): (() => Effect.Effect<
  readonly Senator[],
  ParseError | UnknownException | PlatformError | HttpClientError
>) =>
  Effect.fn(function* () {
    const text = yield* senators.fetch()
    const parsed = yield* senators.parse(text)
    yield* senators.write(parsed)
    return parsed
  })

export const constructQuestions = (cq: CivicsQuestionsClient, sc: SenatorsClient) =>
  Effect.fn(function* () {
    yield* Effect.log('Constructing questions...')
    const senators = (yield* fetchAndParseSenators(sc)()).map((s) => ({
      senator: `${s.first_name} ${s.last_name} (${s.state}-${s.party})`,
      state: s.state
    }))

    const questionMap = Object.fromEntries(
      (yield* fetchAndParseCivicsQuestions(cq)()).map((q) => [q.question, q])
    )

    if (questionMap[STATE_SENATORS_QUESTION] === undefined) {
      return yield* Effect.fail(new Error('State senators question not found'))
    }

    const senatorsQuestion: Question = {
      ...questionMap[STATE_SENATORS_QUESTION],
      answers: { _type: 'senator', choices: senators }
    }

    const questions = Object.values({
      ...questionMap,
      [STATE_SENATORS_QUESTION]: senatorsQuestion
    })

    yield* Effect.log(`Writing updated questions to file`)
    yield* cq.write(questions)
    yield* Effect.log(`Completed constructing questions`)
    return questions
  })

export const fetchRepresentatives = () =>
  Effect.fn(function* () {
    yield* Effect.log('Fetching representatives...')
  })

export const parseRepresentatives = () =>
  Effect.fn(function* () {
    yield* Effect.log('Parsing representatives...')
  })

export class QuestionsManager extends Effect.Service<QuestionsManager>()('QuestionsManager', {
  effect: Effect.gen(function* () {
    const cq = yield* CivicsQuestionsClient
    const senators = yield* SenatorsClient

    return {
      fetchCivicsQuestions: fetchCivicsQuestions(cq),
      parseCivicsQuestions: fetchAndParseCivicsQuestions(cq),
      fetchSenators: fetchSenators(senators),
      parseSenators: fetchAndParseSenators(senators),
      fetchRepresentatives: fetchRepresentatives(),
      parseRepresentatives: parseRepresentatives(),
      constructQuestions: constructQuestions(cq, senators)
    }
  }),
  dependencies: [CivicsQuestionsClient.Default, SenatorsClient.Default]
}) {}
