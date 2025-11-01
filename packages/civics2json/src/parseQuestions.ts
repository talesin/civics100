import { Effect } from 'effect'
import { Question } from './types'

// Hierarchical parsing types
interface ParsedTheme {
  theme: string
  sections: readonly ParsedSection[]
}
interface ParsedSection {
  section: string
  questions: readonly ParsedQuestion[]
}
interface ParsedQuestion {
  question: string
  questionNumber: number
  answers: readonly ParsedAnswer[]
}

type ParsedAnswer = string

/**
 * Detects the expected number of answers based on question text patterns.
 * Analyzes the question text for keywords that indicate multiple answers are expected.
 * Special handling for compound answers where "and" connects parts of a single answer.
 *
 * @param questionText - The question text to analyze
 * @returns The expected number of answers (defaults to 1)
 */
const detectExpectedAnswers = (questionText: string): number => {
  const lowerQuestion = questionText.toLowerCase()

  // Special cases that expect single compound answers despite mentioning multiple items
  const singleCompoundPatterns = [
    /what are the two parts of the u\.s\. congress/,
    /what are the two parts of congress/,
    /what are the two main political parties/,
    /what are the two major political parties/, // Fix for Question 45
    /what are the two houses of congress/
  ]

  // Questions that ask for "one of" something expect only 1 answer regardless of the number mentioned
  const askForOnePatterns = [/describe one of them/, /name one of/, /what is one/, /give one/]

  // Check for "ask for one" patterns first (these override number detection)
  for (const pattern of askForOnePatterns) {
    if (pattern.test(lowerQuestion)) {
      return 1
    }
  }

  // Check for special compound answer cases
  for (const pattern of singleCompoundPatterns) {
    if (pattern.test(lowerQuestion)) {
      return 1
    }
  }

  // Look for specific number patterns
  const twoPattern =
    /\b(?:two|2)\s+(?:rights|parts|branches|ways|examples|things|reasons|amendments|types|kinds|names|national|main|major|important)\b/
  const threePattern =
    /\b(?:three|3)\s+(?:rights|parts|branches|ways|examples|things|reasons|amendments|types|kinds|names|national|main|major|important)\b/
  const fourPattern =
    /\b(?:four|4)\s+(?:rights|parts|branches|ways|examples|things|reasons|amendments|types|kinds|names|national|main|major|important)\b/
  const fivePattern =
    /\b(?:five|5)\s+(?:rights|parts|branches|ways|examples|things|reasons|amendments|types|kinds|names|national|main|major|important)\b/

  // Check for "Name three..." patterns anywhere in the question (not just at the beginning)
  if (
    threePattern.test(lowerQuestion) ||
    /^(?:name|what are|give|list)\s+three\b/.test(lowerQuestion) ||
    /\bname\s+three\b/.test(lowerQuestion) // Fix for Question 64
  ) {
    return 3
  }

  // Check for "Name two..." or "What are two..." patterns
  if (
    twoPattern.test(lowerQuestion) ||
    /^(?:name|what are|give|list)\s+two\b/.test(lowerQuestion)
  ) {
    return 2
  }

  if (
    fourPattern.test(lowerQuestion) ||
    /^(?:name|what are|give|list)\s+four\b/.test(lowerQuestion)
  ) {
    return 4
  }

  if (
    fivePattern.test(lowerQuestion) ||
    /^(?:name|what are|give|list)\s+five\b/.test(lowerQuestion)
  ) {
    return 5
  }

  // Default to 1 answer expected
  return 1
}

/**
 * Line classification result
 */
type LineClassification =
  | { readonly type: 'theme'; readonly value: string }
  | { readonly type: 'section'; readonly value: string }
  | { readonly type: 'question'; readonly value: string; readonly questionNumber: number }
  | { readonly type: 'answer'; readonly value: string }
  | { readonly type: 'empty' }
  | { readonly type: 'other' }

