import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Command, Options } from '@effect/cli'
import { Effect } from 'effect'
import { QuestionsDataService } from '../data/QuestionsDataService'
import { DistractorManager } from '../services/DistractorManager'
import { CuratedDistractorService } from '../services/CuratedDistractorService'
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
  useOpenAI: Options.boolean('use-openai').pipe(
    Options.withDescription('Enable OpenAI generation for text questions'),
    Options.withDefault(DEFAULT_GENERATION_OPTIONS.useOpenAI)
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
    Options.withDescription('Regenerate distractors for a specific question by number (1-100)'),
    Options.optional
  )
}

const cli = Command.make('distractors', options, (opts) =>
  Effect.gen(function* () {
    // Validate questionNumber option
    const questionNumber =
      opts.questionNumber._tag === 'Some' ? opts.questionNumber.value : undefined
    if (questionNumber !== undefined) {
      // Validate range
      if (questionNumber < 1 || questionNumber > 100) {
        yield* Effect.fail(new Error('Question number must be between 1 and 100'))
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
    const baseOptions = {
      regenAll: opts.regenAll,
      regenIncomplete: opts.regenIncomplete,
      targetCount: opts.targetCount,
      filterSimilar: opts.filterSimilar,
      checkAnswers: opts.checkAnswers,
      useOpenAI: opts.useOpenAI,
      batchSize: opts.batchSize,
      maxRetries: DEFAULT_GENERATION_OPTIONS.maxRetries
    }
    // Add questionNumber only if defined (exactOptionalPropertyTypes)
    const generationOptions: DistractorGenerationOptions =
      questionNumber !== undefined ? { ...baseOptions, questionNumber } : baseOptions

    // Run generation
    if (questionNumber !== undefined) {
      yield* Effect.log(`Regenerating distractors for question ${questionNumber}...`)
    } else {
      yield* Effect.log('Starting distractor generation...')
    }
    const manager = yield* DistractorManager
    yield* manager.generateAndWrite(generationOptions)
    yield* Effect.log('Generation complete!')
  })
).pipe(Command.withDescription('Generate distractors for civics questions'))

const runnable = Command.run(cli, {
  name: 'Distractor Generator',
  version: '1.0.0'
})

runnable(process.argv).pipe(
  // Provide service layers in dependency order
  Effect.provide(QuestionsDataService.Default),
  Effect.provide(CuratedDistractorService.Default),
  Effect.provide(FallbackDistractorService.Default),
  Effect.provide(OpenAIDistractorService.Default),
  Effect.provide(DistractorQualityService.Default),
  Effect.provide(SimilarityService.Default),
  Effect.provide(EnhancedStaticGenerator.Default),
  Effect.provide(DistractorManager.Default),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
