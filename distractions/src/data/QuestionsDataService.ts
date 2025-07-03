import { Effect } from 'effect'
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
