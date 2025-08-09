import { describe, it, expect } from '@jest/globals'
import { CuratedDistractorDatabase } from '@src/index'
import {
  getAllCuratedQuestions,
  getCuratedEntry,
  getDistractorsForQuestion,
  hasDistractorsForQuestion
} from '@src/services/CuratedDistractorService'
import { Question } from 'civics2json'

const mockQuestion = (questionNumber: number): Question => ({
  questionNumber,
  question: `Question ${questionNumber}`,
  answers: { _type: 'text', choices: ['Answer'] },
  theme: 'Test Theme',
  section: 'Test Section',
  expectedAnswers: 1
})

const mockDatabase: CuratedDistractorDatabase = {
  '1': {
    question: 'What is the supreme law of the land?',
    answerType: 'document',
    correctAnswers: ['the Constitution'],
    curatedDistractors: [
      'the Declaration of Independence',
      'the Bill of Rights',
      'the Articles of Confederation',
      'the Federalist Papers'
    ],
    rationale: 'Other foundational American documents'
  }
}

describe('CuratedDistractorService', () => {
  it('should retrieve curated distractors for a given question', () => {
    // Question 1 is known to have curated distractors
    const question = mockQuestion(1)
    const distractors = getDistractorsForQuestion(mockDatabase)(question)
    expect(distractors).toBeInstanceOf(Array)
    expect(distractors.length).toBeGreaterThan(0)
    expect(distractors).toContain('the Declaration of Independence')
  })

  it('should return an empty array if no distractors are found', () => {
    // Using a question number that does not exist in the curated database
    const question = mockQuestion(999)
    const distractors = getDistractorsForQuestion(mockDatabase)(question)
    expect(distractors).toEqual([])
  })

  it('should check if distractors exist for a question', () => {
    const questionWithDistractors = mockQuestion(1)
    const questionWithoutDistractors = mockQuestion(999)

    const hasDistractors = hasDistractorsForQuestion(mockDatabase)(questionWithDistractors)
    const hasNoDistractors = hasDistractorsForQuestion(mockDatabase)(questionWithoutDistractors)

    expect(hasDistractors).toBe(true)
    expect(hasNoDistractors).toBe(false)
  })

  it('should retrieve the curated entry for a question', () => {
    const question = mockQuestion(1)
    const entry = getCuratedEntry(mockDatabase)(question)

    expect(entry).toBeDefined()
    expect(entry?.question).toEqual('What is the supreme law of the land?')
  })

  it('should retrieve all curated question keys', () => {
    const allKeys = getAllCuratedQuestions(mockDatabase)()
    expect(allKeys.length).toBeGreaterThan(0)
    expect(allKeys).toContain('1')
  })
})
