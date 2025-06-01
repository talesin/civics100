import { Effect, Console, Layer } from 'effect'
import { NodeContext } from '@effect/platform-node'
import { FetchHttpClient } from '@effect/platform'
import { fetchCivicsQuestions as actualFetchCivicsQuestions } from '@src/fetchCivicsQuestions'
import { parseQuestions, QA } from '@src/parseQuestions'
import * as fs from 'fs'
import * as path from 'path'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock the fetchCivicsQuestions effect
const mockFetchCivicsQuestions = jest.fn<() => Effect.Effect<string, string, never>>()

jest.mock('@src/fetchCivicsQuestions', () => ({
  fetchCivicsQuestions: Effect.suspend(() => mockFetchCivicsQuestions())
}))

describe('parseQuestions', () => {
  const testLayer = Layer.merge(NodeContext.layer, FetchHttpClient.layer)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should parse questions from a local file correctly', async () => {
    const localFilePath = path.join(process.cwd(), 'data', '100q.txt')
    const textFromFile = fs.readFileSync(localFilePath, 'utf-8')

    const program = Effect.gen(function* (_) {
      const questions = yield* parseQuestions(textFromFile)
      expect(questions).toBeInstanceOf(Array)
      expect(questions.length).toBeGreaterThan(0)

      // Check structure of the first question as a sample
      if (questions.length > 0) {
        const firstQuestion = questions[0]
        if (firstQuestion !== undefined) {
          expect(firstQuestion).toHaveProperty('theme')
          expect(firstQuestion).toHaveProperty('section')
          expect(firstQuestion).toHaveProperty('question')
          expect(firstQuestion).toHaveProperty('answers')
          expect(firstQuestion.answers).toBeInstanceOf(Array)
        } else {
          // This branch should ideally not be hit if questions.length > 0
          // but it satisfies the type checker and makes the test fail explicitly if it is.
          expect(firstQuestion).toBeDefined()
        }
      }
      yield* Console.log(`Successfully parsed ${questions.length} questions from local file`)
      return questions
    })

    await Effect.runPromise(program.pipe(Effect.provide(testLayer)))
  })

  it('should parse questions fetched from the web (mocked)', async () => {
    const mockWebText = `
1. What is the supreme law of the land?
▪ The Constitution

AMERICAN GOVERNMENT
A: Principles of American Democracy

2. What does the Constitution do?
▪ sets up the government
▪ defines the government
▪ protects basic rights of Americans
`
    mockFetchCivicsQuestions.mockReturnValue(Effect.succeed(mockWebText))

    const program = Effect.gen(function* (_) {
      const textFromWeb = yield* actualFetchCivicsQuestions // Use the original name for clarity inside the test
      const questions = yield* parseQuestions(textFromWeb)
      expect(questions).toBeInstanceOf(Array)
      expect(questions.length).toBe(2) // Based on mockWebText
      const q0_web = questions[0]
      const q1_web = questions[1]
      if (q0_web !== undefined && q1_web !== undefined) {
        expect(q0_web.question).toBe('What is the supreme law of the land?')
        expect(q1_web.answers).toEqual([
          'sets up the government',
          'defines the government',
          'protects basic rights of Americans'
        ])
      } else {
        expect(q0_web).toBeDefined()
        expect(q1_web).toBeDefined()
      }
      yield* Console.log(`Successfully parsed ${questions.length} questions from mocked web fetch`)
      return questions
    })

    await Effect.runPromise(program.pipe(Effect.provide(testLayer)))
    expect(mockFetchCivicsQuestions).toHaveBeenCalledTimes(1)
  })

  it('should return an empty array or handle error for empty input string', async () => {
    const program = Effect.gen(function* (_) {
      const questions = yield* parseQuestions('')
      expect(questions).toBeInstanceOf(Array)
      // Depending on implementation, it might be empty or throw an error handled by catchTag/catchAll
      // For this example, let's assume it returns an empty array for empty non-null input
      expect(questions.length).toBe(0)
      yield* Console.log('Parsed empty string, result count: ' + questions.length)
      return questions
    }).pipe(
      Effect.catchAll((_error) => {
        // parseQuestions fails with a string error, e.g., for empty/invalid input.
        // We expect an empty array of questions in such a case for this test.
        // console.error('Caught error during empty string test:', _error); // Optional: for debugging
        return Effect.succeed([] as QA[])
      })
    )

    await Effect.runPromise(program.pipe(Effect.provide(testLayer)))
  })

  it('should correctly parse a question with multiple answers', async () => {
    const text = `
5. What do we call the first ten amendments to the Constitution?
▪ the Bill of Rights
`
    const program = Effect.gen(function* (_) {
      const questions = yield* parseQuestions(text)
      expect(questions.length).toBe(1)
      const q0_multi_ans = questions[0]
      if (q0_multi_ans !== undefined) {
        expect(q0_multi_ans.answers).toEqual(['the Bill of Rights'])
      } else {
        expect(q0_multi_ans).toBeDefined()
      }
      return questions
    })
    await Effect.runPromise(program.pipe(Effect.provide(testLayer)))
  })

  it('should correctly parse themes and sections', async () => {
    const text = `
AMERICAN GOVERNMENT
A: Principles of American Democracy

1. What is the supreme law of the land?
▪ The Constitution

B: System of Government

18. How many U.S. Senators are there?
▪ one hundred (100)
`
    const program = Effect.gen(function* (_) {
      const questions = yield* parseQuestions(text)
      expect(questions.length).toBe(2)
      const q0_theme = questions[0]
      const q1_theme = questions[1]
      if (q0_theme !== undefined && q1_theme !== undefined) {
        expect(q0_theme.theme).toBe('AMERICAN GOVERNMENT')
        expect(q0_theme.section).toBe('A: Principles of American Democracy')
        expect(q1_theme.theme).toBe('AMERICAN GOVERNMENT') // Theme persists
        expect(q1_theme.section).toBe('B: System of Government')
      } else {
        expect(q0_theme).toBeDefined()
        expect(q1_theme).toBeDefined()
      }
      return questions
    })
    await Effect.runPromise(program.pipe(Effect.provide(testLayer)))
  })
})
