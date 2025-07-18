import { describe, it, expect } from '@jest/globals'

// Direct test of validation logic without full service dependencies
const validateAnswerSelection = (
  selectedAnswers: number | ReadonlyArray<number>,
  correctAnswer: number | ReadonlyArray<number>,
  expectedAnswers?: number
): boolean => {
  // Handle legacy single answer format
  if (typeof selectedAnswers === 'number' && typeof correctAnswer === 'number') {
    return selectedAnswers === correctAnswer
  }

  // Handle multiple answer format
  const selectedArray = Array.isArray(selectedAnswers) ? selectedAnswers : [selectedAnswers]
  const correctArray = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]

  // Check if we have the expected number of answers
  if (expectedAnswers !== undefined && selectedArray.length !== expectedAnswers) {
    return false
  }

  // For multiple answers, check if all selected answers are correct
  // Note: For questions with multiple correct options (like Cabinet positions),
  // users only need to select the expected number of correct answers, not all correct answers
  return selectedArray.every((answer) => correctArray.includes(answer))
}

describe('GameService', () => {
  describe('validateAnswerSelection', () => {
    it('should validate single answer correctly', () => {
      // Single correct answer
      expect(validateAnswerSelection(0, 0)).toBe(true)
      expect(validateAnswerSelection(1, 0)).toBe(false)
    })

    it('should validate multiple answers correctly', () => {
      // Two correct answers
      expect(validateAnswerSelection([0, 2], [0, 2], 2)).toBe(true)
      expect(validateAnswerSelection([0, 1], [0, 2], 2)).toBe(false)
      expect(validateAnswerSelection([0], [0, 2], 2)).toBe(false) // Too few answers
      expect(validateAnswerSelection([0, 1, 2], [0, 2], 2)).toBe(false) // Too many answers
      
      // Validate with multiple correct options (like Cabinet positions)
      expect(validateAnswerSelection([1, 3], [0, 1, 2, 3, 4], 2)).toBe(true) // Any 2 from many correct
      expect(validateAnswerSelection([0, 4], [0, 1, 2, 3, 4], 2)).toBe(true) // Any 2 from many correct
      expect(validateAnswerSelection([1, 5], [0, 1, 2, 3, 4], 2)).toBe(false) // One invalid choice
    })

    it('should handle mixed format correctly', () => {
      // Single answer as array vs number
      expect(validateAnswerSelection([0], 0)).toBe(true)
      expect(validateAnswerSelection(0, [0])).toBe(true)
    })

    it('should validate expected answer count', () => {
      // Wrong number of selections
      expect(validateAnswerSelection([0], [0, 1], 2)).toBe(false)
      expect(validateAnswerSelection([0, 1, 2], [0, 1], 2)).toBe(false)

      // Correct number of selections
      expect(validateAnswerSelection([0, 1], [0, 1], 2)).toBe(true)
    })

    it('should handle order independence', () => {
      // Order should not matter for multiple answers
      expect(validateAnswerSelection([1, 0], [0, 1], 2)).toBe(true)
      expect(validateAnswerSelection([2, 0, 1], [0, 1, 2], 3)).toBe(true)
    })
  })
})
