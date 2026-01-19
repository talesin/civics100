import { Question } from './types'

import questions from '@data/civics-questions.json'

const civicsQuestions = questions as Question[]
export default civicsQuestions

// Single source of truth - derived from actual data
export const TOTAL_QUESTION_COUNT = civicsQuestions.length
