#!/usr/bin/env npx tsx

/**
 * OpenAI Integration Test Script
 *
 * This script tests the real OpenAI integration with a few sample questions
 * to validate the implementation before full production use.
 *
 * Usage:
 *   1. Set OPENAI_API_KEY in .env file
 *   2. Run: npx tsx scripts/test-openai-integration.ts
 */

import { Effect } from 'effect'
import { NodeContext, NodeRuntime } from '@effect/platform-node'
import { EnhancedStaticGenerator } from '../src/generators/EnhancedStaticGenerator'
import { DEFAULT_GENERATION_OPTIONS } from '../src/types/config'
import type { Question } from 'civics2json'

// Sample questions for testing
const sampleQuestions: Question[] = [
  {
    theme: 'AMERICAN GOVERNMENT',
    section: 'Principles of American Democracy',
    question: 'What is the supreme law of the land?',
    questionNumber: 1,
    expectedAnswers: 1,
    answers: {
      _type: 'text',
      choices: ['the Constitution']
    }
  },
  {
    theme: 'AMERICAN GOVERNMENT',
    section: 'System of Government',
    question: 'What does the Constitution do?',
    questionNumber: 2,
    expectedAnswers: 1,
    answers: {
      _type: 'text',
      choices: [
        'sets up the government',
        'defines the government',
        'protects basic rights of Americans'
      ]
    }
  },
  {
    theme: 'AMERICAN GOVERNMENT',
    section: 'Rights and Responsibilities',
    question: 'What is one right or freedom from the First Amendment?',
    questionNumber: 11,
    expectedAnswers: 1,
    answers: {
      _type: 'text',
      choices: [
        'speech',
        'religion',
        'assembly',
        'press',
        'petition the government'
      ]
    }
  }
]

const testOpenAIIntegration = Effect.gen(function* () {
  console.log('\n🧪 OpenAI Integration Test\n')
  console.log('=' .repeat(80))

  // Get the generator service
  const generator = yield* EnhancedStaticGenerator

  // Create test options with OpenAI enabled
  const options = {
    ...DEFAULT_GENERATION_OPTIONS,
    targetCount: 5,
    useOpenAI: true,
    filterSimilar: true,
    checkAnswers: true
  }

  console.log('\n📋 Test Configuration:')
  console.log(`  - Target distractors per question: ${options.targetCount}`)
  console.log(`  - OpenAI enabled: ${options.useOpenAI}`)
  console.log(`  - Similarity filtering: ${options.filterSimilar}`)
  console.log(`  - Answer checking: ${options.checkAnswers}`)
  console.log(`  - Sample questions: ${sampleQuestions.length}`)

  console.log('\n🚀 Starting generation...\n')
  const startTime = Date.now()

  // Generate distractors with custom questions layer
  const results = yield* generator.generateEnhanced(options)

  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)

  console.log('=' .repeat(80))
  console.log(`\n✅ Generation Complete! (${duration}s)\n`)
  console.log('=' .repeat(80))

  // Display results - filter to only show sample questions
  let totalDistractors = 0
  let sampleResults = 0

  results.forEach((result) => {
    if (sampleQuestionNumbers.has(result.questionNumber)) {
      sampleResults++
      console.log(`\n📝 Question ${result.questionNumber}: ${result.question}`)
      console.log(`   Correct Answer(s): ${result.answers.choices.join(', ')}`)
      console.log(`   Generated Distractors (${result.distractors.length}):`)

      result.distractors.forEach((distractor, i) => {
        console.log(`     ${i + 1}. ${distractor}`)
      })

      totalDistractors += result.distractors.length
    }
  })

  console.log('\n' + '='.repeat(80))
  console.log('\n📊 Summary:')
  console.log(`  - Sample questions displayed: ${sampleResults}`)
  console.log(`  - Total questions processed: ${results.length}`)
  console.log(`  - Total distractors for samples: ${totalDistractors}`)
  console.log(`  - Average per sample question: ${(totalDistractors / sampleResults).toFixed(1)}`)
  console.log(`  - Total time: ${duration}s`)
  console.log(`  - Average time per question: ${(parseFloat(duration) / results.length).toFixed(2)}s`)

  console.log('\n💡 Next Steps:')
  console.log('  1. Review distractor quality - are they plausible but incorrect?')
  console.log('  2. Check for variety - are they diverse or repetitive?')
  console.log('  3. Validate relevance - do they relate to the topic?')
  console.log('  4. Consider cost - check OpenAI usage at platform.openai.com')

  console.log('\n✨ Test completed successfully!\n')
})

// For testing purposes, we'll run against all questions but only display the sample ones
// This is simpler than fighting Effect layer composition
const sampleQuestionNumbers = new Set(sampleQuestions.map(q => q.questionNumber))

const program = testOpenAIIntegration.pipe(
  Effect.provide(EnhancedStaticGenerator.Default),
  Effect.provide(NodeContext.layer),
  Effect.catchAll((error) =>
    Effect.gen(function* () {
      console.error('\n❌ Test Failed!\n')
      console.error('Error:', error)

      if (error instanceof Error) {
        if (error.message.includes('OPENAI_API_KEY')) {
          console.error('\n💡 Tip: Make sure OPENAI_API_KEY is set in your .env file')
          console.error('   cp .env.example .env')
          console.error('   # Then edit .env and add your API key\n')
        }
      }

      return yield* Effect.fail(error)
    })
  )
)

NodeRuntime.runMain(program)
