import { describe, it, expect } from '@jest/globals'
import { constructQuestions, VARIABLE_QUESTIONS } from '../src/QuestionsManager'
import { Effect } from 'effect'
import { FileSystem } from '@effect/platform'
import { CivicsQuestionsClient, TestCivicsQuestionsClientLayer } from '@src/CivicsQuestions'
import { SenatorsClient, TestSenatorsClientLayer } from '@src/Senators'
import { Question, Representative, Senator } from '@src/types'
import { CivicsConfig } from '@src/config'
import { RepresentativesClient, TestRepresentativesClientLayer } from '@src/Representatives'
import { TestUpdatesClientLayer, Updates } from '@src/Updates'
import { GovernorsClient, TestGovernorsClientLayer } from '@src/Governors'

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
      question: VARIABLE_QUESTIONS.STATE_SENATORS,
      questionNumber: 1,
      answers: {
        _type: 'text',
        choices: ['Not set']
      }
    },
    {
      theme: 'AMERICAN GOVERNMENT',
      section: 'System of Government',
      question: VARIABLE_QUESTIONS.STATE_REPRESENTATIVES,
      questionNumber: 2,
      answers: {
        _type: 'text',
        choices: [
          'Answers will vary. [Residents of territories with nonvoting Delegates or Resident Commissioners may provide the name of that Delegate or Commissioner. Also acceptable is any statement that the territory has no (voting) Representatives in Congress.]'
        ]
      }
    },
    {
      theme: 'AMERICAN GOVERNMENT',
      section: 'System of Government',
      question: VARIABLE_QUESTIONS.STATE_GOVERNORS,
      questionNumber: 3,
      answers: {
        _type: 'text',
        choices: ['Not set']
      }
    },
    {
      theme: 'AMERICAN GOVERNMENT',
      section: 'System of Government',
      question: VARIABLE_QUESTIONS.STATE_CAPITALS,
      questionNumber: 4,
      answers: {
        _type: 'text',
        choices: ['Not set']
      }
    }
  ]

  const REPRESENTATIVES: Representative[] = [
    {
      name: 'John Doe',
      party: 'D',
      state: 'AL',
      phone: '123-456-7890',
      website: 'https://john.doe.com',
      district: '1',
      officeRoom: '1',
      committeeAssignment: '1'
    },
    {
      name: 'Jane Smith',
      party: 'R',
      state: 'TX',
      phone: '098-765-4321',
      website: 'https://jane.smith.com',
      district: '2',
      officeRoom: '2',
      committeeAssignment: '2'
    }
  ]

  const defaultCivicsQuestionsClientLayer = TestCivicsQuestionsClientLayer({
    parse: () => Effect.succeed(QUESTIONS)
  })
  const defaultSenatorsClientLayer = TestSenatorsClientLayer({
    parse: () => Effect.succeed(SENATORS)
  })
  const defaultRepresentativesClientLayer = TestRepresentativesClientLayer({
    parse: () => Effect.succeed(REPRESENTATIVES)
  })
  const defaultFileSystemLayer = FileSystem.layerNoop({
    writeFileString: () => Effect.void,
    readFileString: () => Effect.succeed(''),
    exists: () => Effect.succeed(false)
  })
  const defaultGovernorsClientLayer = TestGovernorsClientLayer({
    fetchGovernmentsIndex: () => Effect.succeed('')
  })
  const defaultUpdatesLayer = TestUpdatesClientLayer({
    fetchUpdates: () => Effect.succeed(''),
    parseUpdates: () => Effect.succeed([])
  })

  it('should include senators question with senators choices', async () => {
    await Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const c = yield* CivicsConfig
      const cqc = yield* CivicsQuestionsClient
      const sc = yield* SenatorsClient
      const rc = yield* RepresentativesClient
      const gc = yield* GovernorsClient
      const uc = yield* Updates
      const questions = yield* constructQuestions(fs, cqc, sc, rc, gc, uc, c)()
      expect(questions?.[0]?.question).toBe("Who is one of your state's U.S. Senators now?*")
      expect(questions?.[0]?.answers).toEqual({
        _type: 'senator',
        choices: SENATORS_CHOICES
      })
    }).pipe(
      Effect.provide(defaultCivicsQuestionsClientLayer),
      Effect.provide(defaultSenatorsClientLayer),
      Effect.provide(defaultRepresentativesClientLayer),
      Effect.provide(defaultFileSystemLayer),
      Effect.provide(defaultGovernorsClientLayer),
      Effect.provide(defaultUpdatesLayer),
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
            questionNumber: 1,
            answers: { _type: 'text', choices: ['foo'] }
          }
        ])
    })

    await expect(
      Effect.gen(function* () {
        const fs = yield* FileSystem.FileSystem
        const c = yield* CivicsConfig
        const cqc = yield* CivicsQuestionsClient
        const sc = yield* SenatorsClient
        const rc = yield* RepresentativesClient
        const gc = yield* GovernorsClient
        const uc = yield* Updates
        return yield* constructQuestions(fs, cqc, sc, rc, gc, uc, c)()
      }).pipe(
        Effect.provide(civicsQuestionsClientLayer),
        Effect.provide(defaultSenatorsClientLayer),
        Effect.provide(defaultRepresentativesClientLayer),
        Effect.provide(defaultFileSystemLayer),
        Effect.provide(defaultGovernorsClientLayer),
        Effect.provide(defaultUpdatesLayer),
        Effect.runPromise
      )
    ).rejects.toThrow()
  })

  it('should handle empty senators list', async () => {
    const senatorsClientLayer = TestSenatorsClientLayer({
      parse: () => Effect.succeed([])
    })
    await Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const c = yield* CivicsConfig
      const cqc = yield* CivicsQuestionsClient
      const sc = yield* SenatorsClient
      const rc = yield* RepresentativesClient
      const gc = yield* GovernorsClient
      const uc = yield* Updates
      const questions = yield* constructQuestions(fs, cqc, sc, rc, gc, uc, c)()
      expect(questions?.[0]?.answers).toEqual({ _type: 'senator', choices: [] })
    }).pipe(
      Effect.provide(senatorsClientLayer),
      Effect.provide(defaultCivicsQuestionsClientLayer),
      Effect.provide(defaultRepresentativesClientLayer),
      Effect.provide(defaultFileSystemLayer),
      Effect.provide(defaultGovernorsClientLayer),
      Effect.provide(defaultUpdatesLayer),
      Effect.runPromise
    )
  })

  it('should handle empty questions list', async () => {
    const civicsQuestionsClientLayer = TestCivicsQuestionsClientLayer({
      parse: () => Effect.succeed([])
    })

    await expect(
      Effect.gen(function* () {
        const cq = yield* CivicsQuestionsClient
        const sc = yield* SenatorsClient
        const rc = yield* RepresentativesClient
        const fs = yield* FileSystem.FileSystem
        const config = yield* CivicsConfig
        const gc = yield* GovernorsClient
        const uc = yield* Updates
        return yield* constructQuestions(fs, cq, sc, rc, gc, uc, config)()
      }).pipe(
        Effect.provide(civicsQuestionsClientLayer),
        Effect.provide(defaultSenatorsClientLayer),
        Effect.provide(defaultRepresentativesClientLayer),
        Effect.provide(defaultFileSystemLayer),
        Effect.provide(defaultGovernorsClientLayer),
        Effect.provide(defaultUpdatesLayer),
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
            questionNumber: 1,
            answers: { _type: 'text', choices: ['George Washington'] }
          }
        ])
    })

    await Effect.gen(function* () {
      const cq = yield* CivicsQuestionsClient
      const sc = yield* SenatorsClient
      const rc = yield* RepresentativesClient
      const fs = yield* FileSystem.FileSystem
      const config = yield* CivicsConfig
      const gc = yield* GovernorsClient
      const uc = yield* Updates
      const questions = yield* constructQuestions(fs, cq, sc, rc, gc, uc, config)()
      expect(questions).toHaveLength(QUESTIONS.length + 1)
      expect(questions?.[QUESTIONS.length]?.question).toBe('Who was the first President?')
      expect(questions?.[QUESTIONS.length]?.answers).toEqual({
        _type: 'text',
        choices: ['George Washington']
      })
    }).pipe(
      Effect.provide(civicsQuestionsClientLayer),
      Effect.provide(defaultSenatorsClientLayer),
      Effect.provide(defaultRepresentativesClientLayer),
      Effect.provide(defaultFileSystemLayer),
      Effect.provide(defaultGovernorsClientLayer),
      Effect.provide(defaultUpdatesLayer),
      Effect.runPromise
    )
  })

  it('should handle senators with missing fields gracefully', async () => {
    const senatorsClientLayer = TestSenatorsClientLayer({
      parse: () => Effect.succeed([{ member_full: 'Incomplete Senator' } as Senator])
    })
    await Effect.gen(function* () {
      const cq = yield* CivicsQuestionsClient
      const sc = yield* SenatorsClient
      const rc = yield* RepresentativesClient
      const fs = yield* FileSystem.FileSystem
      const config = yield* CivicsConfig
      const gc = yield* GovernorsClient
      const uc = yield* Updates
      const questions = yield* constructQuestions(fs, cq, sc, rc, gc, uc, config)()
      expect(questions?.[0]?.answers._type).toBe('senator')
      expect(Array.isArray(questions?.[0]?.answers.choices)).toBe(true)
    }).pipe(
      Effect.provide(senatorsClientLayer),
      Effect.provide(defaultCivicsQuestionsClientLayer),
      Effect.provide(defaultRepresentativesClientLayer),
      Effect.provide(defaultFileSystemLayer),
      Effect.provide(defaultGovernorsClientLayer),
      Effect.provide(defaultUpdatesLayer),
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
            questionNumber: 70,
            answers: { _type: 'text', choices: ['George Washington'] }
          }
        ])
    })

    await Effect.gen(function* () {
      const cq = yield* CivicsQuestionsClient
      const sc = yield* SenatorsClient
      const rc = yield* RepresentativesClient
      const fs = yield* FileSystem.FileSystem
      const config = yield* CivicsConfig
      const gc = yield* GovernorsClient
      const uc = yield* Updates
      const questions = yield* constructQuestions(fs, cq, sc, rc, gc, uc, config)()
      expect(
        questions?.find((q) => q.question === 'Who was the first President?')?.answers
      ).toEqual({ _type: 'text', choices: ['George Washington'] })
      expect(questions?.find((q) => q.question === QUESTIONS?.[0]?.question)?.answers._type).toBe(
        'senator'
      )
    }).pipe(
      Effect.provide(civicsQuestionsClientLayer),
      Effect.provide(defaultSenatorsClientLayer),
      Effect.provide(defaultRepresentativesClientLayer),
      Effect.provide(defaultFileSystemLayer),
      Effect.provide(defaultGovernorsClientLayer),
      Effect.provide(defaultUpdatesLayer),
      Effect.runPromise
    )
  })
})
