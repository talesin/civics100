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
export const openaiTemperatureConfig = Config.number('OPENAI_TEMPERATURE').pipe(
  Config.withDefault(0.7)
)
export const openaiMaxTokensConfig = Config.integer('OPENAI_MAX_TOKENS').pipe(
  Config.withDefault(1000)
)
export const openaiTimeoutConfig = Config.number('OPENAI_TIMEOUT_MS').pipe(
  Config.withDefault(30000)
)
export const openaiMaxRetriesConfig = Config.integer('OPENAI_MAX_RETRIES').pipe(
  Config.withDefault(3)
)

// Rate limiting configuration
export const openaiRateLimitRpmConfig = Config.number('OPENAI_RATE_LIMIT_RPM').pipe(
  Config.withDefault(60)
)
export const openaiRequestsPerMinuteConfig = openaiRateLimitRpmConfig // Alias for consistency

// Cache configuration
export const openaiCacheSizeConfig = Config.integer('OPENAI_CACHE_SIZE').pipe(
  Config.withDefault(1000)
)
export const openaiCacheTTLHoursConfig = Config.number('OPENAI_CACHE_TTL_HOURS').pipe(
  Config.withDefault(24)
)
export const cacheTtlSecondsConfig = Config.integer('CACHE_TTL_SECONDS').pipe(
  Config.withDefault(3600)
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
  openaiTemperature: openaiTemperatureConfig,
  openaiMaxTokens: openaiMaxTokensConfig,
  openaiTimeoutMs: openaiTimeoutConfig,
  openaiMaxRetries: openaiMaxRetriesConfig,
  openaiRateLimitRpm: openaiRateLimitRpmConfig,
  openaiCacheSize: openaiCacheSizeConfig,
  openaiCacheTTLHours: openaiCacheTTLHoursConfig,
  cacheTtlSeconds: cacheTtlSecondsConfig
})

export type EnvironmentConfig = Config.Config.Success<typeof environmentConfig>
