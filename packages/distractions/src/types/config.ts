// Note: @effect/schema not available in current setup, using basic validation

// Main configuration for distractor generation process
export interface DistractorGenerationOptions {
  readonly regenAll: boolean // Ignore existing distractors and regenerate all
  readonly regenIncomplete: boolean // Only regenerate if distractors.length < targetCount
  readonly targetCount: number // Target number of distractors per question (default: 15)
  readonly filterSimilar: boolean // Apply similarity filtering to remove duplicates
  readonly checkAnswers: boolean // Filter out distractors that appear as correct answers elsewhere
  readonly useOpenAI: boolean // Enable OpenAI generation for text questions
  readonly batchSize: number // Number of questions to process in each batch (default: 10)
  readonly maxRetries: number // Maximum retry attempts for failed operations (default: 3)
}

// Default configuration values
export const DEFAULT_GENERATION_OPTIONS: DistractorGenerationOptions = {
  regenAll: false,
  regenIncomplete: false,
  targetCount: 15,
  filterSimilar: true,
  checkAnswers: true,
  useOpenAI: true,
  batchSize: 10,
  maxRetries: 3
} as const

// Basic validation helpers (replace with @effect/schema when available)
export const validateGenerationOptions = (
  options: Partial<DistractorGenerationOptions>
): DistractorGenerationOptions => {
  return {
    regenAll: options.regenAll ?? DEFAULT_GENERATION_OPTIONS.regenAll,
    regenIncomplete: options.regenIncomplete ?? DEFAULT_GENERATION_OPTIONS.regenIncomplete,
    targetCount: Math.max(
      5,
      Math.min(20, options.targetCount ?? DEFAULT_GENERATION_OPTIONS.targetCount)
    ),
    filterSimilar: options.filterSimilar ?? DEFAULT_GENERATION_OPTIONS.filterSimilar,
    checkAnswers: options.checkAnswers ?? DEFAULT_GENERATION_OPTIONS.checkAnswers,
    useOpenAI: options.useOpenAI ?? DEFAULT_GENERATION_OPTIONS.useOpenAI,
    batchSize: Math.max(1, Math.min(50, options.batchSize ?? DEFAULT_GENERATION_OPTIONS.batchSize)),
    maxRetries: Math.max(
      1,
      Math.min(10, options.maxRetries ?? DEFAULT_GENERATION_OPTIONS.maxRetries)
    )
  }
}

// Quality assessment configuration
export interface QualityThresholds {
  readonly relevance: number // Minimum relevance score (0.0-1.0)
  readonly plausibility: number // Minimum plausibility score (0.0-1.0)
  readonly educationalValue: number // Minimum educational value score (0.0-1.0)
  readonly minLength: number // Minimum character length
  readonly maxLength: number // Maximum character length
  readonly similarityThreshold: number // Maximum similarity to existing answers (0.0-1.0)
}

export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  relevance: 0.7,
  plausibility: 0.6,
  educationalValue: 0.8,
  minLength: 3,
  maxLength: 200,
  similarityThreshold: 0.8
} as const

// OpenAI API configuration
export interface OpenAIConfiguration {
  readonly apiKey: string // OpenAI API key from environment
  readonly model: string // GPT model to use (default: 'gpt-4o-mini')
  readonly temperature: number // Response randomness (0.0-1.0)
  readonly maxTokens: number // Maximum tokens per response
  readonly requestsPerMinute: number // Rate limiting configuration
  readonly timeoutMs: number // Request timeout in milliseconds
}

export const DEFAULT_OPENAI_CONFIG: Omit<OpenAIConfiguration, 'apiKey'> = {
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 1000,
  requestsPerMinute: 60,
  timeoutMs: 30000
} as const

// Performance and observability configuration
export interface MetricsConfiguration {
  readonly enableMetrics: boolean // Enable metrics collection
  readonly enableTracing: boolean // Enable request tracing
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error' // Logging verbosity
  readonly metricsInterval: number // Metrics reporting interval (ms)
}

export const DEFAULT_METRICS_CONFIG: MetricsConfiguration = {
  enableMetrics: true,
  enableTracing: true,
  logLevel: 'info',
  metricsInterval: 5000
} as const

// Cache configuration for OpenAI responses
export interface CacheConfiguration {
  readonly enabled: boolean // Enable response caching
  readonly maxSize: number // Maximum cache entries
  readonly ttlMs: number // Time to live in milliseconds
  readonly persistToDisk: boolean // Persist cache to disk between runs
  readonly cacheDirectory: string // Directory for disk cache
}

export const DEFAULT_CACHE_CONFIG: CacheConfiguration = {
  enabled: true,
  maxSize: 1000,
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
  persistToDisk: true,
  cacheDirectory: '.cache/openai'
} as const

// Environment validation helper
export const validateEnvironmentConfig = (env: NodeJS.ProcessEnv) => {
  const config = {
    OPENAI_API_KEY: env['OPENAI_API_KEY'] ?? '',
    NODE_ENV: env['NODE_ENV'] ?? 'development',
    LOG_LEVEL: env['LOG_LEVEL'] ?? 'info',
    DISTRACTOR_TARGET_COUNT: parseInt(env['DISTRACTOR_TARGET_COUNT'] ?? '15'),
    ENABLE_METRICS: env['ENABLE_METRICS'] !== 'false',
    CACHE_ENABLED: env['CACHE_ENABLED'] !== 'false'
  }

  return config
}

// Complete system configuration combining all aspects
export interface SystemConfiguration {
  readonly generation: DistractorGenerationOptions
  readonly quality: QualityThresholds
  readonly openai: OpenAIConfiguration
  readonly metrics: MetricsConfiguration
  readonly cache: CacheConfiguration
}

// Configuration factory with environment overrides
export const createSystemConfiguration = (
  overrides?: Partial<SystemConfiguration>
): SystemConfiguration => ({
  generation: { ...DEFAULT_GENERATION_OPTIONS, ...overrides?.generation },
  quality: { ...DEFAULT_QUALITY_THRESHOLDS, ...overrides?.quality },
  openai: {
    ...DEFAULT_OPENAI_CONFIG,
    apiKey: process.env['OPENAI_API_KEY'] ?? '',
    ...overrides?.openai
  },
  metrics: { ...DEFAULT_METRICS_CONFIG, ...overrides?.metrics },
  cache: { ...DEFAULT_CACHE_CONFIG, ...overrides?.cache }
})
