// Mock questionnaire main module for testing
import { Effect, Option } from 'effect'
import { PairedQuestionNumber, Question, QuestionDataSource, QuestionNumber } from 'questionnaire'

export * from './questionnaire-data'

// Mock utility functions
export const getAvailablePairedQuestionNumbers = (questions: Question[]): PairedQuestionNumber[] =>
  questions.map((q) => q.pairedQuestionNumber)

export const findQuestionByPairedNumber = (
  pairedQuestionNumber: PairedQuestionNumber,
  questions: Question[]
) => {
  const found = questions.find((q) => q.pairedQuestionNumber === pairedQuestionNumber)
  return Option.fromNullable(found)
}

export const getQuestionCount = (questions: Question[]): number => questions.length

// Mock QuestionSelector - not used in current implementation but kept for future use
export const QuestionSelector = {
  selectPairedQuestion: () => Option.some(PairedQuestionNumber('1-0')),
  getPairedQuestionStats: () => ({
    totalAnswered: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    accuracy: 0
  }),
  recordPairedAnswer: (_: unknown, __: unknown, answers: unknown) => answers,
  getLearningProgress: () => ({
    totalQuestionsAttempted: 0,
    totalAnswers: 0,
    overallAccuracy: 0,
    masteredQuestions: 0
  })
}

// Mock loadQuestions function
export const loadQuestions = (
  _dataSource: QuestionDataSource
): Effect.Effect<readonly Question[], never, never> => {
  // Simple mock implementation that returns sample questions
  const mockQuestions: Question[] = [
    {
      questionNumber: QuestionNumber('1'),
      pairedQuestionNumber: PairedQuestionNumber('1-0'),
      question: 'What is the supreme law of the land?',
      correctAnswer: 0,
      correctAnswerText: 'the Constitution',
      answers: [
        'the Constitution',
        'the Declaration of Independence',
        'the Bill of Rights',
        'the Articles of Confederation'
      ]
    },
    {
      questionNumber: QuestionNumber('2'),
      pairedQuestionNumber: PairedQuestionNumber('2-0'),
      question: 'What does the Constitution do?',
      correctAnswer: 1,
      correctAnswerText: 'sets up the government',
      answers: [
        'protects basic rights',
        'sets up the government',
        'defines the law',
        'protects the country'
      ]
    },
    {
      questionNumber: QuestionNumber('3'),
      pairedQuestionNumber: PairedQuestionNumber('3-0'),
      question:
        'The idea of self-government is in the first three words of the Constitution. What are these words?',
      correctAnswer: 2,
      correctAnswerText: 'We the People',
      answers: ['We the Nation', 'We the Government', 'We the People', 'We the Citizens']
    },
    {
      questionNumber: QuestionNumber('4'),
      pairedQuestionNumber: PairedQuestionNumber('4-0'),
      question: 'What is an amendment?',
      correctAnswer: 0,
      correctAnswerText: 'a change to the Constitution',
      answers: [
        'a change to the Constitution',
        'a new law',
        'a court decision',
        'a presidential order'
      ]
    },
    {
      questionNumber: QuestionNumber('5'),
      pairedQuestionNumber: PairedQuestionNumber('5-0'),
      question: 'What do we call the first ten amendments to the Constitution?',
      correctAnswer: 3,
      correctAnswerText: 'the Bill of Rights',
      answers: [
        'the Constitutional Amendments',
        'the Original Amendments',
        'the First Amendments',
        'the Bill of Rights'
      ]
    },
    {
      questionNumber: QuestionNumber('6'),
      pairedQuestionNumber: PairedQuestionNumber('6-0'),
      question: 'What is one right or freedom from the First Amendment?',
      correctAnswer: 0,
      correctAnswerText: 'speech',
      answers: ['speech', 'bear arms', 'trial by jury', 'due process']
    }
  ]

  return Effect.succeed(mockQuestions)
}
