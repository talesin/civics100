import { Config } from 'effect'

/**
 * Environment variable configuration declarations using Effect Config patterns.
 * These replace direct process.env usage throughout the codebase.
 */

// Required environment variables
export const openaiApiKeyConfig = Config.string('OPENAI_API_KEY')

// Optional environment variables with defaults
export const nodeEnvConfig = Config.string('NODE_ENV').pipe(Config.withDefault('development'))
export const logLevelConfig = Config.string('LOG_LEVEL').pipe(Config.withDefault('info'))

// OpenAI-specific configuration
export const openaiModelConfig = Config.string('OPENAI_MODEL').pipe(
  Config.withDefault('gpt-5-mini')
)
export const openaiTimeoutConfig = Config.string('OPENAI_TIMEOUT_MS').pipe(
  Config.withDefault('30000'),
  Config.map(Number)
)
export const openaiMaxRetriesConfig = Config.string('OPENAI_MAX_RETRIES').pipe(
  Config.withDefault('3'),
  Config.map(Number)
)

// Rate limiting configuration
export const openaiRateLimitRpmConfig = Config.string('OPENAI_RATE_LIMIT_RPM').pipe(
  Config.withDefault('60'),
  Config.map(Number)
)

// Cache configuration
export const cacheTtlSecondsConfig = Config.string('CACHE_TTL_SECONDS').pipe(
  Config.withDefault('3600'),
  Config.map(Number)
)

// Test environment detection
export const isTestEnv = nodeEnvConfig.pipe(Config.map((env) => env === 'test'))
export const isDevelopment = nodeEnvConfig.pipe(Config.map((env) => env === 'development'))
export const isProduction = nodeEnvConfig.pipe(Config.map((env) => env === 'production'))

/**
 * Combined configuration object that includes all environment-based settings
 */
export const environmentConfig = Config.all({
  openaiApiKey: openaiApiKeyConfig,
  nodeEnv: nodeEnvConfig,
  logLevel: logLevelConfig,
  openaiModel: openaiModelConfig,
  openaiTimeoutMs: openaiTimeoutConfig,
  openaiMaxRetries: openaiMaxRetriesConfig,
  openaiRateLimitRpm: openaiRateLimitRpmConfig,
  cacheTtlSeconds: cacheTtlSecondsConfig
})

export type EnvironmentConfig = Config.Config.Success<typeof environmentConfig>
