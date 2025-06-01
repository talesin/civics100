import { Effect } from 'effect'

/**
 * Represents a single question and answer set from the civics test
 */
export type QA = {
  readonly theme: string
  readonly section: string
  readonly question: string
  readonly answers: readonly string[]
}

/**
 * Intermediate state during the parsing process
 */
type ParsingState = {
  readonly questions: readonly QA[]
  readonly currentTheme: string
  readonly currentSection: string
  readonly currentAnswers: readonly string[]
  readonly currentQuestion: string | null
  readonly inError: boolean
  readonly errorMessage: string | null
}

/**
 * Line classification result
 */
type LineClassification =
  | { readonly type: 'theme'; readonly value: string }
  | { readonly type: 'section'; readonly value: string }
  | { readonly type: 'question'; readonly value: string }
  | { readonly type: 'answer'; readonly value: string }
  | { readonly type: 'empty' }
  | { readonly type: 'other' }

/**
 * Classifies a line of text from the input
 */
const classifyLine = (line: string): LineClassification => {
  // Empty line
  if (line === '') {
    return { type: 'empty' }
  }

  // Theme line (all uppercase)
  if (line === line.toUpperCase() && !line.startsWith('.') && !line.match(/^\d+\./)) {
    return { type: 'theme', value: line }
  }

  // Section line (starts with a letter followed by a colon)
  if (line.match(/^[A-Z]:/)) {
    return { type: 'section', value: line }
  }

  // Question line (starts with a number followed by a period and space)
  const questionMatch = line.match(/^(\d+)\.\s+(.+)$/)
  if (questionMatch && typeof questionMatch[2] === 'string') {
    return { type: 'question', value: questionMatch[2] }
  }

  // Answer line (starts with ". ")
  if (line.startsWith('. ')) {
    return { type: 'answer', value: line.substring(2) }
  }

  // Other line (explanatory text, etc.)
  return { type: 'other' }
}

/**
 * Processes a line and updates the parsing state
 */
const processLine = (state: ParsingState, line: string, index: number): ParsingState => {
  // If we're already in an error state, just return the current state
  if (state.inError) {
    return state
  }

  const classification = classifyLine(line)

  switch (classification.type) {
    case 'empty':
    case 'other':
      // Skip empty lines and other text
      return state

    case 'theme':
      return {
        ...state,
        currentTheme: classification.value
      }

    case 'section':
      return {
        ...state,
        currentSection: classification.value
      }

    case 'question': {
      // If we have a current question in progress, finalize it first
      const updatedQuestions =
        state.currentQuestion !== null
          ? [
              ...state.questions,
              {
                theme: state.currentTheme,
                section: state.currentSection,
                question: state.currentQuestion,
                answers: state.currentAnswers
              }
            ]
          : state.questions

      return {
        ...state,
        questions: updatedQuestions,
        currentQuestion: classification.value,
        currentAnswers: []
      }
    }

    case 'answer':
      // If we don't have a current question, this is an error
      if (state.currentQuestion === null) {
        return {
          ...state,
          inError: true,
          errorMessage: `Found answer without a question at line ${index + 1}: ${line}`
        }
      }

      return {
        ...state,
        currentAnswers: [...state.currentAnswers, classification.value]
      }
  }
}

/**
 * Finalizes the parsing state by adding the last question if needed
 */
const finalizeParsingState = (state: ParsingState): ParsingState => {
  if (state.inError || state.currentQuestion === null) {
    return state
  }

  return {
    ...state,
    questions: [
      ...state.questions,
      {
        theme: state.currentTheme,
        section: state.currentSection,
        question: state.currentQuestion,
        answers: state.currentAnswers
      }
    ],
    currentQuestion: null,
    currentAnswers: []
  }
}

/**
 * Parses the 100 civics questions text into a structured array of question objects
 *
 * @param text - The full text content of the 100q.txt file
 * @returns An Effect that resolves to an array of 100 QA objects or fails with an error message
 */
export const parseQuestions = (text: string): Effect.Effect<readonly QA[], string> => {
  return Effect.try({
    try: (): readonly QA[] => {
      // Split the text into lines and remove any leading/trailing whitespace
      const lines = text.split('\n').map((line) => line.trim())

      // Initial state
      const initialState: ParsingState = {
        questions: [],
        currentTheme: '',
        currentSection: '',
        currentAnswers: [],
        currentQuestion: null,
        inError: false,
        errorMessage: null
      }

      // Process each line and build up the state
      const finalState = lines.reduce(
        (state, line, index) => processLine(state, line, index),
        initialState
      )

      // Add the last question if there is one
      const completedState = finalizeParsingState(finalState)

      // Check for errors during parsing
      if (completedState.inError && completedState.errorMessage !== null) {
        throw new Error(completedState.errorMessage)
      }

      // Validate that we found exactly 100 questions
      if (completedState.questions.length !== 100) {
        throw new Error(
          `Expected to find exactly 100 questions, but found ${completedState.questions.length}`
        )
      }

      return completedState.questions
    },
    catch: (error: unknown) => {
      if (error instanceof Error) {
        return `Error parsing questions: ${error.message}`
      }
      return `Unknown error parsing questions: ${String(error)}`
    }
  })
}

export default parseQuestions
