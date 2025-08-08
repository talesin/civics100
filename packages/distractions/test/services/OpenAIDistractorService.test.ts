import { Effect } from 'effect'
import {
  OpenAIDistractorService,
  TestOpenAIDistractorServiceLayer,
  generateDistractorsWithOpenAI,
  createOpenAIRequest
} from '@src/services/OpenAIDistractorService'
import type { Question } from 'civics2json'
import type { OpenAIRequest } from '@src/types/index'

describe('OpenAIDistractorService', () => {
  const mockQuestion: Question = {
    theme: 'AMERICAN GOVERNMENT',
    section: 'Principles of American Democracy',
    question: 'What is the supreme law of the land?',
    questionNumber: 1,
    expectedAnswers: 1,
    answers: {
      _type: 'text',
      choices: ['the Constitution']
    }
  }

  describe('createOpenAIRequest', () => {
    it('should create request from text question', async () => {
      await Effect.gen(function* () {
        const request = yield* createOpenAIRequest()(mockQuestion, 10)

        expect(request.question).toBe(mockQuestion.question)
        expect(request.answerType).toBe('text')
        expect(request.targetCount).toBe(10)
        expect(request.context).toContain('Question type: text')
        expect(request.context).toContain('Theme: AMERICAN GOVERNMENT')
      }).pipe(Effect.runPromise)
    })

    it('should create request for senator question', async () => {
      const senatorQuestion: Question = {
        ...mockQuestion,
        answers: {
          _type: 'senator',
          choices: [{ senator: 'John Doe', state: 'NY' }]
        }
      }

      await Effect.gen(function* () {
        const request = yield* createOpenAIRequest()(senatorQuestion, 5)

        expect(request.answerType).toBe('senator')
        expect(request.targetCount).toBe(5)
        expect(request.context).toContain('senator type answers')
      }).pipe(Effect.runPromise)
    })
  })

  describe('generateDistractorsWithOpenAI', () => {
    it('should return mock response structure', async () => {
      const mockRequest: OpenAIRequest = {
        question: 'Test question',
        answerType: 'text',
        context: 'Test context',
        targetCount: 5
      }

      await Effect.gen(function* () {
        const response = yield* generateDistractorsWithOpenAI()(mockRequest)

        expect(response.distractors).toHaveLength(3)
        expect(response.confidence).toBe(0.8)
        expect(response.tokensUsed).toBe(150)
        expect(response.distractors[0]).toBe('Mock distractor 1')
      }).pipe(Effect.runPromise)
    })
  })

  describe('Service Integration', () => {
    it('should work with test layer', async () => {
      const testLayer = TestOpenAIDistractorServiceLayer({
        generateDistractors: () =>
          Effect.succeed({
            distractors: ['Test A', 'Test B'],
            confidence: 0.9,
            tokensUsed: 50
          })
      })

      await Effect.gen(function* () {
        const service = yield* OpenAIDistractorService
        const mockRequest: OpenAIRequest = {
          question: 'Test',
          answerType: 'text',
          context: 'Test',
          targetCount: 2
        }

        const response = yield* service.generateDistractors(mockRequest)
        expect(response.distractors).toEqual(['Test A', 'Test B'])
        expect(response.confidence).toBe(0.9)
      }).pipe(Effect.provide(testLayer), Effect.runPromise)
    })

    it('should validate configuration in service', async () => {
      // This test would require mocking environment variables
      // For now, we test the structure
      await Effect.gen(function* () {
        const service = yield* OpenAIDistractorService
        expect(service).toHaveProperty('generateDistractors')
        expect(service).toHaveProperty('createRequest')
        expect(service).toHaveProperty('validateConfig')
      }).pipe(Effect.provide(TestOpenAIDistractorServiceLayer()), Effect.runPromise)
    })
  })
})
