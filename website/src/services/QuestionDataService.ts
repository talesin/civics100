import { Effect, Layer, Option } from 'effect'
import { QuestionDisplay } from '@/types'
import type { StateAbbreviation } from 'civics2json'
import { civicsQuestionsWithDistractors } from 'questionnaire/data'
import type { QuestionDataSource, Question, PairedAnswers } from 'questionnaire'

import { loadQuestions } from 'questionnaire'
import { AdaptiveLearningService } from './AdaptiveLearningService'

/**
 * Transform a questionnaire Question into a QuestionDisplay for the website UI
 */
const transformQuestionToDisplay = (
  question: Question,
  questionNumber: number,
  totalQuestions: number
): QuestionDisplay => {
  return {
    id: question.pairedQuestionNumber,
    questionText: question.question,
    answers: [...question.answers],
    correctAnswerIndex: question.correctAnswer,
    questionNumber,
    totalQuestions
  }
}

/**
 * Load questions using the questionnaire package's sophisticated data service
 */
const loadCivicsQuestions = (
  userState: StateAbbreviation = 'CA',
  questionNumbers?: readonly number[]
): Effect.Effect<readonly Question[]> => {
  const dataSource: QuestionDataSource = {
    questions: civicsQuestionsWithDistractors,
    userState,
    questionNumbers
  }

  return loadQuestions(dataSource)
}

// -----------------------------------------------------------------------------
// Helper functions extracted from generateGameQuestions for better readability
// -----------------------------------------------------------------------------

const shuffleQuestions = (questions: readonly Question[]): Question[] => {
  const shuffled = [...questions]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const elementJ = shuffled[j]
    const elementI = shuffled[i]
    if (elementJ !== undefined && elementI !== undefined) {
      shuffled[i] = elementJ
      shuffled[j] = elementI
    }
  }
  return shuffled
}

const selectRandomQuestions = (
  allQuestions: readonly Question[],
  questionCount: number
): Question[] => {
  const shuffledQuestions = shuffleQuestions(allQuestions)
  return shuffledQuestions.slice(0, questionCount)
}

const selectAdaptiveQuestions = (
  adaptiveLearningService: AdaptiveLearningService,
  allQuestions: readonly Question[],
  questionCount: number,
  userState: StateAbbreviation,
  pairedAnswers: PairedAnswers
): Effect.Effect<Question[]> =>
  Effect.gen(function* () {
    const selectedQuestions: Question[] = []
    const usedPairedQuestionNumbers = new Set<string>()

    for (let i = 0; i < questionCount; i++) {
      const filteredPairedAnswers = Object.fromEntries(
        Object.entries(pairedAnswers).filter(([pqn]) => !usedPairedQuestionNumbers.has(pqn))
      )

      const nextQuestionOption = yield* adaptiveLearningService.getNextQuestion(
        userState,
        filteredPairedAnswers
      )

      if (Option.isSome(nextQuestionOption)) {
        const question = nextQuestionOption.value
        selectedQuestions.push(question)
        usedPairedQuestionNumbers.add(question.pairedQuestionNumber)
      } else {
        const remainingQuestions = allQuestions.filter(
          (q) => !usedPairedQuestionNumbers.has(q.pairedQuestionNumber)
        )
        if (remainingQuestions.length > 0) {
          const fallbackQuestion = remainingQuestions[0]
          if (fallbackQuestion) {
            selectedQuestions.push(fallbackQuestion)
            usedPairedQuestionNumbers.add(fallbackQuestion.pairedQuestionNumber)
          }
        }
      }
    }

    return selectedQuestions
  })

/**
 * Generate game questions using true adaptive selection
 * Uses AdaptiveLearningService for intelligent question selection based on user performance
 */
const generateGameQuestions = (adaptiveLearningService: AdaptiveLearningService) =>
  Effect.fn(function* (
    questionCount: number,
    userState: StateAbbreviation = 'CA',
    pairedAnswers: PairedAnswers = {}
  ) {
    const allQuestions = yield* loadCivicsQuestions(userState)

    const hasAnswerHistory = Object.keys(pairedAnswers).length > 0

    const questions: Question[] = hasAnswerHistory
      ? yield* selectAdaptiveQuestions(
          adaptiveLearningService,
          allQuestions,
          questionCount,
          userState,
          pairedAnswers
        )
      : selectRandomQuestions(allQuestions, questionCount)

    return questions.map((question, index) =>
      transformQuestionToDisplay(question, index + 1, questionCount)
    )
  })

/**
 * Get all available questions for a user's state
 */
const getAllQuestions = (
  userState: StateAbbreviation = 'CA'
): Effect.Effect<readonly Question[], never, never> => {
  return loadCivicsQuestions(userState)
}

/**
 * Website's QuestionDataService that wraps the questionnaire package services
 * Provides compatibility with existing website interfaces while using advanced features
 */
export class QuestionDataService extends Effect.Service<QuestionDataService>()(
  'QuestionDataService',
  {
    effect: Effect.gen(function* () {
      const adaptiveLearningService = yield* AdaptiveLearningService

      return {
        loadCivicsQuestions,
        generateGameQuestions: generateGameQuestions(adaptiveLearningService),
        getAllQuestions
      }
    }),
    dependencies: [AdaptiveLearningService.Default]
  }
) {}

export const TestQuestionDataServiceLayer = (fn?: {
  loadCivicsQuestions?: (
    userState?: StateAbbreviation,
    questionNumbers?: readonly number[]
  ) => Effect.Effect<readonly Question[], never, never>
  generateGameQuestions?: (
    questionCount: number,
    userState?: StateAbbreviation,
    pairedAnswers?: PairedAnswers
  ) => Effect.Effect<QuestionDisplay[], never, never>
  getAllQuestions?: (
    userState?: StateAbbreviation
  ) => Effect.Effect<readonly Question[], never, never>
}) =>
  Layer.succeed(
    QuestionDataService,
    QuestionDataService.of({
      _tag: 'QuestionDataService',
      loadCivicsQuestions: fn?.loadCivicsQuestions ?? (() => Effect.succeed([])),
      generateGameQuestions: fn?.generateGameQuestions ?? (() => Effect.succeed([])),
      getAllQuestions: fn?.getAllQuestions ?? (() => Effect.succeed([]))
    })
  )
