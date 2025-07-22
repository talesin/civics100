import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import {
  QuestionClassifierService,
  TestQuestionClassifierServiceLayer
} from '../../src/services/QuestionClassifierService'
import type { Question } from 'civics2json'

describe('QuestionClassifierService', () => {
  it('should correctly classify a variety of questions', async () => {
    const questions: Record<string, Question> = {
      president: {
        questionNumber: 1,
        question: 'Who is the President of the United States?',
        answers: { _type: 'static', choices: ['Joe Biden'] }
      },
      war: {
        questionNumber: 2,
        question: 'Name one war fought by the United States in the 1900s.',
        answers: { _type: 'static', choices: ['World War I'] }
      },
      document: {
        questionNumber: 3,
        question: 'What is the supreme law of the land?',
        answers: { _type: 'static', choices: ['the Constitution'] }
      },
      senator: {
        questionNumber: 4,
        question: 'Who is one of your state’s U.S. Senators now?',
        answers: { _type: 'senator', choices: [{ senator: 'Alex Padilla' }] }
      }
    }

    const testLayer = TestQuestionClassifierServiceLayer({
      classifyQuestion: (question: Question) => {
        if (question.question.includes('President')) return 'president'
        if (question.question.includes('war')) return 'war'
        if (question.question.includes('supreme law')) return 'document'
        if (question.answers._type === 'senator') return 'senator'
        return 'abstract'
      }
    })

    await Effect.gen(function* () {
      const service = yield* QuestionClassifierService

      expect(service.classifyQuestion(questions['president'])).toBe('president')
      expect(service.classifyQuestion(questions['war'])).toBe('war')
      expect(service.classifyQuestion(questions['document'])).toBe('document')
      expect(service.classifyQuestion(questions['senator'])).toBe('senator')
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })
})
