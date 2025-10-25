import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { Command, Options } from '@effect/cli'
import { Effect } from 'effect'
import { QuestionsDataService } from '../data/QuestionsDataService'
import { DistractorManager } from '../services/DistractorManager'
import { CuratedDistractorService } from '../services/CuratedDistractorService'
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
  )
}

const cli = Command.make('distractors', options, (opts) =>
  Effect.gen(function* () {
    // Load and validate configuration
    yield* Effect.log('Loading configuration...')
    const config = yield* createValidatedConfiguration()
    yield* Effect.log(
      `Configuration loaded: model=${config.openai.model}, target=${opts.targetCount}`
    )

    // Build generation options from CLI args
    const generationOptions: DistractorGenerationOptions = {
      regenAll: opts.regenAll,
      regenIncomplete: opts.regenIncomplete,
      targetCount: opts.targetCount,
      filterSimilar: opts.filterSimilar,
      checkAnswers: opts.checkAnswers,
      useOpenAI: opts.useOpenAI,
      batchSize: opts.batchSize,
      maxRetries: DEFAULT_GENERATION_OPTIONS.maxRetries
    }

    // Run generation
    yield* Effect.log('Starting distractor generation...')
    const manager = yield* DistractorManager
    yield* manager.generateAndWrite(generationOptions)
    yield* Effect.log('Generation complete!')
  })
).pipe(
  Command.withDescription('Generate distractors for civics questions')
)

const runnable = Command.run(cli, {
  name: 'Distractor Generator',
  version: '1.0.0'
})

runnable(process.argv).pipe(
  // Provide service layers in dependency order
  Effect.provide(QuestionsDataService.Default),
  Effect.provide(CuratedDistractorService.Default),
  Effect.provide(OpenAIDistractorService.Default),
  Effect.provide(DistractorQualityService.Default),
  Effect.provide(SimilarityService.Default),
  Effect.provide(EnhancedStaticGenerator.Default),
  Effect.provide(DistractorManager.Default),
  Effect.provide(NodeContext.layer),
  NodeRuntime.runMain
)
