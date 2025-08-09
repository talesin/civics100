/* eslint-disable @typescript-eslint/no-unused-vars */
import { Effect, Layer, Config } from 'effect'
import * as Metric from 'effect/Metric'
import * as Cache from 'effect/Cache'
import OpenAI from 'openai'
import type { Question } from 'civics2json'
import type { OpenAIRequest, OpenAIResponse } from '@src/types/index'
import {
  OpenAIError,
  OpenAIRateLimitError,
  OpenAIAuthError,
  OpenAITimeoutError,
  ConfigurationError
} from '@src/types/errors'
import { createOpenAIRateLimiter, withRateLimit } from '@src/utils/rate-limiter'
import {
  createOpenAIResponseCache,
  cacheOpenAIResponse,
  generateOpenAICacheKey
} from '@src/utils/cache'
import { DistractorMetrics, measureAndTrack, measureDuration } from '@src/utils/metrics'

// OpenAI configuration with Effect Config
const OpenAIApiKey = Config.string('OPENAI_API_KEY')
const OpenAIModel = Config.string('OPENAI_MODEL').pipe(Config.withDefault('gpt-4o-mini'))
const OpenAITemperature = Config.number('OPENAI_TEMPERATURE').pipe(Config.withDefault(0.7))
const OpenAIMaxTokens = Config.number('OPENAI_MAX_TOKENS').pipe(Config.withDefault(1000))
const OpenAITimeout = Config.number('OPENAI_TIMEOUT_MS').pipe(Config.withDefault(30000))
const OpenAIRequestsPerMinute = Config.number('OPENAI_REQUESTS_PER_MINUTE').pipe(
  Config.withDefault(60)
)
const OpenAICacheSize = Config.number('OPENAI_CACHE_SIZE').pipe(Config.withDefault(1000))
const OpenAICacheTTLHours = Config.number('OPENAI_CACHE_TTL_HOURS').pipe(Config.withDefault(24))

// Helper function to create OpenAI client instance
const createOpenAIClient = () =>
  Effect.fn(function* () {
    const apiKey = yield* OpenAIApiKey
    const timeout = yield* OpenAITimeout

    return new OpenAI({
      apiKey,
      timeout
    })
  })

// Helper function to build prompt for different question types
const buildPrompt = (request: OpenAIRequest): string => {
  const baseInstructions = `You are an expert in creating educational multiple-choice question distractors for U.S. Civics tests. Your task is to generate plausible but incorrect answers that will challenge students' understanding.

IMPORTANT REQUIREMENTS:
- Generate EXACTLY ${request.targetCount} distractors
- Each distractor must be plausible but clearly incorrect
- Avoid obviously wrong or silly answers
- Match the format and style of the correct answer
- Focus on common misconceptions or closely related concepts
- Return ONLY a JSON array of strings, no additional text

Question: ${request.question}
Question Type: ${request.answerType}
Context: ${request.context}`

  // Add specific guidance based on question type
  switch (request.answerType) {
    case 'text':
      return `${baseInstructions}

For text-based civics questions:
- Use concepts from the same domain (government, history, law)
- Include common misconceptions students might have
- Ensure distractors are at appropriate difficulty level
- Avoid anachronisms or clearly impossible answers`

    case 'senator':
      return `${baseInstructions}

For senator-related questions:
- Use names of actual current or former senators
- Include senators from different states/parties
- Format: "Full Name (STATE-Party)" if applicable
- Avoid using senators from the same state as the correct answer`

    case 'representative':
      return `${baseInstructions}

For representative-related questions:
- Use names of actual current or former representatives
- Include representatives from different districts
- Format: "Full Name (STATE-District)" if applicable
- Vary political parties and geographic regions`

    case 'governor':
      return `${baseInstructions}

For governor-related questions:
- Use names of actual current or former governors
- Include governors from different states and time periods
- Vary political parties
- Avoid using governors from the same state as the correct answer`

    case 'capital':
      return `${baseInstructions}

For capital city questions:
- Use names of actual major cities
- Include large cities that are NOT capitals of their states
- Consider historical capitals or major cities from the same region
- Avoid obviously wrong answers like very small towns`

    default:
      return baseInstructions
  }
}

