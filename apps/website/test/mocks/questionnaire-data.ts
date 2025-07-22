import type { QuestionWithDistractors } from 'distractions'

// Mock question data for testing
export const civicsQuestionsWithDistractors: QuestionWithDistractors[] = [
  {
    theme: 'AMERICAN GOVERNMENT',
    section: 'Principles of American Democracy',
    question: 'What is the supreme law of the land?',
    questionNumber: 1,
    expectedAnswers: 1,
    answers: {
      _type: 'text',
      choices: ['the Constitution']
    },
    distractors: [
      'the Declaration of Independence',
      'the Bill of Rights',
      'the Articles of Confederation',
      'the Federalist Papers'
    ],
    _tag: 'QuestionWithDistractors'
  },
  {
    theme: 'AMERICAN GOVERNMENT',
    section: 'Principles of American Democracy',
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
    },
    distractors: [
      'declares independence from Britain',
      'establishes religious freedom',
      'creates the military',
      'establishes the economy'
    ],
    _tag: 'QuestionWithDistractors'
  },
  {
    theme: 'AMERICAN GOVERNMENT',
    section: 'System of Government',
    question: "Who is one of your state's U.S. Senators now?",
    questionNumber: 20,
    expectedAnswers: 1,
    answers: {
      _type: 'senator',
      choices: [
        { senator: 'Dianne Feinstein', state: 'CA' },
        { senator: 'Alex Padilla', state: 'CA' },
        { senator: 'Chuck Schumer', state: 'NY' },
        { senator: 'Kirsten Gillibrand', state: 'NY' }
      ]
    },
    distractors: ['Joe Biden', 'Nancy Pelosi', 'Kevin McCarthy', 'Alexandria Ocasio-Cortez'],
    _tag: 'QuestionWithDistractors'
  },
  {
    theme: 'AMERICAN GOVERNMENT',
    section: 'Principles of American Democracy',
    question:
      'The idea of self-government is in the first three words of the Constitution. What are these words?',
    questionNumber: 3,
    expectedAnswers: 1,
    answers: {
      _type: 'text',
      choices: ['We the People']
    },
    distractors: ['We the Citizens', 'We the Americans', 'We the Nation', 'We the States'],
    _tag: 'QuestionWithDistractors'
  },
  {
    theme: 'AMERICAN GOVERNMENT',
    section: 'Principles of American Democracy',
    question: 'What is an amendment?',
    questionNumber: 4,
    expectedAnswers: 1,
    answers: {
      _type: 'text',
      choices: ['a change to the Constitution', 'an addition to the Constitution']
    },
    distractors: [
      'a law passed by Congress',
      'a Supreme Court decision',
      'a presidential order',
      'a state regulation'
    ],
    _tag: 'QuestionWithDistractors'
  }
]

export const rawCivicsQuestions = civicsQuestionsWithDistractors
