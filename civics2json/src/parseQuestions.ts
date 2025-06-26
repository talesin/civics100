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
  number: number
  answers: readonly ParsedAnswer[]
}

type ParsedAnswer = string

/**
 * Line classification result
 */
type LineClassification =
  | { readonly type: 'theme'; readonly value: string }
  | { readonly type: 'section'; readonly value: string }
  | { readonly type: 'question'; readonly value: string; readonly number: number }
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
      number: parseInt(questionMatch[1], 10)
    }
  }

  // Answer line (starts with ". ")
  if (line.startsWith('. ')) {
    return { type: 'answer', value: line.substring(2).trim() }
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
    typeof cl.number !== 'number'
  ) {
    return { questions, rest: lines }
  }

  const questionName = cl.value
  const questionNumber = cl.number
  const { answers, rest: afterAnswers } = parseAnswers(rest, [])
  return parseQuestions(afterAnswers, [
    ...questions,
    { question: questionName, number: questionNumber, answers }
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
 * Parses a civics questions file (string) into a flat array of Question objects.
 * Handles themes, sections, questions, and answers, flattening the hierarchy.
 * Returns an Effect that yields the parsed questions.
 */
export const parseQuestionsFile = (
  text: string,
  _options?: { skipValidation?: boolean }
): Effect.Effect<readonly Question[]> => {
  return Effect.sync(() => {
    const lines = text
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
          questionNumber: question.number,
          answers: { _type: 'text', choices: question.answers }
        }))
      )
    )
    return questions
  })
}

export default parseQuestionsFile
