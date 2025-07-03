import { Effect } from 'effect'
import type { Question } from 'civics2json'

export type QuestionType =
  | 'president'
  | 'state'
  | 'capital'
  | 'governor'
  | 'senator'
  | 'representative'
  | 'war'
  | 'government_branch'
  | 'document'
  | 'rights'
  | 'number'
  | 'abstract'

export class QuestionClassifierService extends Effect.Service<QuestionClassifierService>()(
  'QuestionClassifierService',
  {
    effect: Effect.succeed({
      classifyQuestion: (question: Question): QuestionType => {
        const questionText = question.question.toLowerCase()
        const answerType = question.answers._type

        // Get answer text for analysis
        const answerTexts = question.answers.choices
          .map((choice) => {
            if (typeof choice === 'string') return choice.toLowerCase()
            if ('senator' in choice) return choice.senator.toLowerCase()
            if ('representative' in choice) return choice.representative.toLowerCase()
            if ('governor' in choice) return choice.governor.toLowerCase()
            return ''
          })
          .join(' ')

        // Check dynamic answer types first
        if (answerType === 'senator') return 'senator'
        if (answerType === 'representative') return 'representative'
        if (answerType === 'governor') return 'governor'
        if (answerType === 'capital') return 'capital'

        // Check for document questions (look at both question and answers)
        if (
          questionText.includes('constitution') ||
          questionText.includes('declaration of independence') ||
          questionText.includes('bill of rights') ||
          questionText.includes('federalist papers') ||
          questionText.includes('emancipation proclamation') ||
          questionText.includes('amendment') ||
          answerTexts.includes('constitution') ||
          answerTexts.includes('declaration of independence') ||
          answerTexts.includes('bill of rights') ||
          questionText.includes('supreme law')
        ) {
          return 'document'
        }

        // Check for president questions
        if (
          questionText.includes('president') ||
          questionText.includes('commander in chief') ||
          answerTexts.includes('washington') ||
          answerTexts.includes('lincoln') ||
          answerTexts.includes('roosevelt')
        ) {
          return 'president'
        }

        // Check for war questions
        if (
          questionText.includes('war') ||
          questionText.includes('fought') ||
          questionText.includes('cold war') ||
          questionText.includes('civil war') ||
          questionText.includes('world war')
        ) {
          return 'war'
        }

        // Check for government branch questions
        if (
          questionText.includes('branch') ||
          questionText.includes('judicial') ||
          questionText.includes('legislative') ||
          questionText.includes('executive') ||
          questionText.includes('congress') ||
          questionText.includes('senate') ||
          questionText.includes('house') ||
          questionText.includes('supreme court')
        ) {
          return 'government_branch'
        }

        // Check for state/geography questions
        if (
          questionText.includes('state') ||
          questionText.includes('capital') ||
          questionText.includes('borders') ||
          questionText.includes('territory') ||
          questionText.includes('ocean') ||
          questionText.includes('river')
        ) {
          return 'state'
        }

        // Check for rights/freedoms questions
        if (
          questionText.includes('right') ||
          questionText.includes('freedom') ||
          questionText.includes('liberty') ||
          questionText.includes('first amendment')
        ) {
          return 'rights'
        }

        // Check for number questions
        if (
          questionText.includes('how many') ||
          questionText.includes('number') ||
          questionText.match(/\d+/) ||
          questionText.includes('years') ||
          questionText.includes('age')
        ) {
          return 'number'
        }

        // Default to abstract for conceptual questions
        return 'abstract'
      }
    })
  }
) {}
