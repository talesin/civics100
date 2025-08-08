import { Effect, Config } from 'effect'
import type { 
  SystemConfiguration, 
  DistractorGenerationOptions,
  QualityThresholds,
  OpenAIConfiguration,
  MetricsConfiguration,
  CacheConfiguration
} from './types/config'
import { 
  DEFAULT_GENERATION_OPTIONS,
  DEFAULT_QUALITY_THRESHOLDS,
  DEFAULT_OPENAI_CONFIG,
  DEFAULT_METRICS_CONFIG,
  DEFAULT_CACHE_CONFIG,
  validateEnvironmentConfig
} from './types/config'
import type { ConfigurationError } from './types/errors'

// Environment variable configuration with Effect Config
const OpenAIApiKey = Config.string('OPENAI_API_KEY')
const NodeEnv = Config.string('NODE_ENV').pipe(Config.withDefault('development'))
const LogLevel = Config.string('LOG_LEVEL').pipe(Config.withDefault('info'))
const DistractorTargetCount = Config.integer('DISTRACTOR_TARGET_COUNT').pipe(Config.withDefault(15))
const EnableMetrics = Config.boolean('ENABLE_METRICS').pipe(Config.withDefault(true))
const CacheEnabled = Config.boolean('CACHE_ENABLED').pipe(Config.withDefault(true))

// OpenAI specific configuration
const OpenAIModel = Config.string('OPENAI_MODEL').pipe(Config.withDefault('gpt-4o-mini'))
const OpenAITemperature = Config.number('OPENAI_TEMPERATURE').pipe(Config.withDefault(0.7))
const OpenAIMaxTokens = Config.integer('OPENAI_MAX_TOKENS').pipe(Config.withDefault(1000))
const OpenAIRequestsPerMinute = Config.integer('OPENAI_REQUESTS_PER_MINUTE').pipe(Config.withDefault(60))
const OpenAITimeoutMs = Config.integer('OPENAI_TIMEOUT_MS').pipe(Config.withDefault(30000))

// Load OpenAI configuration from environment (following coding guide)
export const loadOpenAIConfig = () =>
  Effect.gen(function* (): Effect.Effect<OpenAIConfiguration, ConfigurationError> {
    const apiKey = yield* OpenAIApiKey
    const model = yield* OpenAIModel
    const temperature = yield* OpenAITemperature
    const maxTokens = yield* OpenAIMaxTokens
    const requestsPerMinute = yield* OpenAIRequestsPerMinute
    const timeoutMs = yield* OpenAITimeoutMs
    
    // Validate API key
    if (!apiKey || apiKey.trim().length === 0) {
      return yield* Effect.fail(new (require('./types/errors').ConfigurationError)({
        cause: new Error('Missing API key'),
        setting: 'OPENAI_API_KEY',
        value: apiKey,
        reason: 'API key is required for OpenAI integration'
      }))
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
  Effect.gen(function* (): Effect.Effect<DistractorGenerationOptions, never> {
    const targetCount = yield* DistractorTargetCount
    const nodeEnv = yield* NodeEnv
    
    return {
      ...DEFAULT_GENERATION_OPTIONS,
      targetCount: Math.max(5, Math.min(20, targetCount)), // Clamp to 5-20
      useOpenAI: nodeEnv !== 'test', // Disable OpenAI in test environment
      batchSize: nodeEnv === 'development' ? 5 : 10 // Smaller batches in dev
    }
  })

// Load quality thresholds from environment (following coding guide)
export const loadQualityThresholds = () =>
  Effect.gen(function* (): Effect.Effect<QualityThresholds, never> {
    const nodeEnv = yield* NodeEnv
    
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
  Effect.gen(function* (): Effect.Effect<MetricsConfiguration, never> {
    const enableMetrics = yield* EnableMetrics
    const logLevel = yield* LogLevel
    const nodeEnv = yield* NodeEnv
    
    return {
      ...DEFAULT_METRICS_CONFIG,
      enableMetrics,
      enableTracing: enableMetrics && nodeEnv !== 'production',
      logLevel: logLevel as 'debug' | 'info' | 'warn' | 'error',
      metricsInterval: nodeEnv === 'development' ? 10000 : 5000
    }
  })

// Load cache configuration from environment (following coding guide)
export const loadCacheConfig = () =>
  Effect.gen(function* (): Effect.Effect<CacheConfiguration, never> {
    const cacheEnabled = yield* CacheEnabled
    const nodeEnv = yield* NodeEnv
    
    return {
      ...DEFAULT_CACHE_CONFIG,
      enabled: cacheEnabled,
      maxSize: nodeEnv === 'development' ? 500 : 1000,
      ttlMs: nodeEnv === 'development' 
        ? 5 * 60 * 1000  // 5 minutes in development
        : DEFAULT_CACHE_CONFIG.ttlMs, // 24 hours in production
      persistToDisk: nodeEnv !== 'test'
    }
  })

// Load complete system configuration (following coding guide)
export const loadSystemConfiguration = () =>
  Effect.gen(function* (): Effect.Effect<SystemConfiguration, ConfigurationError> {
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

// Validate environment variables (following coding guide)
export const validateEnvironment = () =>
  Effect.gen(function* (): Effect.Effect<void, ConfigurationError> {
    // Validate required environment variables
    const requiredVars = ['OPENAI_API_KEY']
    
    for (const varName of requiredVars) {
      const value = process.env[varName]
      if (!value || value.trim().length === 0) {
        return yield* Effect.fail(new (require('./types/errors').MissingEnvironmentVariableError)({
          variable: varName,
          required: true
        }))
      }
    }
    
    // Validate optional but important variables
    const nodeEnv = process.env.NODE_ENV
    if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
      yield* Effect.log(`Warning: Unexpected NODE_ENV value: ${nodeEnv}`)
    }
    
    yield* Effect.log('Environment validation completed')
  })

// Create configuration with validation (following coding guide)
export const createValidatedConfiguration = () =>
  Effect.gen(function* (): Effect.Effect<SystemConfiguration, ConfigurationError> {
    // First validate environment
    yield* validateEnvironment()
    
    // Then load configuration
    const config = yield* loadSystemConfiguration()
    
    // Log configuration summary (without sensitive data)
    yield* Effect.log(`Configuration loaded: OpenAI model=${config.openai.model}, target count=${config.generation.targetCount}`)
    
    return config
  })