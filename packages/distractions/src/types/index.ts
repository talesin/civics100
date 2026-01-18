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
  | 'openai-text'
  | 'fallback'

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

// Scored distractor from OpenAI with relevance rating
export interface ScoredDistractor {
  readonly text: string
  readonly relevance: number // 1-10 scale from OpenAI
}

export interface OpenAIResponse {
  readonly distractors: readonly ScoredDistractor[]
  readonly confidence: number
  readonly tokensUsed: number
}

