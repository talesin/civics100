import { describe, it, expect } from '@jest/globals'
import { constructQuestions } from '../src/QuestionsManager'
import { Effect } from 'effect'
import { CivicsQuestionsClient, TestCivicsQuestionsClientLayer } from '@src/CivicsQuestions'
import { SenatorsClient, TestSenatorsClientLayer } from '@src/Senators'
import { Question, Senator } from '@src/types'

describe('constructQuestions', () => {
  const SENATORS: Senator[] = [
    {
      last_name: 'Doe',
      first_name: 'John',
      party: 'D',
      state: 'CA',
      address: '123 Main St',
      phone: '123-456-7890',
      email: 'john.doe@example.com',
      website: 'https://john.doe.com',
      class: '1',
      member_full: 'John Doe',
      bioguide_id: 'D000000'
    },
    {
      last_name: 'Smith',
      first_name: 'Jane',
      party: 'R',
      state: 'TX',
      address: '456 Elm St',
      phone: '098-765-4321',
      email: 'jane.smith@example.com',
      website: 'https://jane.smith.com',
      class: '2',
      member_full: 'Jane Smith',
      bioguide_id: 'S000001'
    }
  ]

  const SENATORS_CHOICES = SENATORS.map((s) => ({
    senator: `${s.first_name} ${s.last_name} (${s.state}-${s.party})`,
    state: s.state
  }))

  const QUESTIONS: Question[] = [
    {
      theme: 'AMERICAN GOVERNMENT',
      section: 'System of Government',
      question: "Who is one of your state's U.S. Senators now?*",
      answers: {
        _type: 'text',
        choices: ['Not set']
      }
    }
  ]

  it('should include senators question with senators choices', async () => {
    const civicsQuestionsClientLayer = TestCivicsQuestionsClientLayer({
      parse: () => Effect.succeed(QUESTIONS)
    })
    const senatorsClientLayer = TestSenatorsClientLayer({
      parse: () => Effect.succeed(SENATORS)
    })

    await Effect.gen(function* () {
      const cq = yield* CivicsQuestionsClient
      const sc = yield* SenatorsClient
      const questions = yield* constructQuestions(cq, sc)()
      expect(questions).toHaveLength(1)
      expect(questions?.[0]?.question).toBe("Who is one of your state's U.S. Senators now?*")
      expect(questions?.[0]?.answers).toEqual({
        _type: 'senator',
        choices: SENATORS_CHOICES
      })
    }).pipe(
      Effect.provide(civicsQuestionsClientLayer),
      Effect.provide(senatorsClientLayer),
      Effect.runPromise
    )
  })

  it('should fail if the senators question is missing', async () => {
    const civicsQuestionsClientLayer = TestCivicsQuestionsClientLayer({
      parse: () =>
        Effect.succeed([
          {
            theme: 'AMERICAN GOVERNMENT',
            section: 'System of Government',
            question: 'Some other question',
            answers: { _type: 'text', choices: ['foo'] }
          }
        ])
    })
    const senatorsClientLayer = TestSenatorsClientLayer({
      parse: () => Effect.succeed(SENATORS)
    })

    await expect(
      Effect.gen(function* () {
        const cq = yield* CivicsQuestionsClient
        const sc = yield* SenatorsClient
        return yield* constructQuestions(cq, sc)()
      }).pipe(
        Effect.provide(civicsQuestionsClientLayer),
        Effect.provide(senatorsClientLayer),
        Effect.runPromise
      )
    ).rejects.toThrow()
  })

  it('should handle empty senators list', async () => {
    const civicsQuestionsClientLayer = TestCivicsQuestionsClientLayer({
      parse: () => Effect.succeed(QUESTIONS)
    })
    const senatorsClientLayer = TestSenatorsClientLayer({
      parse: () => Effect.succeed([])
    })
    await Effect.gen(function* () {
      const cq = yield* CivicsQuestionsClient
      const sc = yield* SenatorsClient
      const questions = yield* constructQuestions(cq, sc)()
      expect(questions?.[0]?.answers).toEqual({ _type: 'senator', choices: [] })
    }).pipe(
      Effect.provide(civicsQuestionsClientLayer),
      Effect.provide(senatorsClientLayer),
      Effect.runPromise
    )
  })

  it('should handle empty questions list', async () => {
    const civicsQuestionsClientLayer = TestCivicsQuestionsClientLayer({
      parse: () => Effect.succeed([])
    })
    const senatorsClientLayer = TestSenatorsClientLayer({
      parse: () => Effect.succeed(SENATORS)
    })
    await expect(
      Effect.gen(function* () {
        const cq = yield* CivicsQuestionsClient
        const sc = yield* SenatorsClient
        return yield* constructQuestions(cq, sc)()
      }).pipe(
        Effect.provide(civicsQuestionsClientLayer),
        Effect.provide(senatorsClientLayer),
        Effect.runPromise
      )
    ).rejects.toThrow()
  })

  it('should preserve other questions', async () => {
    const civicsQuestionsClientLayer = TestCivicsQuestionsClientLayer({
      parse: () =>
        Effect.succeed([
          ...QUESTIONS,
          {
            theme: 'AMERICAN HISTORY',
            section: 'Colonial Period',
            question: 'Who was the first President?',
            answers: { _type: 'text', choices: ['George Washington'] }
          }
        ])
    })
    const senatorsClientLayer = TestSenatorsClientLayer({
      parse: () => Effect.succeed(SENATORS)
    })
    await Effect.gen(function* () {
      const cq = yield* CivicsQuestionsClient
      const sc = yield* SenatorsClient
      const questions = yield* constructQuestions(cq, sc)()
      expect(questions).toHaveLength(2)
      expect(questions?.[1]?.question).toBe('Who was the first President?')
      expect(questions?.[1]?.answers).toEqual({ _type: 'text', choices: ['George Washington'] })
    }).pipe(
      Effect.provide(civicsQuestionsClientLayer),
      Effect.provide(senatorsClientLayer),
      Effect.runPromise
    )
  })

  it('should handle senators with missing fields gracefully', async () => {
    const civicsQuestionsClientLayer = TestCivicsQuestionsClientLayer({
      parse: () => Effect.succeed(QUESTIONS)
    })
    const senatorsClientLayer = TestSenatorsClientLayer({
      parse: () => Effect.succeed([{ member_full: 'Incomplete Senator' } as Senator])
    })
    await Effect.gen(function* () {
      const cq = yield* CivicsQuestionsClient
      const sc = yield* SenatorsClient
      const questions = yield* constructQuestions(cq, sc)()
      expect(questions?.[0]?.answers._type).toBe('senator')
      expect(Array.isArray(questions?.[0]?.answers.choices)).toBe(true)
    }).pipe(
      Effect.provide(civicsQuestionsClientLayer),
      Effect.provide(senatorsClientLayer),
      Effect.runPromise
    )
  })

  it('should only replace the senator question answer type', async () => {
    const civicsQuestionsClientLayer = TestCivicsQuestionsClientLayer({
      parse: () =>
        Effect.succeed([
          ...QUESTIONS,
          {
            theme: 'AMERICAN HISTORY',
            section: 'Colonial Period',
            question: 'Who was the first President?',
            answers: { _type: 'text', choices: ['George Washington'] }
          }
        ])
    })
    const senatorsClientLayer = TestSenatorsClientLayer({
      parse: () => Effect.succeed(SENATORS)
    })
    await Effect.gen(function* () {
      const cq = yield* CivicsQuestionsClient
      const sc = yield* SenatorsClient
      const questions = yield* constructQuestions(cq, sc)()
      expect(
        questions?.find((q) => q.question === 'Who was the first President?')?.answers
      ).toEqual({ _type: 'text', choices: ['George Washington'] })
      expect(questions?.find((q) => q.question === QUESTIONS?.[0]?.question)?.answers._type).toBe(
        'senator'
      )
    }).pipe(
      Effect.provide(civicsQuestionsClientLayer),
      Effect.provide(senatorsClientLayer),
      Effect.runPromise
    )
  })
})
