import * as Effect from 'effect/Effect'
import type { Question } from 'civics2json'

// Validation result types
export interface ValidationResult {
  readonly isValid: boolean
  readonly score: number
  readonly reasons: readonly string[]
}

// Quality validation helpers
export const validateDistractorLength = (
  distractor: string,
  minLength: number = 3,
  maxLength: number = 200
): ValidationResult => {
  const trimmed = distractor.trim()
  const length = trimmed.length
  
  if (length < minLength) {
    return {
      isValid: false,
      score: 0,
      reasons: [`Too short: ${length} characters (minimum ${minLength})`]
    }
  }
  
  if (length > maxLength) {
    return {
      isValid: false,
      score: 0,
      reasons: [`Too long: ${length} characters (maximum ${maxLength})`]
    }
  }
  
  return {
    isValid: true,
    score: 1.0,
    reasons: []
  }
}

export const validateDistractorCompleteness = (distractor: string): ValidationResult => {
  const trimmed = distractor.trim()
  const reasons: string[] = []
  
  // Check for common fragment patterns
  const fragmentPatterns = [
    { pattern: /^[a-z]/, reason: 'Starts with lowercase (likely a fragment)' },
    { pattern: /\(\s*$/, reason: 'Ends with open parenthesis' },
    { pattern: /^\s*\)/, reason: 'Starts with close parenthesis' },
    { pattern: /[,;]\s*$/, reason: 'Ends with comma or semicolon' },
    { pattern: /^\s*[,;]/, reason: 'Starts with comma or semicolon' },
    { pattern: /\s{2,}/, reason: 'Contains multiple consecutive spaces' }
  ]
  
  for (const { pattern, reason } of fragmentPatterns) {
    if (pattern.test(trimmed)) {
      reasons.push(reason)
    }
  }
  
  const isValid = reasons.length === 0
  const score = isValid ? 1.0 : Math.max(0, 1.0 - (reasons.length * 0.2))
  
  return {
    isValid,
    score,
    reasons
  }
}

export const validateSemanticRelevance = (
  distractor: string,
  question: Question
): ValidationResult => {
  const distractorLower = distractor.toLowerCase()
  const questionLower = question.question.toLowerCase()
  const theme = question.theme.toLowerCase()
  const section = question.section.toLowerCase()
  
  const reasons: string[] = []
  let relevanceScore = 0.5 // Base score
  
  // Check for question type specific patterns
  const answerType = question.answers._type
  
  switch (answerType) {
    case 'text':
      // For text answers, check thematic relevance
      if (theme.includes('constitution') && 
          (distractorLower.includes('constitution') || 
           distractorLower.includes('amendment') ||
           distractorLower.includes('right'))) {
        relevanceScore += 0.3
      } else if (theme.includes('history') &&
                 (distractorLower.includes('war') ||
                  distractorLower.includes('president') ||
                  distractorLower.includes('year'))) {
        relevanceScore += 0.3
      }
      break
      
    case 'senator':
    case 'representative':
    case 'governor':
      // Political figures should look like names
      if (/^[A-Z][a-z]+ [A-Z]/.test(distractor)) {
        relevanceScore += 0.4
      } else {
        reasons.push('Does not match expected name format for political figure')
        relevanceScore -= 0.2
      }
      break
      
    case 'capital':
      // Capitals should look like proper place names
      if (/^[A-Z]/.test(distractor) && !distractorLower.includes('the ')) {
        relevanceScore += 0.3
      } else {
        reasons.push('Does not match expected format for capital city')
        relevanceScore -= 0.2
      }
      break
  }
  
  // Penalize if distractor is too similar to question
  if (questionLower.includes(distractorLower) || distractorLower.includes(questionLower)) {
    reasons.push('Too similar to question text')
    relevanceScore -= 0.5
  }
  
  const finalScore = Math.max(0, Math.min(1, relevanceScore))
  const isValid = finalScore >= 0.3 && reasons.length === 0
  
  return {
    isValid,
    score: finalScore,
    reasons
  }
}

export const validateDistractorFormat = (
  distractor: string,
  correctAnswers: readonly string[]
): ValidationResult => {
  const reasons: string[] = []
  let formatScore = 1.0
  
  // Analyze format patterns in correct answers
  const hasParentheses = correctAnswers.some(answer => 
    answer.includes('(') && answer.includes(')')
  )
  const avgWordCount = correctAnswers.reduce((sum, answer) => 
    sum + answer.split(' ').length, 0
  ) / correctAnswers.length
  const hasArticles = correctAnswers.some(answer => 
    /^(the|a|an)\s/i.test(answer)
  )
  
  const distractorWordCount = distractor.split(' ').length
  const hasDistractorArticle = /^(the|a|an)\s/i.test(distractor)
  
  // Check word count similarity - more lenient for testing
  if (Math.abs(distractorWordCount - avgWordCount) > avgWordCount) {
    reasons.push(`Word count mismatch: ${distractorWordCount} vs average ${avgWordCount.toFixed(1)}`)
    formatScore -= 0.2
  }
  
  // Check article consistency
  if (hasArticles && !hasDistractorArticle) {
    reasons.push('Missing article (the, a, an) when correct answers have them')
    formatScore -= 0.1
  } else if (!hasArticles && hasDistractorArticle) {
    reasons.push('Has article when correct answers do not')
    formatScore -= 0.1
  }
  
  const finalScore = Math.max(0, formatScore)
  const isValid = finalScore >= 0.7
  
  return {
    isValid,
    score: finalScore,
    reasons
  }
}

// Composite validation function
export const validateDistractor = (
  distractor: string,
  question: Question,
  correctAnswers: readonly string[],
  options: {
    minLength?: number
    maxLength?: number
    requireCompleteness?: boolean
    requireSemanticRelevance?: boolean
    requireFormatMatch?: boolean
  } = {}
) => Effect.gen(function* () {
  const {
    minLength = 3,
    maxLength = 200,
    requireCompleteness = true,
    requireSemanticRelevance = true,
    requireFormatMatch = true
  } = options
  
  const results: ValidationResult[] = []
  
  // Length validation
  results.push(validateDistractorLength(distractor, minLength, maxLength))
  
  // Completeness validation
  if (requireCompleteness) {
    results.push(validateDistractorCompleteness(distractor))
  }
  
  // Semantic relevance validation
  if (requireSemanticRelevance) {
    results.push(validateSemanticRelevance(distractor, question))
  }
  
  // Format validation
  if (requireFormatMatch) {
    results.push(validateDistractorFormat(distractor, correctAnswers))
  }
  
  // Combine results
  const allValid = results.every(result => result.isValid)
  const avgScore = results.reduce((sum, result) => sum + result.score, 0) / results.length
  const allReasons = results.flatMap(result => result.reasons)
  
  return {
    isValid: allValid,
    score: avgScore,
    reasons: allReasons
  }
})