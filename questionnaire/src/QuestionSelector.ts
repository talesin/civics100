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
 * based on the user's answer history:
 *
 * - **Unanswered Questions** (Weight: 10): Maximum priority for comprehensive coverage
 * - **Previously Incorrect** (Weight: 5): Medium priority for remediation and practice
 * - **Previously Correct** (Weight: 1): Low priority but still included for retention
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
import type { Answers, QuestionNumber, WeightedQuestion, SelectionWeights } from './types'

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
 * 2. **Most Recent Performance**: Uses only the last answer to determine current status
 *    - Reflects user's current understanding level
 *    - Allows questions to transition between difficulty categories
 *    - Avoids penalizing users indefinitely for past mistakes
 *
 * 3. **Binary Classification**: Questions are either "mastered" (correct) or "struggling" (incorrect)
 *    - Mastered: Lower weight for occasional retention review
 *    - Struggling: Higher weight for focused remediation practice
 *    - Simple categorization prevents over-optimization complexity
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

  // Use most recent answer to determine current mastery level
  // This allows questions to move between categories as user improves
  const lastAnswer = history[history.length - 1]
  return lastAnswer?.correct === true ? weights.correct : weights.incorrect
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
): Effect.Effect<Option.Option<QuestionNumber>, never, never> => {
  // Handle empty question set - no selections possible
  if (weightedQuestions.length === 0) {
    return Effect.succeed(Option.none())
  }

  // Calculate total weight for roulette wheel size
  const totalWeight = weightedQuestions.reduce((sum, wq) => sum + wq.weight, 0)

  // Handle case where all questions have zero weight
  if (totalWeight === 0) {
    return Effect.succeed(Option.none())
  }

  return Effect.gen(function* () {
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
}

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
    getQuestionStats: (questionNumber: QuestionNumber, answers: Answers) =>
      getQuestionStats(questionNumber, answers)
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
  getQuestionStats?: (
    questionNumber: QuestionNumber,
    answers: Answers
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
      getQuestionStats:
        fn?.getQuestionStats ??
        (() => ({ totalAnswered: 0, correctAnswers: 0, incorrectAnswers: 0, accuracy: 0 }))
    })
  )