// Core function for generating distractors via OpenAI (following coding guide)
export const generateDistractorsWithOpenAI = (
  cache?: Cache.Cache<string, OpenAIResponse>
) =>
  Effect.fn(function* (request: OpenAIRequest) {
    // Track total OpenAI requests
    yield* Metric.increment(DistractorMetrics.openaiRequestsTotal)

    // Use caching if cache is provided
    if (cache !== undefined) {
      yield* Effect.log(`Checking cache for OpenAI request: ${generateOpenAICacheKey(request)}`)
      const cachedOperation = cacheOpenAIResponse(
        cache,
        request,
        generateDistractorsUncachedWithMetrics(request)
      )
      return yield* measureDuration(DistractorMetrics.openaiResponseTime, cachedOperation)
    }

    // Fall back to uncached generation with metrics
    return yield* generateDistractorsUncachedWithMetrics(request)
  })

// Metrics-wrapped version of uncached generation
const generateDistractorsUncachedWithMetrics = (request: OpenAIRequest) =>
  measureAndTrack(
    DistractorMetrics.openaiRequestsSuccess,
    DistractorMetrics.openaiRequestsFailure,
    DistractorMetrics.openaiResponseTime,
    generateDistractorsUncached(request)
  )

// Uncached generation function (separated for caching)
const generateDistractorsUncached = (request: OpenAIRequest) =>
  Effect.scoped(Effect.gen(function* () {
    const client = yield* createOpenAIClient()()
    const model = yield* OpenAIModel
    const temperature = yield* OpenAITemperature
    const maxTokens = yield* OpenAIMaxTokens
    const requestsPerMinute = yield* OpenAIRequestsPerMinute

    // Create rate limiter for this service instance
    const rateLimiter = yield* createOpenAIRateLimiter(requestsPerMinute)

    yield* Effect.log(
      `Generating ${request.targetCount} distractors for question: ${request.question.slice(0, 50)}... (rate limited to ${requestsPerMinute}/min)`
    )

    const prompt = buildPrompt(request)

    // Wrap the API call with rate limiting
    const rateLimitedAPICall = withRateLimit(
      rateLimiter,
      Effect.gen(function* () {
        const startTime = Date.now()

        const completion = yield* Effect.tryPromise({
          try: () =>
            client.chat.completions.create({
              model,
              messages: [
                {
                  role: 'system',
                  content:
                    'You are an expert educational content creator specializing in U.S. Civics assessments. Always respond with valid JSON arrays only.'
                },
                {
                  role: 'user',
                  content: prompt
                }
              ],
              temperature,
              max_tokens: maxTokens,
              response_format: { type: 'json_object' }
            }),
          catch: (error) => {
            if (error instanceof Error) {
              // Handle specific OpenAI API errors
              if (error.message.includes('rate limit')) {
                return new OpenAIRateLimitError({ cause: error })
              }
              if (
                error.message.includes('authentication') ||
                error.message.includes('invalid_api_key')
              ) {
                return new OpenAIAuthError({ cause: error, message: error.message ?? 'OpenAI authentication failed' })
              }
              if (error.message.includes('timeout')) {
                return new OpenAITimeoutError({ cause: error, timeoutMs: 30000 })
              }
            }
            return new OpenAIError({
              cause: error instanceof Error ? error : new Error(String(error))
            })
          }
        })

        const responseTime = Date.now() - startTime
        const tokensUsed = completion.usage?.total_tokens ?? 0

        // Parse the response content
        const content = completion.choices[0]?.message?.content
        if (content === undefined || content === null || content === '') {
          return yield* Effect.fail(
            new OpenAIError({ cause: new Error('Empty response from OpenAI') })
          )
        }

        const parsedResponse = yield* Effect.tryPromise({
          try: () => Promise.resolve(JSON.parse(content)),
          catch: () => new OpenAIError({ cause: new Error('Invalid JSON response from OpenAI') })
        })

        // Extract distractors array - handle different possible response formats
        let distractors: string[]
        if (Array.isArray(parsedResponse) === true) {
          distractors = parsedResponse
        } else if (
          parsedResponse.distractors !== undefined &&
          Array.isArray(parsedResponse.distractors) === true
        ) {
          distractors = parsedResponse.distractors
        } else if (
          parsedResponse.answers !== undefined &&
          Array.isArray(parsedResponse.answers) === true
        ) {
          distractors = parsedResponse.answers
        } else {
          return yield* Effect.fail(
            new OpenAIError({
              cause: new Error('Response does not contain a valid distractors array')
            })
          )
        }

        // Validate distractors
        if (Array.isArray(distractors) === false || distractors.length === 0) {
          return yield* Effect.fail(
            new OpenAIError({
              cause: new Error('No valid distractors found in response')
            })
          )
        }

        // Filter to strings only and trim whitespace
        const validDistractors = distractors
          .filter((d): d is string => typeof d === 'string')
          .map((d) => d.trim())
          .filter((d) => d.length > 0)

        if (validDistractors.length === 0) {
          return yield* Effect.fail(
            new OpenAIError({
              cause: new Error('No valid string distractors found in response')
            })
          )
        }

        // Calculate confidence based on response quality indicators
        const confidence = Math.min(
          0.95,
          Math.max(0.5, (validDistractors.length / request.targetCount) * 0.9)
        )

        // Track metrics for generated distractors
        yield* Metric.incrementBy(DistractorMetrics.distractorsGenerated, validDistractors.length)
        yield* Metric.update(DistractorMetrics.distractorQualityScore, confidence)

        yield* Effect.log(
          `Generated ${validDistractors.length} distractors in ${responseTime}ms using ${tokensUsed} tokens (confidence: ${confidence})`
        )

        return yield* Effect.succeed({
          distractors: validDistractors.slice(0, request.targetCount),
          confidence,
          tokensUsed
        })
      })
    )

    return yield* rateLimitedAPICall
  }))

