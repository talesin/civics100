import { Effect, Console, Option, Layer } from 'effect'
import questionsWithDistractors from 'distractions'
import type { StateAbbreviation } from 'civics2json'
import { QuestionNumber, type Answers, type Question } from '../types'
import { QuestionSelector } from '../QuestionSelector'
import { QuestionDataService } from '../QuestionDataService'

/**
 * State for the game including loaded questions and user answers
 */
export type GameState = {
  questions: ReadonlyArray<Question>
  answers: Answers
  currentQuestion: Option.Option<Question>
}

/**
 * Initialize the game state by loading questions from data sources
 */
const initializeGame = (
  questionDataService: QuestionDataService,
  userState: StateAbbreviation
): Effect.Effect<GameState, never, never> => {
  return Effect.gen(function* () {
    const questions = yield* questionDataService.loadQuestions({
      questions: questionsWithDistractors,
      userState
    })

    return {
      questions,
      answers: {},
      currentQuestion: Option.none()
    }
  })
}

/**
 * Record a user's answer to a question
 */
const recordAnswer = (
  questionNumber: QuestionNumber,
  isCorrect: boolean,
  answers: Answers
): Answers => {
  const currentHistory = answers[questionNumber] ?? []
  const newEntry = { ts: new Date(), correct: isCorrect }

  return {
    ...answers,
    [questionNumber]: [...currentHistory, newEntry]
  }
}

/**
 * Display a question with its answer choices
 */
const displayQuestion = (question: Question): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    yield* Console.log(`\n✏️ Question ${question.questionNumber}:`)
    yield* Console.log(question.question)
    yield* Console.log('')

    for (let i = 0; i < question.answers.length; i++) {
      const letter = String.fromCharCode(65 + i) // A, B, C, D...
      yield* Console.log(`${letter}. ${question.answers[i]}`)
    }

    yield* Console.log('')
  })
}

/**
 * Get the next question to ask based on weighted selection
 */
const getNextQuestion = (
  state: GameState,
  questionDataService: QuestionDataService,
  questionSelector: QuestionSelector
): Effect.Effect<Option.Option<Question>, never, never> => {
  return Effect.gen(function* () {
    const availableNumbers = questionDataService.getAvailableQuestionNumbers(state.questions)
    const selectedNumber = yield* questionSelector.selectQuestion(availableNumbers, state.answers)

    return Option.match(selectedNumber, {
      onNone: () => Option.none(),
      onSome: (questionNumber) =>
        questionDataService.findQuestionByNumber(questionNumber, state.questions)
    })
  })
}

/**
 * Display game statistics
 */
const displayStats = (state: GameState): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    const totalQuestions = state.questions.length
    const answeredQuestions = Object.keys(state.answers).length
    const totalAnswers = Object.values(state.answers).reduce(
      (sum, history) => sum + history.length,
      0
    )
    const correctAnswers = Object.values(state.answers)
      .flat()
      .filter((answer) => answer.correct).length

    const accuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0

    yield* Console.log(`
📊 Statistics:
Questions available: ${totalQuestions}
Questions attempted: ${answeredQuestions}
Total answers: ${totalAnswers}
Correct answers: ${correctAnswers}
Accuracy: ${accuracy.toFixed(1)}%
`)
  })
}

/**
 * Process a user's answer input
 */
const processAnswer = (
  userInput: string,
  question: Question,
  state: GameState,
  questionSelector: QuestionSelector
): Effect.Effect<GameState, never, never> => {
  return Effect.gen(function* () {
    const answerIndex = userInput.toUpperCase().charCodeAt(0) - 65 // A=0, B=1, etc.

    if (answerIndex < 0 || answerIndex >= question.answers.length) {
      yield* Console.log('❌ Invalid answer. Please enter A, B, C, or D.')
      return state
    }

    const isCorrect = answerIndex === question.correctAnswer
    const correctLetter = String.fromCharCode(65 + question.correctAnswer)

    if (isCorrect) {
      yield* Console.log('✅ Correct!')
    } else {
      yield* Console.log(`❌ Incorrect. The correct answer was ${correctLetter}.`)
    }

    const newAnswers = recordAnswer(question.questionNumber, isCorrect, state.answers)

    const stats = questionSelector.getQuestionStats(question.questionNumber, newAnswers)
    yield* Console.log(
      `Question stats - Answered: ${stats.totalAnswered}, Accuracy: ${(stats.accuracy * 100).toFixed(1)}%`
    )

    return {
      ...state,
      answers: newAnswers,
      currentQuestion: Option.none()
    }
  })
}

/**
 * Service for managing game flow and user interactions
 */
export class GameService extends Effect.Service<GameService>()('GameService', {
  effect: Effect.gen(function* () {
    const questionDataService = yield* QuestionDataService
    const questionSelector = yield* QuestionSelector

    return {
      initializeGame: (userState: StateAbbreviation) =>
        initializeGame(questionDataService, userState),
      getNextQuestion: (state: GameState) =>
        getNextQuestion(state, questionDataService, questionSelector),
      displayQuestion: (question: Question) => displayQuestion(question),
      displayStats: (state: GameState) => displayStats(state),
      processAnswer: (userInput: string, question: Question, state: GameState) =>
        processAnswer(userInput, question, state, questionSelector)
    }
  }),
  dependencies: [QuestionDataService.Default, QuestionSelector.Default]
}) {}

/**
 * Test layer for GameService with mockable functions
 */
export const TestGameServiceLayer = (fn?: {
  initializeGame?: (userState: StateAbbreviation) => Effect.Effect<GameState, never, never>
  getNextQuestion?: (state: GameState) => Effect.Effect<Option.Option<Question>, never, never>
  displayQuestion?: (question: Question) => Effect.Effect<void, never, never>
  displayStats?: (state: GameState) => Effect.Effect<void, never, never>
  processAnswer?: (
    userInput: string,
    question: Question,
    state: GameState
  ) => Effect.Effect<GameState, never, never>
}) =>
  Layer.succeed(
    GameService,
    GameService.of({
      _tag: 'GameService',
      initializeGame:
        fn?.initializeGame ??
        ((_userState: StateAbbreviation) =>
          Effect.succeed({
            questions: [],
            answers: {},
            currentQuestion: Option.none()
          })),
      getNextQuestion: fn?.getNextQuestion ?? (() => Effect.succeed(Option.none())),
      displayQuestion: fn?.displayQuestion ?? (() => Effect.void),
      displayStats: fn?.displayStats ?? (() => Effect.void),
      processAnswer: fn?.processAnswer ?? ((_userInput, _question, state) => Effect.succeed(state))
    })
  )
