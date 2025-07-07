/**
 * QuestionSelector: Adaptive Learning Algorithm for Civics Questions
 *
 * This module implements a sophisticated weighted random selection algorithm for civics questions
 * that adapts to user performance to optimize learning outcomes. The system applies principles
 * from spaced repetition and adaptive learning to ensure:
 *
 * 1. **Comprehensive Coverage**: Unanswered questions receive highest priority
 * 2. **Targeted Remediation**: Incorrectly answered questions get extra practice opportunities
 * 3. **Retention Review**: Correctly answered questions appear occasionally for long-term retention
 *
 * ## Algorithm Overview
 *
 * The selection process uses a weighted random approach where each question receives a weight
 * based on the user's recent answer history (last 5 attempts):
 *
 * - **Unanswered Questions** (Weight: 10): Maximum priority for comprehensive coverage
 * - **Answered Questions** (Weight: 5-1): Interpolated between incorrect(5) and correct(1) weights
 *   - 0% recent success = weight 5 (maximum remediation priority)
 *   - 100% recent success = weight 1 (minimum retention priority)
 *   - Partial success rates get proportionally interpolated weights (e.g., 50% = weight 3)
 *
 * ## Educational Benefits
 *
 * This approach implements evidence-based learning principles:
 * - **Spaced Repetition**: Difficult questions appear more frequently
 * - **Adaptive Difficulty**: System responds to individual performance patterns
 * - **Balanced Practice**: Ensures both new learning and retention review
 * - **Efficient Study Time**: Focuses attention where it's most needed
 *
 * ## Technical Implementation
 *
 * The algorithm uses a "roulette wheel" selection method where questions with higher weights
 * have proportionally higher chances of being selected, while ensuring all questions remain
 * possible choices to maintain learning diversity.
 */

import { Effect, Option, Random, Layer } from 'effect'
import type {
  Answers,
  PairedAnswers,
  QuestionNumber,
  PairedQuestionNumber,
  WeightedQuestion,
  PairedWeightedQuestion,
  SelectionWeights
} from './types'

/**
 * Default weights for adaptive question selection algorithm.
 *
 * These weights implement spaced repetition principles where higher weights create
 * higher selection probability. The 10:5:1 ratio is carefully calibrated to:
 *
 * **Unanswered (10)**: Maximum priority ensures comprehensive coverage
 * - New questions get immediate attention
 * - Prevents knowledge gaps from incomplete coverage
 * - 10x more likely than mastered questions
 *
 * **Incorrect (5)**: Medium priority for targeted remediation
 * - Questions user struggled with get extra practice
 * - 5x more likely than mastered questions
 * - 2x less likely than completely new material
 * - Balances remediation without overwhelming the user
 *
 * **Correct (1)**: Low priority but not zero for retention review
 * - Ensures long-term retention through occasional review
 * - Prevents complete neglect of mastered material
 * - Maintains learning diversity in question selection
 *
 * This ratio creates a strong bias toward learning difficult material while
 * preserving occasional review of mastered concepts for retention.
 */
const DEFAULT_WEIGHTS: SelectionWeights = {
  unanswered: 10,
  incorrect: 5,
  correct: 1
}

/**
 * Calculate the selection weight for an individual question based on answer history.
 *
 * This function implements the core logic of adaptive learning by examining a question's
 * answer history and assigning an appropriate weight for selection probability.
 *
 * **Weight Assignment Logic:**
 *
 * 1. **Unanswered Questions**: Questions with no history receive maximum weight
 *    - Ensures comprehensive coverage of all available questions
 *    - Prevents knowledge gaps from skipped content
 *    - Gets immediate priority in the learning sequence
 *
 * 2. **Recent Performance Trend**: Uses average of last 5 answers for continuous weight calculation
 *    - More stable than single-answer decisions, reduces noise from lucky/unlucky attempts
 *    - Captures learning progress trends over multiple attempts
 *    - Calculates interpolated weight based on exact success rate percentage
 *    - Allows gradual transitions between difficulty categories based on performance
 *
 * 3. **Continuous Weight Interpolation**: Weight varies smoothly between correct and incorrect bounds
 *    - 0% success rate = full incorrect weight (maximum remediation priority)
 *    - 100% success rate = full correct weight (minimum retention priority)
 *    - Partial success rates get proportionally interpolated weights
 *    - Provides more nuanced selection probability than binary classification
 *
 * **Adaptive Learning Benefits:**
 * - Questions become easier to encounter as user improves
 * - Difficult concepts get repeated practice automatically
 * - System adapts to individual learning patterns in real-time
 *
 * @param questionNumber - Unique identifier for the question
 * @param answers - Complete answer history for all questions
 * @param weights - Weight configuration (defaults to pedagogically optimized values)
 * @returns Numerical weight for selection probability (higher = more likely)
 */
