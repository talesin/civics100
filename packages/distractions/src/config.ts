import { Config, Effect } from 'effect'
import {
  DEFAULT_GENERATION_OPTIONS,
  DEFAULT_QUALITY_THRESHOLDS,
  DEFAULT_METRICS_CONFIG,
  DEFAULT_CACHE_CONFIG
} from './types/config'
import { ConfigurationError, MissingEnvironmentVariableError } from './types/errors'
import {
  openaiApiKeyConfig,
  nodeEnvConfig,
  logLevelConfig,
  openaiModelConfig,
  openaiTemperatureConfig,
  openaiMaxTokensConfig,
  openaiTimeoutConfig,
  openaiRateLimitRpmConfig
} from './config/environment'

// Environment variable configuration with Effect Config
const distractorTargetCountConfig = Config.integer('DISTRACTOR_TARGET_COUNT').pipe(
  Config.withDefault(15)
)
const enableMetricsConfig = Config.boolean('ENABLE_METRICS').pipe(Config.withDefault(true))
const cacheEnabledConfig = Config.boolean('CACHE_ENABLED').pipe(Config.withDefault(true))

// Load OpenAI configuration from environment (following coding guide)
export const loadOpenAIConfig = () =>
  Effect.gen(function* () {
    const apiKey = yield* openaiApiKeyConfig
    const model = yield* openaiModelConfig
    const temperature = yield* openaiTemperatureConfig
    const maxTokens = yield* openaiMaxTokensConfig
    const requestsPerMinute = yield* openaiRateLimitRpmConfig
    const timeoutMs = yield* openaiTimeoutConfig

    // Validate API key
    if (apiKey === undefined || apiKey === null || apiKey.trim().length === 0) {
      return yield* Effect.fail(
        new ConfigurationError({
          cause: new Error('Missing API key'),
          setting: 'OPENAI_API_KEY',
          value: apiKey,
          reason: 'API key is required for OpenAI integration'
        })
      )
    }

    return {
      apiKey,
      model,
      temperature: Math.max(0, Math.min(1, temperature)), // Clamp to 0-1
      maxTokens: Math.max(1, maxTokens),
      requestsPerMinute: Math.max(1, requestsPerMinute),
      timeoutMs: Math.max(1000, timeoutMs) // Minimum 1 second timeout
    }
  })

// Load generation options from environment (following coding guide)
export const loadGenerationOptions = () =>
  Effect.gen(function* () {
    const targetCount = yield* distractorTargetCountConfig
    const nodeEnv = yield* nodeEnvConfig

    return {
      ...DEFAULT_GENERATION_OPTIONS,
      targetCount: Math.max(5, Math.min(20, targetCount)), // Clamp to 5-20
      useOpenAI: nodeEnv !== 'test', // Disable OpenAI in test environment
      batchSize: nodeEnv === 'development' ? 5 : 10 // Smaller batches in dev
    }
  })

// Load quality thresholds from environment (following coding guide)
export const loadQualityThresholds = () =>
  Effect.gen(function* () {
    const nodeEnv = yield* nodeEnvConfig

    // Adjust thresholds based on environment
    const baseThresholds = DEFAULT_QUALITY_THRESHOLDS
    if (nodeEnv === 'development') {
      return {
        ...baseThresholds,
        relevance: baseThresholds.relevance * 0.8, // Lower thresholds for development
        plausibility: baseThresholds.plausibility * 0.8
      }
    }

    return baseThresholds
  })

// Load metrics configuration from environment (following coding guide)
export const loadMetricsConfig = () =>
  Effect.gen(function* () {
    const enableMetrics = yield* enableMetricsConfig
    const logLevel = yield* logLevelConfig
    const nodeEnv = yield* nodeEnvConfig

    return {
      ...DEFAULT_METRICS_CONFIG,
      enableMetrics,
      enableTracing: enableMetrics === true && nodeEnv !== 'production',
      logLevel: logLevel as 'debug' | 'info' | 'warn' | 'error',
      metricsInterval: nodeEnv === 'development' ? 10000 : 5000
    }
  })

// Load cache configuration from environment (following coding guide)
export const loadCacheConfig = () =>
  Effect.gen(function* () {
    const cacheEnabled = yield* cacheEnabledConfig
    const nodeEnv = yield* nodeEnvConfig

    return {
      ...DEFAULT_CACHE_CONFIG,
      enabled: cacheEnabled,
      maxSize: nodeEnv === 'development' ? 500 : 1000,
      ttlMs:
        nodeEnv === 'development'
          ? 5 * 60 * 1000 // 5 minutes in development
          : DEFAULT_CACHE_CONFIG.ttlMs, // 24 hours in production
      persistToDisk: nodeEnv !== 'test'
    }
  })

// Load complete system configuration (following coding guide)
export const loadSystemConfiguration = () =>
  Effect.gen(function* () {
    const generation = yield* loadGenerationOptions()
    const quality = yield* loadQualityThresholds()
    const openai = yield* loadOpenAIConfig()
    const metrics = yield* loadMetricsConfig()
    const cache = yield* loadCacheConfig()

    yield* Effect.log('System configuration loaded successfully')

    return {
      generation,
      quality,
      openai,
      metrics,
      cache
    }
  })

// Validate environment variables using Config (following coding guide)
export const validateEnvironment = () =>
  Effect.gen(function* () {
    // Validate required environment variables using Config pattern
    try {
      const apiKey = yield* openaiApiKeyConfig
      if (apiKey === undefined || apiKey === null || apiKey.trim().length === 0) {
        return yield* Effect.fail(
          new MissingEnvironmentVariableError({
            variable: 'OPENAI_API_KEY',
            required: true
          })
        )
      }
    } catch {
      return yield* Effect.fail(
        new MissingEnvironmentVariableError({
          variable: 'OPENAI_API_KEY',
          required: true
        })
      )
    }

    // Validate optional but important variables
    const nodeEnv = yield* nodeEnvConfig
    if (
      nodeEnv !== undefined &&
      ['development', 'production', 'test'].includes(nodeEnv) === false
    ) {
      yield* Effect.log(`Warning: Unexpected NODE_ENV value: ${nodeEnv}`)
    }

    yield* Effect.log('Environment validation completed')
  })

// Create configuration with validation (following coding guide)
export const createValidatedConfiguration = () =>
  Effect.gen(function* () {
    // First validate environment
    yield* validateEnvironment()

    // Then load configuration
    const config = yield* loadSystemConfiguration()

    // Log configuration summary (without sensitive data)
    yield* Effect.log(
      `Configuration loaded: OpenAI model=${config.openai.model}, target count=${config.generation.targetCount}`
    )

    return config
  })
