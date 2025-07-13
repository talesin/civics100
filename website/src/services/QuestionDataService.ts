import { Effect, Layer, Random } from 'effect'
import { QuestionDisplay } from '@/types'

export type CivicsQuestion = {
  theme: string
  section: string
  question: string
  questionNumber: number
  expectedAnswers: number
  answers: {
    _type: string
    choices: string[]
  }
}

const shuffleAnswers = (
  correctAnswer: string,
  allChoices: string[]
): Effect.Effect<{ answers: string[]; correctIndex: number }, never, never> => {
  return Effect.gen(function* () {
    if (!correctAnswer || correctAnswer === '') {
      return { answers: [], correctIndex: -1 }
    }

    const incorrectChoices = allChoices.filter(choice => choice !== correctAnswer)
    const selectedIncorrect = incorrectChoices.slice(0, 3)
    const allAnswers = [correctAnswer, ...selectedIncorrect]

    const mutableAnswers = [...allAnswers]
    for (let i = mutableAnswers.length - 1; i > 0; i--) {
      const j = yield* Random.nextIntBetween(0, i + 1)
      const temp = mutableAnswers[i]
      const swapValue = mutableAnswers[j]
      if (temp !== undefined && swapValue !== undefined) {
        mutableAnswers[i] = swapValue
        mutableAnswers[j] = temp
      }
    }

    const correctIndex = mutableAnswers.indexOf(correctAnswer)
    return { answers: mutableAnswers, correctIndex }
  })
}

const createQuestionDisplay = (
  civicsQuestion: CivicsQuestion,
  questionNumber: number,
  totalQuestions: number
): Effect.Effect<QuestionDisplay, never, never> => {
  return Effect.gen(function* () {
    const choices = civicsQuestion.answers.choices
    if (choices.length === 0) {
      return {
        id: `${civicsQuestion.questionNumber}`,
        questionText: civicsQuestion.question,
        answers: [],
        correctAnswerIndex: -1,
        questionNumber,
        totalQuestions
      }
    }

    const correctAnswer = choices[0]
    const { answers, correctIndex } = yield* shuffleAnswers(correctAnswer, choices)

    return {
      id: `${civicsQuestion.questionNumber}`,
      questionText: civicsQuestion.question,
      answers,
      correctAnswerIndex: correctIndex,
      questionNumber,
      totalQuestions
    }
  })
}

const selectRandomQuestions = (
  questions: CivicsQuestion[],
  count: number
): Effect.Effect<CivicsQuestion[], never, never> => {
  return Effect.gen(function* () {
    const shuffled = [...questions]
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = yield* Random.nextIntBetween(0, i + 1)
      const temp = shuffled[i]
      const swapValue = shuffled[j]
      if (temp !== undefined && swapValue !== undefined) {
        shuffled[i] = swapValue
        shuffled[j] = temp
      }
    }

    return shuffled.slice(0, count)
  })
}

const loadCivicsQuestions = (): Effect.Effect<CivicsQuestion[], never, never> => {
  return Effect.gen(function* () {
    // For now, return a sample set of questions for development
    // TODO: Load from actual data source or API
    const sampleQuestions: CivicsQuestion[] = [
      {
        theme: "AMERICAN GOVERNMENT",
        section: "Principles of American Democracy",
        question: "What is the supreme law of the land?",
        questionNumber: 1,
        expectedAnswers: 1,
        answers: {
          _type: "text",
          choices: ["the Constitution"]
        }
      },
      {
        theme: "AMERICAN GOVERNMENT", 
        section: "Principles of American Democracy",
        question: "What does the Constitution do?",
        questionNumber: 2,
        expectedAnswers: 1,
        answers: {
          _type: "text",
          choices: ["sets up the government", "defines the government", "protects basic rights of Americans"]
        }
      },
      {
        theme: "AMERICAN GOVERNMENT",
        section: "Principles of American Democracy", 
        question: "The idea of self-government is in the first three words of the Constitution. What are these words?",
        questionNumber: 3,
        expectedAnswers: 1,
        answers: {
          _type: "text",
          choices: ["We the People"]
        }
      },
      {
        theme: "AMERICAN GOVERNMENT",
        section: "Principles of American Democracy",
        question: "What is an amendment?",
        questionNumber: 4,
        expectedAnswers: 1,
        answers: {
          _type: "text",
          choices: ["a change to the Constitution", "an addition to the Constitution"]
        }
      },
      {
        theme: "AMERICAN GOVERNMENT",
        section: "Principles of American Democracy",
        question: "What do we call the first ten amendments to the Constitution?",
        questionNumber: 5,
        expectedAnswers: 1,
        answers: {
          _type: "text",
          choices: ["the Bill of Rights"]
        }
      }
    ]
    
    return sampleQuestions
  })
}

const generateGameQuestions = (
  questionCount: number
): Effect.Effect<QuestionDisplay[], never, never> => {
  return Effect.gen(function* () {
    const allQuestions = yield* loadCivicsQuestions()
    const selectedQuestions = yield* selectRandomQuestions(allQuestions, questionCount)
    
    const questionDisplayEffects = selectedQuestions.map((question, index) =>
      createQuestionDisplay(question, index + 1, questionCount)
    )

    return yield* Effect.all(questionDisplayEffects)
  })
}

export class QuestionDataService extends Effect.Service<QuestionDataService>()(
  'QuestionDataService',
  {
    effect: Effect.succeed({
      loadCivicsQuestions,
      generateGameQuestions,
      selectRandomQuestions
    })
  }
) {}

export const TestQuestionDataServiceLayer = (fn?: {
  loadCivicsQuestions?: () => Effect.Effect<CivicsQuestion[], never, never>
  generateGameQuestions?: (questionCount: number) => Effect.Effect<QuestionDisplay[], never, never>
  selectRandomQuestions?: (
    questions: CivicsQuestion[],
    count: number
  ) => Effect.Effect<CivicsQuestion[], never, never>
}) =>
  Layer.succeed(
    QuestionDataService,
    QuestionDataService.of({
      _tag: 'QuestionDataService',
      loadCivicsQuestions: fn?.loadCivicsQuestions ?? (() => Effect.succeed([])),
      generateGameQuestions: fn?.generateGameQuestions ?? (() => Effect.succeed([])),
      selectRandomQuestions: fn?.selectRandomQuestions ?? (() => Effect.succeed([]))
    })
  )