const calculateQuestionWeight = (
  questionNumber: QuestionNumber,
  answers: Answers,
  weights: SelectionWeights = DEFAULT_WEIGHTS
): number => {
  // Retrieve answer history for this specific question
  const history = answers[questionNumber]

  // Unanswered questions get maximum priority for comprehensive coverage
  if (!history || history.length === 0) {
    return weights.unanswered
  }

  // Use average of last 5 answers to calculate interpolated weight
  // This provides more nuanced weighting than binary classification
  const recentAnswers = history.slice(-5)
  const correctAnswers = recentAnswers.filter((answer) => answer.correct).length
  const averageCorrectness = correctAnswers / recentAnswers.length

  // Interpolate between incorrect and correct weights based on success rate
  // 0% success = weights.incorrect, 100% success = weights.correct
  // Linear interpolation: weight = incorrect + (correct - incorrect) * success_rate
  const interpolatedWeight =
    weights.incorrect + (weights.correct - weights.incorrect) * averageCorrectness

  return interpolatedWeight
}

/**
 * Transform available questions into weighted questions for selection algorithm.
 *
 * This function takes the raw list of available questions and converts them into
 * a weighted representation where each question has an associated selection weight
 * based on the user's answer history.
 *
 * **Purpose:**
 * - Bridge between question data and selection algorithm
 * - Apply consistent weight calculation across all available questions
 * - Create the weighted dataset needed for probabilistic selection
 *
 * **Process:**
 * 1. Iterate through each available question
 * 2. Calculate individual weight based on answer history
 * 3. Create weighted question objects for selection algorithm
 *
 * The resulting weighted questions are ready for use in the roulette wheel
 * selection algorithm, where weights determine selection probability.
 *
 * @param availableQuestions - Question numbers that can be selected
 * @param answers - Complete answer history for weight calculation
 * @param weights - Weight configuration (optional, uses defaults)
 * @returns Array of questions with calculated weights for selection
 */
const createWeightedQuestions = (
  availableQuestions: ReadonlyArray<QuestionNumber>,
  answers: Answers,
  weights?: SelectionWeights
): ReadonlyArray<WeightedQuestion> => {
  return availableQuestions.map((questionNumber) => ({
    questionNumber,
    weight: calculateQuestionWeight(questionNumber, answers, weights)
  }))
}

/**
 * Perform weighted random selection using the "roulette wheel" algorithm.
 *
 * This function implements the core probabilistic selection mechanism that powers
 * adaptive learning. It uses a roulette wheel approach where questions with higher
 * weights occupy larger "slices" of the wheel, making them more likely to be selected.
 *
 * **Algorithm Overview: Roulette Wheel Selection**
 *
 * 1. **Wheel Construction**: Each question gets a slice proportional to its weight
 *    - High weight questions get larger slices (more selection probability)
 *    - Low weight questions get smaller slices (less selection probability)
 *    - Total wheel size equals sum of all weights
 *
 * 2. **Random Spin**: Generate random number within total weight range
 *    - Simulates spinning the roulette wheel
 *    - Each spin has different outcome based on chance
 *
 * 3. **Winner Selection**: Find which question's slice contains the random number
 *    - Iterate through cumulative weight ranges
 *    - First question whose range contains the random value wins
 *
 * **Mathematical Properties:**
 * - Selection probability = question_weight / total_weight
 * - Questions with weight 10 are 10x more likely than weight 1
 * - Zero weights are never selected (excluded from wheel)
 * - All non-zero weights maintain some selection possibility
 *
 * **Educational Benefits:**
 * - Maintains learning variety (all questions possible)
 * - Focuses attention on struggling areas (higher weights)
 * - Prevents monotonous drilling (random variation)
 * - Adapts automatically as user improves
 *
 * **Edge Cases:**
 * - Empty question list: Returns none (no questions available)
 * - Zero total weight: Returns none (all questions filtered out)
 * - Single question: Always selected (deterministic)
 *
 * @param weightedQuestions - Questions with calculated selection weights
 * @returns Effect containing optional selected question number
 */
