import { Effect, Option } from 'effect'
import type { QuestionWithDistractors } from 'distractions'
import type { StateAbbreviation } from 'civics2json'
import { QuestionDataService, type QuestionDataSource } from '@src/QuestionDataService'
import { QuestionNumber, PairedQuestionNumber } from '@src/types'

describe('QuestionDataService', () => {
  const mockQuestionsWithDistractors: QuestionWithDistractors[] = [
    {
      questionNumber: 1,
      theme: 'AMERICAN GOVERNMENT',
      section: 'Principles of American Democracy',
      question: 'What is the supreme law of the land?',
      expectedAnswers: 1,
      answers: {
        _type: 'text',
        choices: ['the Constitution']
      },
      distractors: [
        'the Declaration of Independence',
        'the Bill of Rights',
        'the Articles of Confederation'
      ],
      _tag: 'QuestionWithDistractors'
    },
    {
      questionNumber: 2,
      theme: 'AMERICAN GOVERNMENT',
      section: 'Principles of American Democracy',
      question: 'What does the Constitution do?',
      expectedAnswers: 2,
      answers: {
        _type: 'text',
        choices: ['sets up the government', 'defines the government']
      },
      distractors: ['creates the judiciary', 'establishes the military', 'defines voting rights'],
      _tag: 'QuestionWithDistractors'
    },
    {
      questionNumber: 20,
      theme: 'AMERICAN GOVERNMENT',
      section: 'System of Government',
      question: "Who is one of your state's U.S. Senators now?",
      expectedAnswers: 2,
      answers: {
        _type: 'senator',
        choices: [
          { senator: 'Dianne Feinstein', state: 'CA' as StateAbbreviation },
          { senator: 'Alex Padilla', state: 'CA' as StateAbbreviation },
          { senator: 'Chuck Schumer', state: 'NY' as StateAbbreviation },
          { senator: 'Kirsten Gillibrand', state: 'NY' as StateAbbreviation }
        ]
      },
      distractors: ['Joe Biden', 'Nancy Pelosi', 'Kevin McCarthy'],
      _tag: 'QuestionWithDistractors'
    }
  ]

  const dataSource: QuestionDataSource = {
    questions: mockQuestionsWithDistractors,
    userState: 'CA' as StateAbbreviation
  }

  describe('loadQuestions', () => {
    it('should load questions that have distractors, creating pairs for multi-answer questions', async () => {
      await Effect.gen(function* () {
        const questionDataService = yield* QuestionDataService
        const questions = yield* questionDataService.loadQuestions(dataSource)

        // Expects 5 questions: 1 from Q1, 2 from Q2 (multiple answers), 2 from Q20 (senators)
        expect(questions).toHaveLength(5)
        expect(questions[0]?.questionNumber).toBe('1')
        expect(questions[0]?.question).toBe('What is the supreme law of the land?')
        expect(questions[0]?.answers).toHaveLength(4) // 1 correct + 3 distractors
        expect(questions[0]?.pairedQuestionNumber).toBe('1-0')
      }).pipe(Effect.provide(QuestionDataService.Default), Effect.runPromise)
    })

    it('should load all questions with distractors', async () => {
      await Effect.gen(function* () {
        const questionDataService = yield* QuestionDataService
        const questions = yield* questionDataService.loadQuestions(dataSource)

        const question2 = questions.find((q) => q.questionNumber === '2')
        expect(question2).toBeDefined()
        expect(question2?.question).toBe('What does the Constitution do?')
      }).pipe(Effect.provide(QuestionDataService.Default), Effect.runPromise)
    })

    it('should filter state-dependent questions by user state', async () => {
      await Effect.gen(function* () {
        const questionDataService = yield* QuestionDataService
        const questions = yield* questionDataService.loadQuestions(dataSource)

        const senatorQuestion = questions.find((q) => q.questionNumber === '20')
        expect(senatorQuestion).toBeDefined()
        expect(senatorQuestion?.question).toBe("Who is one of your state's U.S. Senators now?")

        // Should include CA senators and distractors, but not NY senators
        expect(senatorQuestion?.answers).toEqual(expect.arrayContaining(['Dianne Feinstein']))
        expect(senatorQuestion?.answers).not.toEqual(
          expect.arrayContaining(['Chuck Schumer', 'Kirsten Gillibrand'])
        )
        // Should have correct + distractors
        expect(senatorQuestion?.answers).toHaveLength(4) // 2 CA senators + 3 distractors shuffled to 4
      }).pipe(Effect.provide(QuestionDataService.Default), Effect.runPromise)
    })

    it('should handle empty data sources', async () => {
      await Effect.gen(function* () {
        const questionDataService = yield* QuestionDataService
        const emptyDataSource: QuestionDataSource = {
          questions: [],
          userState: 'CA' as StateAbbreviation
        }

        const questions = yield* questionDataService.loadQuestions(emptyDataSource)
        expect(questions).toHaveLength(0)
      }).pipe(Effect.provide(QuestionDataService.Default), Effect.runPromise)
    })
  })

  describe('getAvailableQuestionNumbers', () => {
    it('should return question numbers from loaded questions', async () => {
      await Effect.gen(function* () {
        const questionDataService = yield* QuestionDataService
        const questions = yield* questionDataService.loadQuestions(dataSource)
        const questionNumbers = questionDataService.getAvailableQuestionNumbers(questions)

        expect(questionNumbers).toEqual(['1', '2', '2', '20', '20'])
      }).pipe(Effect.provide(QuestionDataService.Default), Effect.runPromise)
    })

    it('should return empty array for no questions', async () => {
      await Effect.gen(function* () {
        const questionDataService = yield* QuestionDataService
        const questionNumbers = questionDataService.getAvailableQuestionNumbers([])
        expect(questionNumbers).toEqual([])
      }).pipe(Effect.provide(QuestionDataService.Default), Effect.runPromise)
    })
  })

  describe('findQuestionByNumber', () => {
    it('should find existing question', async () => {
      await Effect.gen(function* () {
        const questionDataService = yield* QuestionDataService
        const questions = yield* questionDataService.loadQuestions(dataSource)
        const questionNumber = QuestionNumber('1')
        const found = questionDataService.findQuestionByNumber(questionNumber, questions)

        expect(Option.isSome(found)).toBe(true)
        if (Option.isSome(found)) {
          expect(found.value.questionNumber).toBe('1')
        }
      }).pipe(Effect.provide(QuestionDataService.Default), Effect.runPromise)
    })

    it('should return None for non-existing question', async () => {
      await Effect.gen(function* () {
        const questionDataService = yield* QuestionDataService
        const questions = yield* questionDataService.loadQuestions(dataSource)
        const questionNumber = QuestionNumber('999')
        const found = questionDataService.findQuestionByNumber(questionNumber, questions)

        expect(Option.isNone(found)).toBe(true)
      }).pipe(Effect.provide(QuestionDataService.Default), Effect.runPromise)
    })
  })

  describe('getQuestionCount', () => {
    it('should return correct count', async () => {
      await Effect.gen(function* () {
        const questionDataService = yield* QuestionDataService
        const questions = yield* questionDataService.loadQuestions(dataSource)
        const count = questionDataService.getQuestionCount(questions)

        expect(count).toBe(5)
      }).pipe(Effect.provide(QuestionDataService.Default), Effect.runPromise)
    })
  })

  describe('getAvailablePairedQuestionNumbers', () => {
    it('should return paired question numbers', async () => {
      await Effect.gen(function* () {
        const questionDataService = yield* QuestionDataService
        const questions = yield* questionDataService.loadQuestions(dataSource)
        const pairedQuestionNumbers =
          questionDataService.getAvailablePairedQuestionNumbers(questions)

        expect(pairedQuestionNumbers).toEqual(['1-0', '2-0', '2-1', '20-0', '20-1'])
      }).pipe(Effect.provide(QuestionDataService.Default), Effect.runPromise)
    })
  })

  describe('findQuestionByPairedNumber', () => {
    it('should find question by paired number', async () => {
      await Effect.gen(function* () {
        const questionDataService = yield* QuestionDataService
        const questions = yield* questionDataService.loadQuestions(dataSource)
        const question = questionDataService.findQuestionByPairedNumber(
          PairedQuestionNumber('2-1'),
          questions
        )

        expect(Option.isSome(question)).toBe(true)
        if (Option.isSome(question)) {
          expect(question.value.questionNumber).toBe('2')
          expect(question.value.pairedQuestionNumber).toBe('2-1')
          expect(question.value.correctAnswerText).toBe('defines the government')
        }
      }).pipe(Effect.provide(QuestionDataService.Default), Effect.runPromise)
    })
  })
})
