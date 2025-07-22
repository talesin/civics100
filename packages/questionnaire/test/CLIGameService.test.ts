import { describe, it, expect } from '@jest/globals'

// Test the CLI answer parsing logic directly
const parseAnswerInput = (userInput: string, maxAnswers: number): number[] | null => {
  const cleanInput = userInput.trim().toUpperCase()

  // Handle single answer (e.g., "A")
  if (cleanInput.length === 1) {
    const answerIndex = cleanInput.charCodeAt(0) - 65 // A=0, B=1, etc.
    if (answerIndex >= 0 && answerIndex < maxAnswers) {
      return [answerIndex]
    }
    return null
  }

  // Handle multiple answers (e.g., "A,C" or "A, C")
  const parts = cleanInput.split(',').map((part) => part.trim())
  const indices: number[] = []

  for (const part of parts) {
    if (part.length !== 1) {
      return null
    }
    const answerIndex = part.charCodeAt(0) - 65
    if (answerIndex < 0 || answerIndex >= maxAnswers) {
      return null
    }
    if (indices.includes(answerIndex)) {
      return null // Duplicate answer
    }
    indices.push(answerIndex)
  }

  return indices.sort()
}

describe('CLI Answer Parsing', () => {
  describe('parseAnswerInput', () => {
    it('should parse single letter input correctly', () => {
      expect(parseAnswerInput('A', 4)).toEqual([0])
      expect(parseAnswerInput('B', 4)).toEqual([1])
      expect(parseAnswerInput('a', 4)).toEqual([0])
      expect(parseAnswerInput('d', 4)).toEqual([3])
    })

    it('should reject invalid single letter input', () => {
      expect(parseAnswerInput('E', 4)).toBeNull()
      expect(parseAnswerInput('Z', 4)).toBeNull()
      expect(parseAnswerInput('1', 4)).toBeNull()
    })

    it('should parse comma-separated input correctly', () => {
      expect(parseAnswerInput('A,C', 4)).toEqual([0, 2])
      expect(parseAnswerInput('B,D', 4)).toEqual([1, 3])
      expect(parseAnswerInput('A, C', 4)).toEqual([0, 2])
      expect(parseAnswerInput('a,c', 4)).toEqual([0, 2])
    })

    it('should sort multiple answers', () => {
      expect(parseAnswerInput('C,A', 4)).toEqual([0, 2])
      expect(parseAnswerInput('D,B,A', 4)).toEqual([0, 1, 3])
    })

    it('should reject duplicate answers', () => {
      expect(parseAnswerInput('A,A', 4)).toBeNull()
      expect(parseAnswerInput('B,C,B', 4)).toBeNull()
    })

    it('should reject invalid letters in multiple selection', () => {
      expect(parseAnswerInput('A,E', 4)).toBeNull()
      expect(parseAnswerInput('B,Z', 4)).toBeNull()
      expect(parseAnswerInput('A,1', 4)).toBeNull()
    })

    it('should handle empty or invalid input', () => {
      expect(parseAnswerInput('', 4)).toBeNull()
      expect(parseAnswerInput(' ', 4)).toBeNull()
      expect(parseAnswerInput(',', 4)).toBeNull()
      expect(parseAnswerInput('AB', 4)).toBeNull()
    })

    it('should respect max answers limit', () => {
      expect(parseAnswerInput('A', 1)).toEqual([0])
      expect(parseAnswerInput('B', 1)).toBeNull()
      expect(parseAnswerInput('A', 3)).toEqual([0])
      expect(parseAnswerInput('D', 3)).toBeNull()
    })

    it('should handle complex multiple selections', () => {
      expect(parseAnswerInput('A,B,C', 4)).toEqual([0, 1, 2])
      expect(parseAnswerInput('D,C,B,A', 4)).toEqual([0, 1, 2, 3])
      expect(parseAnswerInput('B, D, A', 4)).toEqual([0, 1, 3])
    })
  })
})
