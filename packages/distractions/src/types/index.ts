import type { Question } from 'civics2json'

// Core distractor generation types
export interface DistractorGenerationResult {
  readonly question: Question
  readonly distractors: readonly string[]
  readonly strategy: DistractorStrategy
  readonly quality: QualityMetrics
}

export interface QualityMetrics {
  readonly relevanceScore: number
  readonly plausibilityScore: number
  readonly educationalValue: number
  readonly duplicatesRemoved: number
  readonly totalGenerated: number
}

export type DistractorStrategy =
  | 'curated'
  | 'section-based'
  | 'openai-text'
  | 'static-pool'
  | 'hybrid'

// Question processing context
export interface QuestionContext {
  readonly questionId: number
  readonly questionType: string
  readonly section: string
  readonly theme: string
  readonly correctAnswers: readonly string[]
}

// Generation configuration
export interface GenerationContext {
  readonly targetCount: number
  readonly useOpenAI: boolean
  readonly fallbackToStatic: boolean
  readonly qualityThreshold: number
}

// Service interfaces
export interface OpenAIRequest {
  readonly question: string
  readonly answerType: string
  readonly context: string
  readonly targetCount: number
}

export interface OpenAIResponse {
  readonly distractors: readonly string[]
  readonly confidence: number
  readonly tokensUsed: number
}

// Question complexity analysis types
export interface QuestionComplexity {
  readonly type: 'simple-fact' | 'conceptual' | 'analytical' | 'comparative'
  readonly difficulty: 1 | 2 | 3 | 4 | 5
  readonly cognitiveLevel: 'recall' | 'understand' | 'apply' | 'analyze'
}

// Cost estimation for strategy selection
export interface CostEstimate {
  readonly estimatedTokens: number
  readonly estimatedCost: number // USD
  readonly shouldUseOpenAI: boolean
}

// Temporal context for pool filtering
export interface TemporalContext {
  readonly era: 'historical' | 'modern' | 'current'
  readonly relevantYears?: readonly [number, number]
}

// Fallback chain type alias
export type FallbackChain = readonly DistractorStrategy[]