// Function to create OpenAI request from question (following coding guide)
// Helper function to extract answer text from complex answer choices
const extractAnswerText = (choice: Question['answers']['choices'][number]): string => {
  if (typeof choice === 'string') {
    return choice
  }
  if (typeof choice === 'object') {
    // Handle different answer types
    if ('senator' in choice) return choice.senator
    if ('representative' in choice) return choice.representative
    if ('governor' in choice) return choice.governor
    if ('capital' in choice) return choice.capital
  }
  return String(choice)
}

// Helper function to get examples based on question theme and section
const getDistractorExamples = (answerType: string, _theme: string, _section: string) => {
  const examples: Record<string, { good: string[]; bad: string[]; guidance: string }> = {
    text: {
      good: [
        'For a Constitution question: "the Bill of Rights" (related but incorrect)',
        'For a democracy question: "representative republic" (close concept but wrong)',
        'For a founding fathers question: "Benjamin Franklin" (relevant person, wrong context)'
      ],
      bad: [
        'Obviously silly answers like "pizza" or "unicorns"',
        "Anachronistic answers that couldn't exist in the time period",
        'Answers that are completely unrelated to civics/government'
      ],
      guidance:
        'Focus on concepts from the same domain that students might confuse with the correct answer.'
    },
    senator: {
      good: [
        'Current senators from different states with proper formatting',
        'Former notable senators who served recently',
        'Mix of different political parties for balance'
      ],
      bad: [
        'Senators from the same state as the correct answer',
        'Representatives or governors mistaken for senators',
        'Fictional or non-political figures'
      ],
      guidance:
        'Use actual senator names with proper state abbreviations and party affiliations when applicable.'
    },
    representative: {
      good: [
        'Current House members from various districts',
        'Representatives with different seniority levels',
        'Mix of urban and rural district representatives'
      ],
      bad: [
        'Representatives from the same district',
        'Senators or other officials confused as representatives',
        'People who never served in the House'
      ],
      guidance: 'Include district information when relevant and vary geographic regions.'
    },
    governor: {
      good: [
        'Current or recent former governors from different states',
        'Governors from different time periods if historically relevant',
        'Mix of different political backgrounds'
      ],
      bad: [
        'Governors from the same state as the correct answer',
        'Federal officials who never served as governor',
        'Local mayors or other state officials'
      ],
      guidance: 'Focus on actual gubernatorial experience and avoid same-state conflicts.'
    },
    capital: {
      good: [
        'Major cities that are NOT state capitals',
        'Former capital cities of the same state',
        'Large cities from the same geographic region'
      ],
      bad: [
        'Very small towns that would be obviously wrong',
        'Foreign cities or capitals',
        'Cities from completely different regions without reason'
      ],
      guidance:
        'Use plausible major cities that students might reasonably confuse with the actual capital.'
    }
  }

  return examples[answerType] ?? examples['text']
}

