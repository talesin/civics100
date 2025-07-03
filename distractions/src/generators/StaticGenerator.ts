import { Data, Effect } from 'effect'
import type { Question } from 'civics2json'
import { QuestionsDataService } from '../data/QuestionsDataService'
import { QuestionClassifierService } from '../services/QuestionClassifierService'
import { PoolMappingService } from '../services/PoolMappingService'
import { DistractorQualityService } from '../services/DistractorQualityService'

export type QuestionWithDistractors = Question & {
  readonly _tag: 'QuestionWithDistractors'
  readonly distractors: readonly string[]
}

export const QuestionWithDistractors =
  Data.tagged<QuestionWithDistractors>('QuestionWithDistractors')

const getAnswerText = (choice: Question['answers']['choices'][number]): string => {
  if (typeof choice === 'string') {
    return choice
  }
  if ('senator' in choice) {
    return choice.senator
  }
  if ('representative' in choice) {
    return choice.representative
  }
  if ('governor' in choice) {
    return choice.governor
  }
  // This case should not be reached with valid data
  return ''
}

export class StaticGenerator extends Effect.Service<StaticGenerator>()('StaticGenerator', {
  effect: Effect.gen(function* () {
    const questionsDataService = yield* QuestionsDataService
    const questionClassifierService = yield* QuestionClassifierService
    const poolMappingService = yield* PoolMappingService
    const distractorQualityService = yield* DistractorQualityService

    const generateFromPools = (question: Question) =>
      Effect.gen(function* () {
        const correctAnswers = question.answers.choices.map(getAnswerText)
        const questionType = questionClassifierService.classifyQuestion(question)

        yield* Effect.log(`Question ${question.questionNumber}: "${question.question}"`)
        yield* Effect.log(`Classified as: ${questionType}`)

        // Get appropriate pools for this question type
        const poolMapping = poolMappingService.getPoolsForQuestionType(questionType)
        yield* Effect.log(`Pool mapping: ${JSON.stringify(poolMapping)}`)

        // Get distractor candidates from static pools
        const poolDistractors = poolMappingService.getDistractorsFromPools(
          poolMapping,
          correctAnswers
        )
        yield* Effect.log(`Pool distractors count: ${poolDistractors.length}`)

        // Apply enhanced quality filtering
        const qualityDistractors = yield* distractorQualityService.applyEnhancedQualityFilters(
          poolDistractors,
          correctAnswers,
          questionType
        )
        yield* Effect.log(`Quality distractors count: ${qualityDistractors.length}`)

        return qualityDistractors
      })

    const generateFromSection = (question: Question, allQuestions: readonly Question[]) =>
      Effect.gen(function* () {
        const correctAnswers = question.answers.choices.map(getAnswerText)

        // Fallback to section-based approach (improved version)
        const potentialDistractorPool = allQuestions
          .filter(
            (q) => q.section === question.section && q.questionNumber !== question.questionNumber
          )
          .flatMap((q) => q.answers.choices.map(getAnswerText))

        // Apply enhanced quality filtering to section-based distractors
        const qualityDistractors = yield* distractorQualityService.applyEnhancedQualityFilters(
          potentialDistractorPool,
          correctAnswers,
          'abstract'
        )

        return qualityDistractors
      })

    const generate = () =>
      Effect.gen(function* () {
        const allQuestions = yield* questionsDataService.getAllQuestions()

        return yield* Effect.all(
          allQuestions.map((question) =>
            Effect.gen(function* () {
              // Try pool-based generation first
              const poolDistractors = yield* generateFromPools(question)

              let finalDistractors: readonly string[]

              // Use fallback if pool-based doesn't generate enough distractors
              if (poolDistractors.length < 3) {
                yield* Effect.log(
                  `Using fallback for question ${question.questionNumber} (only ${poolDistractors.length} pool distractors)`
                )
                const sectionDistractors = yield* generateFromSection(question, allQuestions)

                // Combine pool and section distractors, removing duplicates
                const combined = [...poolDistractors, ...sectionDistractors]
                const uniqueCombined = combined.filter(
                  (distractor, index) =>
                    combined.findIndex(
                      (d) => d.toLowerCase().trim() === distractor.toLowerCase().trim()
                    ) === index
                )

                finalDistractors = uniqueCombined
                yield* Effect.log(`Final distractors count: ${finalDistractors.length}`)
              } else {
                yield* Effect.log(`Using pool distractors for question ${question.questionNumber}`)
                finalDistractors = poolDistractors
              }

              return QuestionWithDistractors({
                ...question,
                distractors: finalDistractors
              })
            })
          )
        )
      })

    return {
      generate
    }
  }),
  dependencies: [
    QuestionsDataService.Default,
    QuestionClassifierService.Default,
    PoolMappingService.Default,
    DistractorQualityService.Default
  ]
}) {}
