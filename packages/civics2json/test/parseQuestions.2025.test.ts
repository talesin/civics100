import { Effect } from 'effect'
import { describe, it, expect } from '@jest/globals'
import parseQuestionsFile from '../src/parseQuestions'

describe('parseQuestions 2025 format', () => {
  it('should parse Q98 and Q99 with section transition', async () => {
    // Minimal reproduction case: Q98, Q99, and section C header
    const text = `
AMERICAN HISTORY

B: 1800s

98. When did all men get the right to vote?
• After the Civil War
• During Reconstruction
• (With the) 15th Amendment
• 1870
99. Name one leader of the women's rights movement in the 1800s.
• Susan B. Anthony
• Elizabeth Cady Stanton
• Sojourner Truth
• Harriet Tubman
• Lucretia Mott
• Lucy Stone
C: Recent American History and Other Important Historical Information
100. Name one war fought by the United States in the 1900s.
• World War I
• World War II
`.trim()

    const result = await Effect.runPromise(parseQuestionsFile(text))

    // Should parse 3 questions: Q98, Q99, Q100
    expect(result).toHaveLength(3)

    // Verify Q98
    expect(result[0]).toBeDefined()
    expect(result[0]).toMatchObject({
      questionNumber: 98,
      section: '1800s',
      question: 'When did all men get the right to vote?'
    })
    expect(result[0]!.answers.choices).toHaveLength(4)

    // Verify Q99
    expect(result[1]).toBeDefined()
    expect(result[1]).toMatchObject({
      questionNumber: 99,
      section: '1800s',
      question: "Name one leader of the women's rights movement in the 1800s."
    })
    expect(result[1]!.answers.choices).toHaveLength(6)

    // Verify Q100 (in new section)
    expect(result[2]).toBeDefined()
    expect(result[2]).toMatchObject({
      questionNumber: 100,
      section: 'Recent American History and Other Important Historical Information',
      question: 'Name one war fought by the United States in the 1900s.'
    })
    expect(result[2]!.answers.choices).toHaveLength(2)
  })

  it('should handle bullet-point answers from 2025 format', async () => {
    const text = `
AMERICAN GOVERNMENT

A: Test Section

1. Test question?
• Answer one
• Answer two
`.trim()

    const result = await Effect.runPromise(parseQuestionsFile(text))

    expect(result).toHaveLength(1)
    expect(result[0]).toBeDefined()
    expect(result[0]!.answers.choices).toEqual(['Answer one', 'Answer two'])
  })
})
