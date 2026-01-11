import { Effect, Layer } from 'effect'
import type { Question } from 'civics2json'
import { CuratedDistractorDatabase, CuratedDistractorEntry } from './CuratedDistractorDatabase'

// Comprehensive curated distractor database for all 100 civics questions
const getCuratedDistractorDatabase = (): CuratedDistractorDatabase => CuratedDistractorDatabase

export const getDistractorsForQuestion =
  (curatedDatabase: CuratedDistractorDatabase) =>
  (question: Question): readonly string[] => {
    const questionKey = question.questionNumber.toString()
    const entry = curatedDatabase[questionKey]
    return entry?.curatedDistractors ?? []
  }

export const hasDistractorsForQuestion =
  (curatedDatabase: CuratedDistractorDatabase) =>
  (question: Question): boolean => {
    const questionKey = question.questionNumber.toString()
    return questionKey in curatedDatabase
  }

export const getCuratedEntry =
  (curatedDatabase: CuratedDistractorDatabase) =>
  (question: Question): CuratedDistractorEntry | undefined => {
    const questionKey = question.questionNumber.toString()
    return curatedDatabase[questionKey]
  }

export const getAllCuratedQuestions =
  (curatedDatabase: CuratedDistractorDatabase) => (): readonly string[] => {
    return Object.keys(curatedDatabase)
  }

export class CuratedDistractorService extends Effect.Service<CuratedDistractorService>()(
  'CuratedDistractorService',
  {
    effect: Effect.sync(() => {
      const curatedDatabase = getCuratedDistractorDatabase()

      return {
        getDistractorsForQuestion: getDistractorsForQuestion(curatedDatabase),
        hasDistractorsForQuestion: hasDistractorsForQuestion(curatedDatabase),
        getCuratedEntry: getCuratedEntry(curatedDatabase),
        getAllCuratedQuestions: getAllCuratedQuestions(curatedDatabase)
      }
    })
  }
) {}

export const TestCuratedDistractorServiceLayer = (fn?: {
  getDistractorsForQuestion?: (question: Question) => readonly string[]
  hasDistractorsForQuestion?: (question: Question) => boolean
  getCuratedEntry?: (question: Question) => CuratedDistractorEntry | undefined
  getAllCuratedQuestions?: () => readonly string[]
}) =>
  Layer.succeed(
    CuratedDistractorService,
    CuratedDistractorService.of({
      _tag: 'CuratedDistractorService',
      getDistractorsForQuestion: fn?.getDistractorsForQuestion ?? (() => []),
      hasDistractorsForQuestion: fn?.hasDistractorsForQuestion ?? (() => false),
      getCuratedEntry: fn?.getCuratedEntry ?? (() => undefined),
      getAllCuratedQuestions: fn?.getAllCuratedQuestions ?? (() => [])
    })
  )
