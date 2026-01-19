import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Command, Options } from '@effect/cli'
import { Effect, Logger, LogLevel } from 'effect'
import Questions from 'civics2json/Questions'
import { QuestionsDataService } from '../data/QuestionsDataService'

const TOTAL_QUESTIONS = Questions.length
import { DistractorManager } from '../services/DistractorManager'
import { FallbackDistractorService } from '../services/FallbackDistractorService'
import { EnhancedStaticGenerator } from '../generators/EnhancedStaticGenerator'
import { OpenAIDistractorService } from '../services/OpenAIDistractorService'
import { DistractorQualityService } from '../services/DistractorQualityService'
import { SimilarityService } from '../services/SimilarityService'
import { createValidatedConfiguration } from '../config'
import { DistractorGenerationOptions, DEFAULT_GENERATION_OPTIONS } from '../types/config'

// Define CLI options
const options = {
  regenAll: Options.boolean('regen-all').pipe(
    Options.withDescription('Regenerate all distractors, ignoring existing ones'),
    Options.withDefault(DEFAULT_GENERATION_OPTIONS.regenAll)
  ),
  regenIncomplete: Options.boolean('regen-incomplete').pipe(
    Options.withDescription('Only regenerate questions with incomplete distractors'),
    Options.withDefault(DEFAULT_GENERATION_OPTIONS.regenIncomplete)
  ),
  targetCount: Options.integer('target-count').pipe(
    Options.withDescription('Target number of distractors per question (5-20)'),
    Options.withDefault(DEFAULT_GENERATION_OPTIONS.targetCount)
  ),
  noOpenAI: Options.boolean('no-openai').pipe(
    Options.withDescription('Disable OpenAI generation (use fallback database only)'),
    Options.withDefault(false)
  ),
  filterSimilar: Options.boolean('filter-similar').pipe(
    Options.withDescription('Apply similarity filtering to remove duplicates'),
    Options.withDefault(DEFAULT_GENERATION_OPTIONS.filterSimilar)
  ),
  checkAnswers: Options.boolean('check-answers').pipe(
    Options.withDescription('Filter out distractors that appear as correct answers elsewhere'),
    Options.withDefault(DEFAULT_GENERATION_OPTIONS.checkAnswers)
  ),
  batchSize: Options.integer('batch-size').pipe(
    Options.withDescription('Number of questions to process in each batch'),
    Options.withDefault(DEFAULT_GENERATION_OPTIONS.batchSize)
  ),
  questionNumber: Options.integer('question').pipe(
    Options.withDescription(`Regenerate distractors for a specific question by number (1-${TOTAL_QUESTIONS})`),
    Options.optional
  ),
  verbose: Options.boolean('verbose').pipe(
    Options.withAlias('v'),
    Options.withDescription('Enable verbose debug logging'),
    Options.withDefault(false)
  )
}

const cli = Command.make('distractors', options, (opts) =>
  Effect.gen(function* () {
    // Set log level based on verbose flag
    const logLevel = opts.verbose ? LogLevel.Debug : LogLevel.Info

    // Validate questionNumber option
    const questionNumber =
      opts.questionNumber._tag === 'Some' ? opts.questionNumber.value : undefined
    if (questionNumber !== undefined) {
      // Validate range
      if (questionNumber < 1 || questionNumber > TOTAL_QUESTIONS) {
        yield* Effect.fail(new Error(`Question number must be between 1 and ${TOTAL_QUESTIONS}`))
      }
      // Cannot combine with --regen-all or --regen-incomplete
      if (opts.regenAll) {
        yield* Effect.fail(new Error('Cannot use --question with --regen-all'))
      }
      if (opts.regenIncomplete) {
        yield* Effect.fail(new Error('Cannot use --question with --regen-incomplete'))
      }
    }

    // Load and validate configuration
    yield* Effect.log('Loading configuration...')
    const config = yield* createValidatedConfiguration()
    yield* Effect.log(
      `Configuration loaded: model=${config.openai.model}, target=${opts.targetCount}`
    )

    // Build generation options from CLI args
    // Note: noOpenAI flag inverts to useOpenAI (--no-openai means useOpenAI=false)
    const baseOptions = {
      regenAll: opts.regenAll,
      regenIncomplete: opts.regenIncomplete,
      targetCount: opts.targetCount,
      filterSimilar: opts.filterSimilar,
      checkAnswers: opts.checkAnswers,
      useOpenAI: !opts.noOpenAI,
      batchSize: opts.batchSize,
      maxRetries: DEFAULT_GENERATION_OPTIONS.maxRetries,
      overRequestCount: DEFAULT_GENERATION_OPTIONS.overRequestCount
    }
    // Add questionNumber only if defined (exactOptionalPropertyTypes)
    const generationOptions: DistractorGenerationOptions =
      questionNumber !== undefined ? { ...baseOptions, questionNumber } : baseOptions

    // Run generation with appropriate log level
    const runGeneration = Effect.gen(function* () {
      if (questionNumber !== undefined) {
        yield* Effect.log(`Regenerating distractors for question ${questionNumber}...`)
      } else {
        yield* Effect.log('Starting distractor generation...')
      }
      const manager = yield* DistractorManager
      yield* manager.generateAndWrite(generationOptions)
      yield* Effect.log('Generation complete!')
    })

    yield* runGeneration.pipe(Logger.withMinimumLogLevel(logLevel))
  })
).pipe(Command.withDescription('Generate distractors for civics questions'))

const runnable = Command.run(cli, {
  name: 'Distractor Generator',
  version: '1.0.0'
})

runnable(process.argv).pipe(
  // Provide service layers in dependency order
  Effect.provide(QuestionsDataService.Default),
  Effect.provide(FallbackDistractorService.Default),
  Effect.provide(OpenAIDistractorService.Default),
  Effect.provide(DistractorQualityService.Default),
  Effect.provide(SimilarityService.Default),
  Effect.provide(EnhancedStaticGenerator.Default),
  Effect.provide(DistractorManager.Default),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
