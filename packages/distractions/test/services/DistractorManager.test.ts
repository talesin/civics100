import { describe, it, expect, jest } from '@jest/globals'
import { Effect } from 'effect'
import { generateAndWrite } from '../../src/services/DistractorManager'
import { QuestionWithDistractors } from '../../src/generators/StaticGenerator'
import { TestEnhancedStaticGeneratorLayer } from '../../src/generators/EnhancedStaticGenerator'
import { FileSystem, Path } from '@effect/platform'
import { EnhancedStaticGenerator } from '../../src/generators/EnhancedStaticGenerator'
import { DEFAULT_GENERATION_OPTIONS } from '../../src/types/config'

describe('DistractorManager', () => {
  it('should generate and write distractors to a file', async () => {
    const question: QuestionWithDistractors = {
      _tag: 'QuestionWithDistractors',
      questionNumber: 1,
      distractors: ['d1'],
      theme: 'theme',
      section: 'section',
      question: 'question',
      expectedAnswers: 1,
      answers: {
        _type: 'text',
        choices: ['a', 'b', 'c', 'd']
      }
    }

    const mockGenerateEnhanced = jest.fn(() => Effect.succeed([question]))

    const enhancedGeneratorTestLayer = TestEnhancedStaticGeneratorLayer({
      generateEnhanced: mockGenerateEnhanced
    })

    let wroteFile = false
    const fileSystemTestLayer = FileSystem.layerNoop({
      writeFile: () => {
        wroteFile = true
        return Effect.succeed(undefined)
      }
    })
    const pathTestLayer = Path.layer

    await Effect.gen(function* () {
      const generator = yield* EnhancedStaticGenerator
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path
      yield* generateAndWrite(generator, fs, path, DEFAULT_GENERATION_OPTIONS)()

      expect(wroteFile).toBe(true)
    }).pipe(
      Effect.provide(enhancedGeneratorTestLayer),
      Effect.provide(fileSystemTestLayer),
      Effect.provide(pathTestLayer),
      Effect.runPromise
    )
  })
})