export const createOpenAIRequest = () =>
  Effect.fn(function* (question: Question, targetCount: number = 10) {
    const answerType = question.answers._type
    const correctAnswers = question.answers.choices.map(extractAnswerText)
    const examples = getDistractorExamples(answerType, question.theme, question.section)

    // Create comprehensive context with educational guidance
    const educationalContext = `
EDUCATIONAL CONTEXT:
- Theme: ${question.theme}
- Section: ${question.section}
- Question Type: ${answerType}
- Correct Answer(s): ${correctAnswers.join(', ')}

DISTRACTOR QUALITY GUIDELINES:
${examples?.guidance ?? 'Follow standard quality guidelines'}

GOOD DISTRACTOR EXAMPLES for ${answerType} questions:
${examples?.good?.map((ex) => `• ${ex}`).join('\n') ?? 'N/A'}

BAD DISTRACTOR EXAMPLES to avoid:
${examples?.bad?.map((ex) => `• ${ex}`).join('\n') ?? 'N/A'}

DIFFICULTY CONSIDERATIONS:
- Match the complexity level of the correct answer
- Consider common student misconceptions in ${question.theme}
- Ensure distractors test understanding, not just memorization
- For ${question.section}: focus on concepts students commonly confuse in this area
`

    // Create specialized instructions based on answer type
    let formatInstructions = ''
    switch (answerType) {
      case 'senator':
        formatInstructions = `
FORMAT REQUIREMENTS:
- Use format: "Full Name (STATE-Party)" where applicable
- Example: "John Smith (CA-D)" or "Jane Doe (TX-R)"
- Use current or recent former senators
- Avoid senators from the same state as the correct answer`
        break
      case 'representative':
        formatInstructions = `
FORMAT REQUIREMENTS:
- Use format: "Full Name (STATE-District)" where applicable  
- Example: "John Smith (CA-12)" or "Jane Doe (TX-At Large)"
- Include representatives from different states/districts
- Mix urban and rural districts for variety`
        break
      case 'governor':
        formatInstructions = `
FORMAT REQUIREMENTS:
- Use full names of actual governors
- Include current and recent former governors
- Vary states and political affiliations
- Avoid governors from the same state as the correct answer`
        break
      case 'capital':
        formatInstructions = `
FORMAT REQUIREMENTS:
- Use actual city names
- Prefer major cities that are NOT state capitals
- Consider former capitals or major regional centers
- Match the geographic scale of the correct answer`
        break
      case 'text':
        formatInstructions = `
FORMAT REQUIREMENTS:
- Match the grammatical structure of correct answers
- Use concepts from civics, government, or American history
- Ensure distractors are plausible in the question context
- Avoid overly complex or overly simple alternatives`
        break
    }

    const context = educationalContext + formatInstructions

    return yield* Effect.succeed({
      question: question.question,
      answerType,
      context,
      targetCount
    })
  })

// Function to validate OpenAI configuration (following coding guide)
export const validateOpenAIConfig = () =>
  Effect.fn(function* () {
    const apiKey = yield* OpenAIApiKey

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

    if (apiKey.startsWith('sk-') === false) {
      return yield* Effect.fail(
        new ConfigurationError({
          cause: new Error('Invalid API key format'),
          setting: 'OPENAI_API_KEY',
          value: '[REDACTED]',
          reason: 'OpenAI API keys should start with "sk-"'
        })
      )
    }

    return yield* Effect.succeed(yield* Effect.log('OpenAI configuration validated successfully'))
  })

// Service class - minimal configuration (following coding guide)
export class OpenAIDistractorService extends Effect.Service<OpenAIDistractorService>()(
  'OpenAIDistractorService',
  {
    effect: Effect.gen(function* () {
      // Validate configuration on service initialization
      yield* validateOpenAIConfig()()

      // Initialize cache
      const cacheSize = yield* OpenAICacheSize
      const cacheTTL = yield* OpenAICacheTTLHours
      const responseCache = yield* createOpenAIResponseCache(cacheSize, cacheTTL)

      return {
        generateDistractors: generateDistractorsWithOpenAI(responseCache),
        createRequest: createOpenAIRequest(),
        validateConfig: validateOpenAIConfig(),
        cache: responseCache
      }
    })
  }
) {}

// Test layer following coding guide pattern
export const TestOpenAIDistractorServiceLayer = (fn?: {
  generateDistractors?: OpenAIDistractorService['generateDistractors']
  createRequest?: OpenAIDistractorService['createRequest']
  validateConfig?: OpenAIDistractorService['validateConfig']
  cache?: Cache.Cache<string, OpenAIResponse>
}) =>
  Layer.effect(
    OpenAIDistractorService,
    Effect.gen(function* () {
      const defaultCache = yield* createOpenAIResponseCache()
      return OpenAIDistractorService.of({
        _tag: 'OpenAIDistractorService',
        generateDistractors:
          fn?.generateDistractors ??
          (() =>
            Effect.succeed({
              distractors: ['Test distractor 1', 'Test distractor 2'],
              confidence: 0.9,
              tokensUsed: 100
            })),
        createRequest:
          fn?.createRequest ??
          (() =>
            Effect.succeed({
              question: 'Test question',
              answerType: 'text',
              context: 'Test context',
              targetCount: 10
            })),
        validateConfig: fn?.validateConfig ?? (() => Effect.succeed(undefined)),
        cache: fn?.cache ?? defaultCache
      })
    })
  )