/**
 * Classifies a line of input as a theme, section, question, answer, empty, or other.
 * - Theme: all uppercase, not starting with '.' or a number.
 * - Section: e.g. 'A: Section Name'
 * - Question: e.g. '1. Question text'
 * - Answer: starts with '. '
 * - Empty: blank line
 * - Other: anything else
 */
const classifyLine = (line: string): LineClassification => {
  // Empty line
  if (line === '') {
    return { type: 'empty' }
  }

  // Answer line (starts with ". " for old format or "• " for new 2025 format)
  // CHECK THIS BEFORE THEME because "• 1870" would incorrectly match theme (all uppercase)
  if (line.startsWith('. ')) {
    return { type: 'answer', value: line.substring(2).trim() }
  }
  if (line.startsWith('• ')) {
    return { type: 'answer', value: line.substring(2).trim() }
  }

  // Theme line (all uppercase)
  if (line === line.toUpperCase() && !line.startsWith('.') && !line.match(/^\d+\./)) {
    return { type: 'theme', value: line.trim() }
  }

  // Section line (starts with a letter followed by a colon)
  const sectionMatch = line.match(/^([A-Z]):\s*(.+)$/)
  if (sectionMatch && typeof sectionMatch[2] === 'string') {
    return { type: 'section', value: sectionMatch[2].trim() }
  }

  // Question line (starts with a number followed by a period and space)
  const questionMatch = line.match(/^(\d+)\.\s+(.+)$/)
  if (
    questionMatch !== null &&
    typeof questionMatch[1] === 'string' &&
    typeof questionMatch[2] === 'string'
  ) {
    return {
      type: 'question',
      value: questionMatch[2].trim(),
      questionNumber: parseInt(questionMatch[1], 10)
    }
  }

  // Other line (explanatory text, etc.)
  return { type: 'other' }
}

type ParseThemesResult = { themes: readonly ParsedTheme[]; rest: readonly string[] }
/**
 * Recursively parses themes from the input lines.
 * Each theme may contain multiple sections.
 * Returns all parsed themes and any remaining lines.
 */
const parseThemes = (
  lines: readonly string[],
  themes: readonly ParsedTheme[]
): ParseThemesResult => {
  const { classification: cl, rest } = getNextClassification(lines)
  if (cl === undefined || cl.type !== 'theme' || typeof cl.value !== 'string') {
    return { themes, rest: lines }
  }

  const themeName = cl.value
  const { sections, rest: afterSections } = parseSections(rest, [])
  return parseThemes(afterSections, [...themes, { theme: themeName, sections }])
}

type ParseSectionsResult = { sections: readonly ParsedSection[]; rest: readonly string[] }
/**
 * Recursively parses sections from the input lines within a theme.
 * Each section may contain multiple questions.
 * Returns all parsed sections and any remaining lines.
 */
const parseSections = (
  lines: readonly string[],
  sections: readonly ParsedSection[]
): ParseSectionsResult => {
  const { classification: cl, rest } = getNextClassification(lines)
  if (cl === undefined || cl.type !== 'section' || typeof cl.value !== 'string') {
    return { sections, rest: lines }
  }

  const sectionName = cl.value
  const { questions, rest: afterQuestions } = parseQuestions(rest, [])
  return parseSections(afterQuestions, [...sections, { section: sectionName, questions }])
}

type ParseQuestionsResult = { questions: readonly ParsedQuestion[]; rest: readonly string[] }
/**
 * Recursively parses questions from the input lines within a section.
 * Each question may contain multiple answers.
 * Handles multi-line questions by accumulating continuation lines.
 * Returns all parsed questions and any remaining lines.
 */
