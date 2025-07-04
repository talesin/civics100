import { Effect, Layer } from 'effect'
import Questions from 'civics2json/Questions'
import type { Question } from 'civics2json'

// Service Definition
export class QuestionsDataService extends Effect.Service<QuestionsDataService>()(
  'QuestionsDataService',
  {
    effect: Effect.succeed({
      getAllQuestions: () => Effect.succeed(Questions as readonly Question[])
    })
  }
) {}

export const TestQuestionsDataServiceLayer = (fn?: {
  getAllQuestions?: () => Effect.Effect<readonly Question[]>
}) =>
  Layer.succeed(
    QuestionsDataService,
    QuestionsDataService.of({
      _tag: 'QuestionsDataService',
      getAllQuestions:
        fn?.getAllQuestions ?? (() => Effect.succeed(Questions as readonly Question[]))
    })
  )
