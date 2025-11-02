import { Effect, Layer } from 'effect'
import type { PairedAnswers, Question } from 'questionnaire'
import { PairedQuestionNumber, QuestionSelector, QuestionSelectorDefault } from 'questionnaire'
import { QuestionStatistics, QuestionFilter, QuestionSortField } from '@/types'

/**
 * Default weights for adaptive question selection
 * These match the weights used in QuestionSelector
 */
const DEFAULT_WEIGHTS = {
  unanswered: 10,
  incorrect: 5,
  correct: 1
} as const

/**
 * Calculate the selection weight for a paired question based on answer history
 * This mirrors the logic in QuestionSelector.calculatePairedQuestionWeight
 */
const calculateWeight = (
  pairedQuestionNumber: string,
  pairedAnswers: PairedAnswers
): number => {
  const pqn = PairedQuestionNumber(pairedQuestionNumber)
  const history = pairedAnswers[pqn]

  // Unanswered questions get maximum weight
  if (history === undefined || history.length === 0) {
    return DEFAULT_WEIGHTS.unanswered
  }

  // Use average of last 5 answers to calculate interpolated weight
  const recentAnswers = history.slice(-5)
  const correctAnswers = recentAnswers.filter((answer) => answer.correct).length
  const averageCorrectness = correctAnswers / recentAnswers.length

  // Interpolate between incorrect and correct weights
  const interpolatedWeight =
    DEFAULT_WEIGHTS.incorrect +
    (DEFAULT_WEIGHTS.correct - DEFAULT_WEIGHTS.incorrect) * averageCorrectness

  return interpolatedWeight
}

/**
 * Check if a question is mastered (last 3 answers were correct)
 */
const isMastered = (pairedQuestionNumber: string, pairedAnswers: PairedAnswers): boolean => {
  const pqn = PairedQuestionNumber(pairedQuestionNumber)
  const history = pairedAnswers[pqn]
  if (history === undefined || history.length < 3) {
    return false
  }

  const recentAnswers = history.slice(-3)
  return recentAnswers.every((answer) => answer.correct === true)
}

/**
 * Calculate statistics for a single question
 */
const calculateQuestionStatistic = (
  question: Question,
  pairedAnswers: PairedAnswers,
  totalWeight: number
): QuestionStatistics => {
  const pairedQuestionNumber = question.pairedQuestionNumber
  const history = pairedAnswers[pairedQuestionNumber] ?? []

  const timesAsked = history.length
  const timesCorrect = history.filter((answer) => answer.correct).length
  const timesIncorrect = timesAsked - timesCorrect
  const accuracy = timesAsked > 0 ? timesCorrect / timesAsked : 0

  const weight = calculateWeight(pairedQuestionNumber, pairedAnswers)
  const selectionProbability = totalWeight > 0 ? (weight / totalWeight) * 100 : 0

  const lastAnswer = history.length > 0 ? history[history.length - 1] : undefined

  const result: QuestionStatistics = {
    pairedQuestionNumber,
    questionNumber: question.questionNumber,
    questionText: question.question,
    correctAnswerText: question.correctAnswerText,
    timesAsked,
    timesCorrect,
    timesIncorrect,
    accuracy,
    selectionProbability
  }

  if (lastAnswer !== undefined) {
    result.lastAsked = new Date(lastAnswer.ts)
  }

  return result
}

/**
 * Calculate statistics for all questions
 */
const calculateQuestionStatistics = (
  questions: ReadonlyArray<Question>,
  pairedAnswers: PairedAnswers
): Effect.Effect<ReadonlyArray<QuestionStatistics>, never, never> => {
  // Calculate total weight of all questions
  const totalWeight = questions.reduce((sum, question) => {
    return sum + calculateWeight(question.pairedQuestionNumber, pairedAnswers)
  }, 0)

  // Calculate statistics for each question
  const statistics = questions.map((question) =>
    calculateQuestionStatistic(question, pairedAnswers, totalWeight)
  )

  return Effect.succeed(statistics)
}

/**
 * Filter questions based on their status
 */
const filterQuestions = (
  statistics: ReadonlyArray<QuestionStatistics>,
  filter: QuestionFilter,
  pairedAnswers: PairedAnswers
): ReadonlyArray<QuestionStatistics> => {
  switch (filter) {
    case QuestionFilter.All:
      return statistics

    case QuestionFilter.Mastered:
      return statistics.filter((stat) => isMastered(stat.pairedQuestionNumber, pairedAnswers))

    case QuestionFilter.NeedsPractice:
      return statistics.filter(
        (stat) =>
          stat.timesAsked > 0 &&
          stat.accuracy < 0.6 &&
          !isMastered(stat.pairedQuestionNumber, pairedAnswers)
      )

    case QuestionFilter.NeverAsked:
      return statistics.filter((stat) => stat.timesAsked === 0)

    default:
      return statistics
  }
}

/**
 * Sort questions by a specific field
 */
