import { Data } from 'effect'

// OpenAI API related errors
export class OpenAIError extends Data.TaggedError('OpenAIError')<{
  readonly cause: unknown
  readonly requestId?: string
}> {}

export class OpenAIRateLimitError extends Data.TaggedError('OpenAIRateLimitError')<{
  readonly cause: unknown
  readonly retryAfter?: number
  readonly requestsRemaining?: number
}> {}

export class OpenAIAuthError extends Data.TaggedError('OpenAIAuthError')<{
  readonly cause: unknown
  readonly message: string
}> {}

export class OpenAITimeoutError extends Data.TaggedError('OpenAITimeoutError')<{
  readonly cause: unknown
  readonly timeoutMs: number
}> {}

// Parsing and validation errors
export class ParseError extends Data.TaggedError('ParseError')<{
  readonly cause: unknown
  readonly input: string
  readonly expectedFormat: string
}> {}

export class ValidationError extends Data.TaggedError('ValidationError')<{
  readonly cause: unknown
  readonly field: string
  readonly value: unknown
  readonly constraint: string
}> {}

// Question processing errors
export class InvalidQuestionTypeError extends Data.TaggedError('InvalidQuestionTypeError')<{
  readonly questionId: number
  readonly expected?: string
  readonly actual: string
}> {}

export class InsufficientDistractorsError extends Data.TaggedError('InsufficientDistractorsError')<{
  readonly questionId: number
  readonly required: number
  readonly available: number
}> {}

export class QualityAssessmentError extends Data.TaggedError('QualityAssessmentError')<{
  readonly questionId: number
  readonly distractor: string
  readonly failedCriteria: readonly string[]
}> {}

// File system and I/O errors
export class FileSystemError extends Data.TaggedError('FileSystemError')<{
  readonly cause: unknown
  readonly operation: 'read' | 'write' | 'create' | 'delete'
  readonly path: string
}> {}

export class ConfigurationError extends Data.TaggedError('ConfigurationError')<{
  readonly cause: unknown
  readonly setting: string
  readonly value: unknown
  readonly reason: string
}> {}

// Environment and setup errors
export class MissingEnvironmentVariableError extends Data.TaggedError(
  'MissingEnvironmentVariableError'
)<{
  readonly variable: string
  readonly required: boolean
}> {}

export class ServiceInitializationError extends Data.TaggedError('ServiceInitializationError')<{
  readonly cause: unknown
  readonly serviceName: string
  readonly stage: string
}> {}

// Similarity and deduplication errors
export class SimilarityCalculationError extends Data.TaggedError('SimilarityCalculationError')<{
  readonly cause: unknown
  readonly text1: string
  readonly text2: string
}> {}

// Batch processing errors
export class BatchProcessingError extends Data.TaggedError('BatchProcessingError')<{
  readonly cause: unknown
  readonly batchIndex: number
  readonly totalBatches: number
  readonly failedQuestions: readonly number[]
}> {}

// Union type for all possible errors
export type DistractorGenerationError =
  | OpenAIError
  | OpenAIRateLimitError
  | OpenAIAuthError
  | OpenAITimeoutError
  | ParseError
  | ValidationError
  | InvalidQuestionTypeError
  | InsufficientDistractorsError
  | QualityAssessmentError
  | FileSystemError
  | ConfigurationError
  | MissingEnvironmentVariableError
  | ServiceInitializationError
  | SimilarityCalculationError
  | BatchProcessingError

// Error categorization helpers
export const isRetryableError = (error: DistractorGenerationError): boolean => {
  switch (error._tag) {
    case 'OpenAIRateLimitError':
    case 'OpenAITimeoutError':
    case 'FileSystemError':
      return true
    case 'OpenAIAuthError':
    case 'ValidationError':
    case 'ConfigurationError':
    case 'MissingEnvironmentVariableError':
      return false
    default:
      return true
  }
}

export const getErrorSeverity = (
  error: DistractorGenerationError
): 'low' | 'medium' | 'high' | 'critical' => {
  switch (error._tag) {
    case 'OpenAIAuthError':
    case 'MissingEnvironmentVariableError':
    case 'ConfigurationError':
      return 'critical'
    case 'ServiceInitializationError':
    case 'FileSystemError':
      return 'high'
    case 'OpenAIRateLimitError':
    case 'BatchProcessingError':
      return 'medium'
    default:
      return 'low'
  }
}
