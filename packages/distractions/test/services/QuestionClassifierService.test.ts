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
        theme: 'AMERICAN GOVERNMENT',
        section: 'System of Government',
        questionNumber: 1,
        expectedAnswers: 1,
        question: 'Who is the President of the United States?',
        answers: { _type: 'text', choices: ['Joe Biden'] }
      },
      war: {
        theme: 'AMERICAN HISTORY',
        section: 'Colonial Period and Independence',
        questionNumber: 2,
        expectedAnswers: 1,
        question: 'Name one war fought by the United States in the 1900s.',
        answers: { _type: 'text', choices: ['World War I'] }
      },
      document: {
        theme: 'AMERICAN GOVERNMENT',
        section: 'Principles of American Democracy',
        questionNumber: 3,
        expectedAnswers: 1,
        question: 'What is the supreme law of the land?',
        answers: { _type: 'text', choices: ['the Constitution'] }
      },
      senator: {
        theme: 'AMERICAN GOVERNMENT',
        section: 'System of Government',
        questionNumber: 4,
        expectedAnswers: 1,
        question: "Who is one of your state's U.S. Senators now?",
        answers: { _type: 'senator', choices: [{ senator: 'Alex Padilla', state: 'CA' }] }
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

      const presidentQ = questions['president']
      const warQ = questions['war']
      const documentQ = questions['document']
      const senatorQ = questions['senator']

      if (presidentQ) expect(service.classifyQuestion(presidentQ)).toBe('president')
      if (warQ) expect(service.classifyQuestion(warQ)).toBe('war')
      if (documentQ) expect(service.classifyQuestion(documentQ)).toBe('document')
      if (senatorQ) expect(service.classifyQuestion(senatorQ)).toBe('senator')
    }).pipe(Effect.provide(testLayer), Effect.runPromise)
  })
})
