import { QuestionNumber } from '@src/types'

describe('QuestionNumber', () => {
  it('should create a valid QuestionNumber', () => {
    const questionNumber = QuestionNumber('1')
    expect(questionNumber).toBe('1')
  })

  it('should be a branded type', () => {
    const questionNumber = QuestionNumber('42')
    expect(typeof questionNumber).toBe('string')
    expect(questionNumber).toBe('42')
  })
})
