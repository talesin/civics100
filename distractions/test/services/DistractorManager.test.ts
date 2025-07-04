import { describe, it, expect, jest } from '@jest/globals'
import { Effect } from 'effect'
import { generateAndWrite } from '../../src/services/DistractorManager'
import {
  QuestionWithDistractors,
  TestStaticGeneratorLayer
} from '../../src/generators/StaticGenerator'
import { FileSystem, Path } from '@effect/platform'
import { StaticGenerator } from '../../src/generators/StaticGenerator'

describe('DistractorManager', () => {
  it('should generate and write distractors to a file', async () => {
    const question: QuestionWithDistractors = {
      _tag: 'QuestionWithDistractors',
      questionNumber: 1,
      distractors: ['d1'],
      theme: 'theme',
      section: 'section',
      question: 'question',
      answers: {
        _type: 'text',
        choices: ['a', 'b', 'c', 'd']
      }
    }

    const mockGenerate = jest.fn(() => Effect.succeed([question]))

    const staticGeneratorTestLayer = TestStaticGeneratorLayer({
      generate: mockGenerate
    })

    const fileSystemTestLayer = FileSystem.layerNoop({})
    const pathTestLayer = Path.layer

    await Effect.gen(function* () {
      const generator = yield* StaticGenerator
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path
      const result = yield* generateAndWrite(generator, fs, path)()

      expect(result).toStrictEqual(question)
    }).pipe(
      Effect.provide(staticGeneratorTestLayer),
      Effect.provide(fileSystemTestLayer),
      Effect.provide(pathTestLayer),
      Effect.runPromise
    )
  })
})