const parseQuestions = (
  lines: readonly string[],
  questions: readonly ParsedQuestion[]
): ParseQuestionsResult => {
  const { classification: cl, rest } = getNextClassification(lines)
  if (
    cl === undefined ||
    cl.type !== 'question' ||
    typeof cl.value !== 'string' ||
    typeof cl.questionNumber !== 'number'
  ) {
    return { questions, rest: lines }
  }

  let questionName = cl.value
  const questionNumber = cl.questionNumber

  // Handle multi-line questions: accumulate lines until we hit an answer, question, section, or theme
  let continuationLines = rest
  while (continuationLines.length > 0) {
    const [nextLine, ...remaining] = continuationLines
    if (nextLine === undefined) break

    const nextCl = classifyLine(nextLine)
    // If it's an "other" line, it's a continuation of the question
    if (nextCl.type === 'other' && nextLine.trim().length > 0) {
      questionName = questionName + ' ' + nextLine.trim()
      continuationLines = remaining
    } else {
      // Hit something else, stop accumulating
      break
    }
  }

  const { answers, rest: afterAnswers } = parseAnswers(continuationLines, [])
  return parseQuestions(afterAnswers, [
    ...questions,
    { question: questionName, questionNumber, answers }
  ])
}

/**
 * Helper function to classify the first line of the input and return the rest.
 * Returns the classification and the remaining lines.
 */
const getNextClassification = (
  lines: readonly string[]
): { classification: LineClassification | undefined; rest: readonly string[] } => {
  const [firstLine, ...rest] = lines
  const classification = firstLine === undefined ? undefined : classifyLine(firstLine)

  if (classification?.type === 'empty' || classification?.type === 'other') {
    return getNextClassification(rest)
  }

  return { classification, rest }
}

type ParseAnswersResult = { answers: readonly ParsedAnswer[]; rest: readonly string[] }
/**
 * Recursively parses answers for a question from the input lines.
 * Returns all parsed answers and any remaining lines.
 */
const parseAnswers = (
  lines: readonly string[],
  answers: readonly ParsedAnswer[]
): ParseAnswersResult => {
  const { classification: cl, rest } = getNextClassification(lines)
  return cl === undefined || cl.type !== 'answer' || typeof cl.value !== 'string'
    ? { answers, rest: lines }
    : parseAnswers(rest, [...answers, cl.value])
}

/**
 * Cleans PDF page markers from extracted text.
 * Removes patterns like ",15 of 19uscis.gov/citizenship" that appear in PDF extractions.
 */
const cleanPdfPageMarkers = (text: string): string => {
  // Remove page markers like ",15 of 19uscis.gov/citizenship" or "1 of 19uscis.gov/citizenship"
  // This handles both inline markers (with comma) and standalone markers
  return text
    .replace(/,\d+\s+of\s+\d+uscis\.gov\/citizenship/g, '') // Inline with comma
    .replace(/^\d+\s+of\s+\d+uscis\.gov\/citizenship$/gm, '') // Standalone lines
    .replace(/\d+\s+of\s+\d+uscis\.gov\/citizenship/g, '') // Any remaining markers
}

/**
 * Parses a civics questions file (string) into a flat array of Question objects.
 * Handles themes, sections, questions, and answers, flattening the hierarchy.
 * Returns an Effect that yields the parsed questions.
 */
export const parseQuestionsFile = (
  text: string,
  _options?: { skipValidation?: boolean }
): Effect.Effect<readonly Question[]> => {
  return Effect.sync(() => {
    // Clean PDF page markers before parsing
    const cleanedText = cleanPdfPageMarkers(text)

    const lines = cleanedText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    const { themes } = parseThemes(lines, [])
    // Flatten
    const questions: Question[] = themes.flatMap((theme) =>
      theme.sections.flatMap((section) =>
        section.questions.map((question) => ({
          theme: theme.theme,
          section: section.section,
          question: question.question,
          questionNumber: question.questionNumber,
          expectedAnswers: detectExpectedAnswers(question.question),
          answers: { _type: 'text', choices: question.answers }
        }))
      )
    )
    return questions
  })
}

export default parseQuestionsFile
