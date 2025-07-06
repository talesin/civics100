import { Effect, Console, Option } from 'effect'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import type { Question as CivicsQuestion } from 'civics2json'
import questionsWithDistractors from 'distractions'
import civicsQuestions from 'civics2json/Questions'
import { QuestionNumber, type Answers, type Question } from '../types'
import { selectQuestion, getQuestionStats } from '../QuestionSelector'
import {
  loadQuestions,
  findQuestionByNumber,
  getAvailableQuestionNumbers
} from '../QuestionDataService'

type CLIState = {
  questions: ReadonlyArray<Question>
  answers: Answers
  currentQuestion: Option.Option<Question>
}

const createInitialState = (): Effect.Effect<CLIState, never, never> => {
  return Effect.gen(function* () {
    const questions = yield* loadQuestions({
      civicsQuestions: civicsQuestions as ReadonlyArray<CivicsQuestion>,
      questionsWithDistractors
    })

    return {
      questions,
      answers: {},
      currentQuestion: Option.none()
    }
  })
}

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

const displayQuestion = (question: Question): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    yield* Console.log(`\\n📝 Question ${question.questionNumber}:`)
    yield* Console.log(question.question)
    yield* Console.log('')

    for (let i = 0; i < question.answers.length; i++) {
      const letter = String.fromCharCode(65 + i) // A, B, C, D...
      yield* Console.log(`${letter}. ${question.answers[i]}`)
    }

    yield* Console.log('')
  })
}

const getNextQuestion = (state: CLIState): Effect.Effect<Option.Option<Question>, never, never> => {
  return Effect.gen(function* () {
    const availableNumbers = getAvailableQuestionNumbers(state.questions)
    const selectedNumber = yield* selectQuestion(availableNumbers, state.answers)

    return Option.match(selectedNumber, {
      onNone: () => Option.none(),
      onSome: (questionNumber) => findQuestionByNumber(questionNumber, state.questions)
    })
  })
}

const displayStats = (state: CLIState): Effect.Effect<void, never, never> => {
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

    yield* Console.log('\\n📊 Statistics:')
    yield* Console.log(`Questions available: ${totalQuestions}`)
    yield* Console.log(`Questions attempted: ${answeredQuestions}`)
    yield* Console.log(`Total answers: ${totalAnswers}`)
    yield* Console.log(`Correct answers: ${correctAnswers}`)
    yield* Console.log(`Accuracy: ${accuracy.toFixed(1)}%`)
    yield* Console.log('')
  })
}

const promptForInput = (prompt: string): Effect.Effect<string, never, never> => {
  return Effect.gen(function* () {
    yield* Console.log(prompt)

    return new Promise<string>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      const readline = require('readline')
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })

      rl.question('', (answer: string) => {
        rl.close()
        resolve(answer.trim())
      })
    })
  }).pipe(Effect.promise)
}

const processAnswer = (
  userInput: string,
  question: Question,
  state: CLIState
): Effect.Effect<CLIState, never, never> => {
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

    const stats = getQuestionStats(question.questionNumber, newAnswers)
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

const gameLoop = (state: CLIState): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    if (Option.isNone(state.currentQuestion)) {
      const nextQuestion = yield* getNextQuestion(state)

      if (Option.isNone(nextQuestion)) {
        yield* Console.log('🎉 No more questions available!')
        return
      }

      const newState = { ...state, currentQuestion: nextQuestion }
      yield* displayQuestion(nextQuestion.value)

      const userInput = yield* promptForInput(
        'Your answer (A/B/C/D) or "stats" for statistics or "quit" to exit: '
      )

      if (userInput.toLowerCase() === 'quit') {
        yield* Console.log('👋 Thanks for practicing!')
        return
      }

      if (userInput.toLowerCase() === 'stats') {
        yield* displayStats(newState)
        yield* gameLoop(newState)
        return
      }

      const updatedState = yield* processAnswer(userInput, nextQuestion.value, newState)
      yield* gameLoop(updatedState)
    }
  })
}

const main = (): Effect.Effect<void, never, never> => {
  return Effect.gen(function* () {
    yield* Console.log('🇺🇸 US Civics Questionnaire Engine')
    yield* Console.log('===================================')
    yield* Console.log('Answer questions to test your knowledge!')
    yield* Console.log('Unanswered and incorrect questions will appear more frequently.')
    yield* Console.log('')

    const initialState = yield* createInitialState()

    yield* Console.log(`Loaded ${initialState.questions.length} questions with distractors.`)
    yield* Console.log('')

    yield* gameLoop(initialState)
  })
}

const program = main().pipe(Effect.provide(NodeContext.layer))

NodeRuntime.runMain(program)
