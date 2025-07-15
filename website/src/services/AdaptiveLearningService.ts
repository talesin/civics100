import { Effect, Layer, Option } from 'effect'
import type { StateAbbreviation } from 'civics2json'
import { QuestionSelector } from 'questionnaire'
import type {
  PairedAnswers,
  PairedQuestionNumber,
  Question,
  QuestionDataSource
} from 'questionnaire'
import { civicsQuestionsWithDistractors } from 'questionnaire/data'
import {
  loadQuestions,
  getAvailablePairedQuestionNumbers,
  findQuestionByPairedNumber
} from 'questionnaire'

/**
 * Service for managing adaptive learning with answer tracking and weighted question selection
 * This is now a thin wrapper around the questionnaire package's comprehensive QuestionSelector
 */

/**
 * Load all available paired questions for a user's state
 */
const loadAllQuestions = (
  userState: StateAbbreviation = 'CA'
): Effect.Effect<readonly Question[]> => {
  const dataSource: QuestionDataSource = {
    questions: civicsQuestionsWithDistractors,
    userState
  }

  return loadQuestions(dataSource)
}

/**
 * Get the next question using adaptive learning algorithm
 * Uses weighted selection based on answer history
 */
const getNextQuestion = (questionSelector: QuestionSelector) =>
  Effect.fn(function* (userState: StateAbbreviation, pairedAnswers: PairedAnswers) {
    const allQuestions = yield* loadAllQuestions(userState)

    // Get all available paired question numbers
    const availablePairedQuestions = getAvailablePairedQuestionNumbers(allQuestions)

    // Use QuestionSelector to get the next question with adaptive weighting
    const selectedPairedQuestionNumber = yield* questionSelector.selectPairedQuestion(
      availablePairedQuestions,
      pairedAnswers
    )

    // Find the actual question object
    return Option.flatMap(selectedPairedQuestionNumber, (pairedQNum) =>
      findQuestionByPairedNumber(pairedQNum, allQuestions)
    )
  })

/**
 * Record an answer for adaptive learning
 * Delegates to QuestionSelector's recordPairedAnswer function
 */
const recordAnswer =
  (questionSelector: QuestionSelector) =>
  (pairedQuestionNumber: PairedQuestionNumber, isCorrect: boolean, pairedAnswers: PairedAnswers) =>
    questionSelector.recordPairedAnswer(pairedQuestionNumber, isCorrect, pairedAnswers)

/**
 * Get statistics for a specific paired question
 * Delegates to QuestionSelector's getPairedQuestionStats function
 */
const getQuestionStats =
  (questionSelector: QuestionSelector) =>
  (pairedQuestionNumber: PairedQuestionNumber, pairedAnswers: PairedAnswers) =>
    questionSelector.getPairedQuestionStats(pairedQuestionNumber, pairedAnswers)

/**
 * Get overall learning progress statistics
 * Delegates to QuestionSelector's getLearningProgress function
 */
const getLearningProgress =
  (questionSelector: QuestionSelector) => (pairedAnswers: PairedAnswers) =>
    questionSelector.getLearningProgress(pairedAnswers)

export class AdaptiveLearningService extends Effect.Service<AdaptiveLearningService>()(
  'AdaptiveLearningService',
  {
    effect: Effect.gen(function* () {
      const questionSelector = yield* QuestionSelector
      return {
        loadAllQuestions,
        getNextQuestion: getNextQuestion(questionSelector),
        recordAnswer: recordAnswer(questionSelector),
        getQuestionStats: getQuestionStats(questionSelector),
        getLearningProgress: getLearningProgress(questionSelector)
      }
    }),
    dependencies: [QuestionSelector.Default]
  }
) {}

export const TestAdaptiveLearningServiceLayer = (fn?: {
  loadAllQuestions?: AdaptiveLearningService['loadAllQuestions']
  getNextQuestion?: AdaptiveLearningService['getNextQuestion']
  recordAnswer?: AdaptiveLearningService['recordAnswer']
  getQuestionStats?: AdaptiveLearningService['getQuestionStats']
  getLearningProgress?: AdaptiveLearningService['getLearningProgress']
}) =>
  Layer.succeed(
    AdaptiveLearningService,
    AdaptiveLearningService.of({
      _tag: 'AdaptiveLearningService',
      loadAllQuestions: fn?.loadAllQuestions ?? (() => Effect.succeed([])),
      getNextQuestion: fn?.getNextQuestion ?? (() => Effect.succeed(Option.none())),
      recordAnswer:
        fn?.recordAnswer ??
        ((() => Effect.succeed({})) as unknown as AdaptiveLearningService['recordAnswer']),
      getQuestionStats:
        fn?.getQuestionStats ??
        ((() => Effect.succeed({})) as unknown as AdaptiveLearningService['getQuestionStats']),
      getLearningProgress:
        fn?.getLearningProgress ??
        ((() => Effect.succeed({})) as unknown as AdaptiveLearningService['getLearningProgress'])
    })
  )