const sortQuestions = (
  statistics: ReadonlyArray<QuestionStatistics>,
  sortField: QuestionSortField,
  ascending: boolean = true
): ReadonlyArray<QuestionStatistics> => {
  const sorted = [...statistics].sort((a, b) => {
    let comparison = 0

    switch (sortField) {
      case QuestionSortField.QuestionNumber: {
        // Parse question number for proper numerical sorting
        const aNum = parseInt(a.questionNumber, 10)
        const bNum = parseInt(b.questionNumber, 10)
        comparison = aNum - bNum
        break
      }
      case QuestionSortField.TimesAsked: {
        comparison = a.timesAsked - b.timesAsked
        break
      }
      case QuestionSortField.Accuracy: {
        comparison = a.accuracy - b.accuracy
        break
      }
      case QuestionSortField.Probability: {
        comparison = a.selectionProbability - b.selectionProbability
        break
      }
      default: {
        comparison = 0
      }
    }

    return ascending ? comparison : -comparison
  })

  return sorted
}

/**
 * Get summary statistics
 */
const getSummaryStatistics = (
  questions: ReadonlyArray<Question>,
  pairedAnswers: PairedAnswers
): Effect.Effect<
  {
    totalQuestions: number
    questionsAttempted: number
    questionsMastered: number
    questionsNeedingPractice: number
  },
  never,
  never
> => {
  const totalQuestions = questions.length

  const attemptedQuestions = questions.filter((q) => {
    const pqn = PairedQuestionNumber(q.pairedQuestionNumber)
    return (pairedAnswers[pqn]?.length ?? 0) > 0
  })
  const questionsAttempted = attemptedQuestions.length

  const masteredQuestions = questions.filter((q) =>
    isMastered(q.pairedQuestionNumber, pairedAnswers)
  )
  const questionsMastered = masteredQuestions.length

  const needsPractice = attemptedQuestions.filter((q) => {
    const pqn = PairedQuestionNumber(q.pairedQuestionNumber)
    const history = pairedAnswers[pqn] ?? []
    const correct = history.filter((a) => a.correct === true).length
    const accuracy = history.length > 0 ? correct / history.length : 0
    return accuracy < 0.6 && !isMastered(q.pairedQuestionNumber, pairedAnswers)
  })
  const questionsNeedingPractice = needsPractice.length

  return Effect.succeed({
    totalQuestions,
    questionsAttempted,
    questionsMastered,
    questionsNeedingPractice
  })
}

/**
 * Statistics Service for question analytics
 * Provides methods to calculate and filter question statistics
 */
export class StatisticsService extends Effect.Service<StatisticsService>()(
  'StatisticsService',
  {
    effect: Effect.gen(function* () {
      const questionSelector = yield* QuestionSelector

      return {
        calculateQuestionStatistics: (
          questions: ReadonlyArray<Question>,
          pairedAnswers: PairedAnswers
        ) => calculateQuestionStatistics(questions, pairedAnswers),

        filterQuestions: (
          statistics: ReadonlyArray<QuestionStatistics>,
          filter: QuestionFilter,
          pairedAnswers: PairedAnswers
        ) => filterQuestions(statistics, filter, pairedAnswers),

        sortQuestions: (
          statistics: ReadonlyArray<QuestionStatistics>,
          sortField: QuestionSortField,
          ascending?: boolean
        ) => sortQuestions(statistics, sortField, ascending),

        getSummaryStatistics: (questions: ReadonlyArray<Question>, pairedAnswers: PairedAnswers) =>
          getSummaryStatistics(questions, pairedAnswers),

        // Re-export QuestionSelector methods for convenience
        getPairedQuestionStats: (pairedQuestionNumber: string, pairedAnswers: PairedAnswers) =>
          questionSelector.getPairedQuestionStats(
            PairedQuestionNumber(pairedQuestionNumber),
            pairedAnswers
          ),

        getLearningProgress: (pairedAnswers: PairedAnswers) =>
          questionSelector.getLearningProgress(pairedAnswers)
      }
    }),
    dependencies: [QuestionSelectorDefault]
  }
) {}

/**
 * Test layer for StatisticsService with mockable functions
 */
export const TestStatisticsServiceLayer = (fn?: {
  calculateQuestionStatistics?: StatisticsService['calculateQuestionStatistics']
  filterQuestions?: StatisticsService['filterQuestions']
  sortQuestions?: StatisticsService['sortQuestions']
  getSummaryStatistics?: StatisticsService['getSummaryStatistics']
  getPairedQuestionStats?: StatisticsService['getPairedQuestionStats']
  getLearningProgress?: StatisticsService['getLearningProgress']
}) =>
  Layer.succeed(
    StatisticsService,
    StatisticsService.of({
      _tag: 'StatisticsService',
      calculateQuestionStatistics:
        fn?.calculateQuestionStatistics ?? (() => Effect.succeed([])),
      filterQuestions: fn?.filterQuestions ?? ((stats) => stats),
      sortQuestions: fn?.sortQuestions ?? ((stats) => stats),
      getSummaryStatistics:
        fn?.getSummaryStatistics ??
        (() =>
          Effect.succeed({
            totalQuestions: 0,
            questionsAttempted: 0,
            questionsMastered: 0,
            questionsNeedingPractice: 0
          })),
      getPairedQuestionStats:
        fn?.getPairedQuestionStats ??
        (() => ({
          totalAnswered: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          accuracy: 0
        })),
      getLearningProgress:
        fn?.getLearningProgress ??
        (() => ({
          totalQuestionsAttempted: 0,
          totalAnswers: 0,
          overallAccuracy: 0,
          masteredQuestions: 0
        }))
    })
  )