const selectWeightedRandom = (
  weightedQuestions: ReadonlyArray<WeightedQuestion>
): Effect.Effect<Option.Option<QuestionNumber>, never, never> =>
  Effect.gen(function* () {
    // Handle empty question set - no selections possible
    if (weightedQuestions.length === 0) {
      return Option.none()
    }

    // Calculate total weight for roulette wheel size
    const totalWeight = weightedQuestions.reduce((sum, wq) => sum + wq.weight, 0)

    // Handle case where all questions have zero weight
    if (totalWeight === 0) {
      return Option.none()
    }

    // Generate random value for roulette wheel spin (1 to totalWeight inclusive)
    const randomValue = yield* Random.nextIntBetween(1, totalWeight + 1)

    // Find winning question by iterating through cumulative weight ranges
    let cumulativeWeight = 0
    for (const weightedQuestion of weightedQuestions) {
      cumulativeWeight += weightedQuestion.weight

      // Check if random value falls within this question's slice
      if (randomValue <= cumulativeWeight) {
        return Option.some(weightedQuestion.questionNumber)
      }
    }

    // Should never reach here with valid inputs, but included for safety
    return Option.none()
  })

/**
 * Main orchestration function for adaptive question selection.
 *
 * This is the primary public interface for the question selection system. It coordinates
 * the entire adaptive learning pipeline from raw question data to final selection using
 * weighted random algorithms.
 *
 * **Selection Pipeline:**
 * 1. **Weight Calculation**: Transform available questions into weighted representations
 * 2. **Probabilistic Selection**: Apply roulette wheel algorithm for final choice
 *
 * **Integration Points:**
 * - Used by GameService to get next question during gameplay
 * - Integrates with answer tracking system for adaptive behavior
 * - Supports custom weight configurations for different learning modes
 *
 * **Adaptive Learning Flow:**
 * ```
 * Available Questions → Weight Assignment → Weighted Selection → Selected Question
 *        ↑                     ↑                    ↑              ↓
 *   Question Pool         Answer History        Roulette Wheel   Next Question
 * ```
 *
 * **Benefits:**
 * - Clean separation of concerns (orchestration vs. implementation)
 * - Testable components with clear interfaces
 * - Flexible weight configuration for different learning strategies
 * - Effect-based error handling and composability
 *
 * @param availableQuestions - Pool of questions that can be selected
 * @param answers - Complete answer history for adaptive weight calculation
 * @param weights - Optional weight configuration (uses optimized defaults)
 * @returns Effect containing optionally selected question number
 */
export const selectQuestion = (
  availableQuestions: ReadonlyArray<QuestionNumber>,
  answers: Answers,
  weights?: SelectionWeights
): Effect.Effect<Option.Option<QuestionNumber>, never, never> => {
  const weightedQuestions = createWeightedQuestions(availableQuestions, answers, weights)
  return selectWeightedRandom(weightedQuestions)
}

const getQuestionStats = (questionNumber: QuestionNumber, answers: Answers) => {
  const history = answers[questionNumber] ?? []
  const totalAnswered = history.length
  const correctAnswers = history.filter((answer) => answer.correct).length
  const incorrectAnswers = totalAnswered - correctAnswers
  const accuracy = totalAnswered > 0 ? correctAnswers / totalAnswered : 0

  return {
    totalAnswered,
    correctAnswers,
    incorrectAnswers,
    accuracy
  }
}

/**
 * Calculate the selection weight for a paired question based on answer history.
 * Uses the same algorithm as regular questions but works with paired question numbers.
 */
const calculatePairedQuestionWeight = (
  pairedQuestionNumber: PairedQuestionNumber,
  answers: PairedAnswers,
  weights: SelectionWeights = DEFAULT_WEIGHTS
): number => {
  const history = answers[pairedQuestionNumber]

  if (!history || history.length === 0) {
    return weights.unanswered
  }

  const recentAnswers = history.slice(-5)
  const correctAnswers = recentAnswers.filter((answer) => answer.correct).length
  const averageCorrectness = correctAnswers / recentAnswers.length

  const interpolatedWeight =
    weights.incorrect + (weights.correct - weights.incorrect) * averageCorrectness

  return interpolatedWeight
}

/**
 * Transform available paired questions into weighted questions for selection.
 */
const createWeightedPairedQuestions = (
  availablePairedQuestions: ReadonlyArray<PairedQuestionNumber>,
  answers: PairedAnswers,
  weights?: SelectionWeights
): ReadonlyArray<PairedWeightedQuestion> => {
  return availablePairedQuestions.map((pairedQuestionNumber) => ({
    pairedQuestionNumber,
    weight: calculatePairedQuestionWeight(pairedQuestionNumber, answers, weights)
  }))
}

/**
 * Perform weighted random selection for paired questions.
 */
