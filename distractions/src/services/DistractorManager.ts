import { FileSystem } from '@effect/platform'
import { Effect, Layer } from 'effect'
import type { Question } from 'civics2json'
import { generateStaticDistractors } from '../generators/static-generator'

type QuestionWithDistractors = Question & { distractors?: string[] }

const generateDistractors = (question: Question) =>
  Effect.succeed(generateStaticDistractors(question))

export const processFiles = (fs: FileSystem.FileSystem) =>
  Effect.fn(({ inputFile, outputFile }: { inputFile: string; outputFile: string }) =>
    Effect.gen(function* () {
      yield* Effect.log(`Reading questions from ${inputFile}`)
      const content = yield* fs.readFileString(inputFile, 'utf-8')
      const questions = yield* Effect.try({
        try: () => JSON.parse(content) as Question[],
        catch: (error) => new Error(`Failed to parse input file: ${String(error)}`)
      })

      yield* Effect.log(`Generating distractors for ${questions.length} questions...`)
      const updatedQuestions = yield* Effect.all(
        questions.map((question) =>
          generateDistractors(question).pipe(
            Effect.map(
              (distractors): QuestionWithDistractors => ({
                ...question,
                distractors
              })
            )
          )
        )
      )

      const outputString = JSON.stringify(updatedQuestions, null, 2)
      yield* Effect.log(`Writing updated questions to ${outputFile}`)
      yield* fs.writeFileString(outputFile, outputString)

      yield* Effect.log('Done.')
    })
  )

export class DistractorManager extends Effect.Service<DistractorManager>()('DistractorManager', {
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    return {
      processFiles: processFiles(fs)
    }
  })
}) {}

export const TestDistractorManagerLayer = (fn?: {
  processFiles?: (args: { inputFile: string; outputFile: string }) => Effect.Effect<void>
}) =>
  Layer.succeed(
    DistractorManager,
    DistractorManager.of({
      _tag: 'DistractorManager',
      processFiles: fn?.processFiles ?? (() => Effect.void)
    })
  )