const selectWeightedRandomPaired = (
  weightedPairedQuestions: ReadonlyArray<PairedWeightedQuestion>
): Effect.Effect<Option.Option<PairedQuestionNumber>, never, never> =>
  Effect.gen(function* () {
    if (weightedPairedQuestions.length === 0) {
      return Option.none()
    }

    const totalWeight = weightedPairedQuestions.reduce((sum, wq) => sum + wq.weight, 0)

    if (totalWeight === 0) {
      return Option.none()
    }

    const randomValue = yield* Random.nextIntBetween(1, totalWeight + 1)

    let cumulativeWeight = 0
    for (const weightedPairedQuestion of weightedPairedQuestions) {
      cumulativeWeight += weightedPairedQuestion.weight

      if (randomValue <= cumulativeWeight) {
        return Option.some(weightedPairedQuestion.pairedQuestionNumber)
      }
    }

    return Option.none()
  })

/**
 * Main selection function for paired questions.
 */
export const selectPairedQuestion = (
  availablePairedQuestions: ReadonlyArray<PairedQuestionNumber>,
  answers: PairedAnswers,
  weights?: SelectionWeights
): Effect.Effect<Option.Option<PairedQuestionNumber>, never, never> => {
  const weightedPairedQuestions = createWeightedPairedQuestions(
    availablePairedQuestions,
    answers,
    weights
  )
  return selectWeightedRandomPaired(weightedPairedQuestions)
}

const getPairedQuestionStats = (
  pairedQuestionNumber: PairedQuestionNumber,
  answers: PairedAnswers
) => {
  const history = answers[pairedQuestionNumber] ?? []
  const totalAnswered = history.length
  const correctAnswers = history.filter((answer) => answer.correct).length
  const incorrectAnswers = totalAnswered - correctAnswers
  const accuracy = totalAnswered > 0 ? correctAnswers / totalAnswered : 0

  return {
    totalAnswered,
    correctAnswers,
    incorrectAnswers,
    accuracy
  }
}

/**
 * Service for question selection and statistics
 * Handles weighted question selection based on answer history
 */
export class QuestionSelector extends Effect.Service<QuestionSelector>()('QuestionSelector', {
  effect: Effect.succeed({
    selectQuestion: (
      availableQuestions: ReadonlyArray<QuestionNumber>,
      answers: Answers,
      weights?: SelectionWeights
    ) => selectQuestion(availableQuestions, answers, weights),
    selectPairedQuestion: (
      availablePairedQuestions: ReadonlyArray<PairedQuestionNumber>,
      answers: PairedAnswers,
      weights?: SelectionWeights
    ) => selectPairedQuestion(availablePairedQuestions, answers, weights),
    getQuestionStats: (questionNumber: QuestionNumber, answers: Answers) =>
      getQuestionStats(questionNumber, answers),
    getPairedQuestionStats: (pairedQuestionNumber: PairedQuestionNumber, answers: PairedAnswers) =>
      getPairedQuestionStats(pairedQuestionNumber, answers)
  })
}) {}

/**
 * Test layer for QuestionSelector with mockable functions
 */
export const TestQuestionSelectorLayer = (fn?: {
  selectQuestion?: (
    availableQuestions: ReadonlyArray<QuestionNumber>,
    answers: Answers,
    weights?: SelectionWeights
  ) => Effect.Effect<Option.Option<QuestionNumber>, never, never>
  selectPairedQuestion?: (
    availablePairedQuestions: ReadonlyArray<PairedQuestionNumber>,
    answers: PairedAnswers,
    weights?: SelectionWeights
  ) => Effect.Effect<Option.Option<PairedQuestionNumber>, never, never>
  getQuestionStats?: (
    questionNumber: QuestionNumber,
    answers: Answers
  ) => {
    totalAnswered: number
    correctAnswers: number
    incorrectAnswers: number
    accuracy: number
  }
  getPairedQuestionStats?: (
    pairedQuestionNumber: PairedQuestionNumber,
    answers: PairedAnswers
  ) => {
    totalAnswered: number
    correctAnswers: number
    incorrectAnswers: number
    accuracy: number
  }
}) =>
  Layer.succeed(
    QuestionSelector,
    QuestionSelector.of({
      _tag: 'QuestionSelector',
      selectQuestion: fn?.selectQuestion ?? (() => Effect.succeed(Option.none())),
      selectPairedQuestion: fn?.selectPairedQuestion ?? (() => Effect.succeed(Option.none())),
      getQuestionStats:
        fn?.getQuestionStats ??
        (() => ({ totalAnswered: 0, correctAnswers: 0, incorrectAnswers: 0, accuracy: 0 })),
      getPairedQuestionStats:
        fn?.getPairedQuestionStats ??
        (() => ({ totalAnswered: 0, correctAnswers: 0, incorrectAnswers: 0, accuracy: 0 }))
    })
  )
