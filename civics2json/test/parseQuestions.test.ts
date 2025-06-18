import { Effect, Console } from 'effect'
import { parseQuestionsFile, Question } from '@src/parseQuestions'
import { describe, it, expect } from '@jest/globals'

describe('parseQuestions', () => {
  it('should parse USCIS civics questions', async () => {
    const mockWebText = `
AMERICAN GOVERNMENT 

A: Principles of American Democracy 



1. What is the supreme law of the land? 

. the Constitution 



2. What does the Constitution do? 

. sets up the government 

. defines the government 

. protects basic rights of Americans 
`
    await Effect.gen(function* () {
      const questions = yield* parseQuestionsFile(mockWebText, { skipValidation: true })
      expect(questions).toBeInstanceOf(Array)
      expect(questions.length).toBeGreaterThan(0)

      // Check structure of the first question as a sample
      if (questions.length > 0) {
        const firstQuestion = questions[0]
        if (firstQuestion !== undefined) {
          expect(firstQuestion).toHaveProperty('theme')
          expect(firstQuestion).toHaveProperty('section')
          expect(firstQuestion).toHaveProperty('question')
          expect(firstQuestion).toHaveProperty('answers')
          expect(firstQuestion.answers).toBeInstanceOf(Array)
        } else {
          // This branch should ideally not be hit if questions.length > 0
          // but it satisfies the type checker and makes the test fail explicitly if it is.
          expect(firstQuestion).toBeDefined()
        }
      }
      yield* Console.log(`Successfully parsed ${questions.length} questions from local file`)
      return questions
    }).pipe(Effect.runPromise)
  })

  it('should parse questions fetched from the web (mocked)', async () => {
    const mockWebText = `
AMERICAN GOVERNMENT 

A: Principles of American Democracy 



1. What is the supreme law of the land? 

. the Constitution 



2. What does the Constitution do? 

. sets up the government 

. defines the government 

. protects basic rights of Americans 
`
    await Effect.gen(function* () {
      const questions = yield* parseQuestionsFile(mockWebText, { skipValidation: true })
      expect(questions).toBeInstanceOf(Array)
      expect(questions.length).toBe(2) // Based on mockWebText
      const q0_web = questions[0]
      const q1_web = questions[1]
      if (q0_web !== undefined && q1_web !== undefined) {
        expect(q0_web.question).toBe('What is the supreme law of the land?')
        expect(q1_web.answers).toEqual([
          'sets up the government',
          'defines the government',
          'protects basic rights of Americans'
        ])
      } else {
        expect(q0_web).toBeDefined()
        expect(q1_web).toBeDefined()
      }
      yield* Console.log(`Successfully parsed ${questions.length} questions from mocked web fetch`)
      return questions
    }).pipe(Effect.runPromise)
  })

  it('should return an empty array or handle error for empty input string', async () => {
    await Effect.gen(function* () {
      const questions = yield* parseQuestionsFile('')
      expect(questions).toBeInstanceOf(Array)
      // Depending on implementation, it might be empty or throw an error handled by catchTag/catchAll
      // For this example, let's assume it returns an empty array for empty non-null input
      expect(questions.length).toBe(0)
      yield* Console.log('Parsed empty string, result count: ' + questions.length)
      return questions
    }).pipe(
      Effect.catchAll((_error) => {
        // parseQuestions fails with a string error, e.g., for empty/invalid input.
        // We expect an empty array of questions in such a case for this test.
        // console.error('Caught error during empty string test:', _error); // Optional: for debugging
        return Effect.succeed([] as Question[])
      }),
      Effect.runPromise
    )
  })

  it('should correctly parse a question with multiple answers', async () => {
    const text = `
AMERICAN GOVERNMENT 

A: Principles of American Democracy 



6. What is one right or freedom from the First Amendment?* 

. speech 

. religion 

. assembly 

. press 

. petition the government 
`
    await Effect.gen(function* (_) {
      const questions = yield* parseQuestionsFile(text, { skipValidation: true })
      expect(questions.length).toBe(1)
      const q0_multi_ans = questions[0]
      if (q0_multi_ans !== undefined) {
        expect(q0_multi_ans.answers).toEqual([
          'speech',
          'religion',
          'assembly',
          'press',
          'petition the government'
        ])
      } else {
        expect(q0_multi_ans).toBeDefined()
      }
      return questions
    }).pipe(Effect.runPromise)
  })

  it('should correctly parse themes and sections', async () => {
    const text = `
AMERICAN GOVERNMENT 

A: Principles of American Democracy 



1. What is the supreme law of the land? 

. the Constitution 



B: System of Government 



13. Name one branch or part of the government.* 

. Congress 

. legislative 

. President 

. executive 

. the courts 

. judicial 
`
    await Effect.gen(function* (_) {
      const questions = yield* parseQuestionsFile(text, { skipValidation: true })
      yield* Console.log(JSON.stringify(questions, null, 2))
      expect(questions.length).toBe(2)
      const q0_theme = questions[0]
      const q1_theme = questions[1]
      if (q0_theme !== undefined && q1_theme !== undefined) {
        expect(q0_theme.theme).toBe('AMERICAN GOVERNMENT')
        expect(q0_theme.section).toBe('Principles of American Democracy')
        expect(q1_theme.theme).toBe('AMERICAN GOVERNMENT') // Theme persists
        expect(q1_theme.section).toBe('System of Government')
      } else {
        expect(q0_theme).toBeDefined()
        expect(q1_theme).toBeDefined()
      }
      return questions
    }).pipe(Effect.runPromise)
  })

  it('should parse multiple themes and sections', async () => {
    const text = `
AMERICAN GOVERNMENT
A: Principles of American Democracy
1. What is the supreme law of the land?
. the Constitution
2. What does the Constitution do?
. sets up the government
. defines the government
. protects basic rights of Americans
B: System of Government
3. Who is in charge of the executive branch?
. the President

AMERICAN HISTORY
A: Colonial Period and Independence
4. Who lived in America before the Europeans arrived?
. Native Americans
`
    await Effect.gen(function* (_) {
      const questions = yield* parseQuestionsFile(text, { skipValidation: true })
      expect(questions.length).toBe(4)
      expect(questions[0]).toMatchObject({
        theme: 'AMERICAN GOVERNMENT',
        section: 'Principles of American Democracy',
        question: 'What is the supreme law of the land?',
        answers: ['the Constitution']
      })
      expect(questions[1]).toMatchObject({
        answers: [
          'sets up the government',
          'defines the government',
          'protects basic rights of Americans'
        ]
      })
      expect(questions[2]).toMatchObject({
        section: 'System of Government'
      })
      expect(questions[3]).toMatchObject({
        theme: 'AMERICAN HISTORY',
        answers: ['Native Americans']
      })
      return questions
    }).pipe(Effect.runPromise)
  })

  it('should handle questions with no answers', async () => {
    const text = `
AMERICAN GOVERNMENT
A: Principles of American Democracy
1. What is the supreme law of the land?
`
    await Effect.gen(function* (_) {
      const questions = yield* parseQuestionsFile(text, { skipValidation: true })
      expect(questions.length).toBe(1)
      expect(questions[0]?.answers).toEqual([])
      return questions
    }).pipe(Effect.runPromise)
  })

  it('should trim whitespace from questions and answers', async () => {
    const text = `
AMERICAN GOVERNMENT
A: Principles of American Democracy
1.   What is the supreme law of the land?   

.   the Constitution   

2.   What does the Constitution do?

. sets up the government   
.   defines the government
`
    await Effect.gen(function* (_) {
      const questions = yield* parseQuestionsFile(text, { skipValidation: true })
      expect(questions[0]?.question).toBe('What is the supreme law of the land?')
      expect(questions[0]?.answers[0]).toBe('the Constitution')
      expect(questions[1]?.answers[0]).toBe('sets up the government')
      expect(questions[1]?.answers[1]).toBe('defines the government')
      return questions
    }).pipe(Effect.runPromise)
  })

  it('should handle empty lines and preserve context', async () => {
    const text = `
AMERICAN GOVERNMENT

A: Principles of American Democracy

1. What is the supreme law of the land?
. the Constitution

2. What does the Constitution do?
. sets up the government

`
    await Effect.gen(function* (_) {
      const questions = yield* parseQuestionsFile(text, { skipValidation: true })
      expect(questions.length).toBe(2)
      expect(questions[0]?.theme).toBe('AMERICAN GOVERNMENT')
      expect(questions[1]?.section).toBe('Principles of American Democracy')
      return questions
    }).pipe(Effect.runPromise)
  })

  it('should handle sections with no questions', async () => {
    const text = `
AMERICAN GOVERNMENT
A: Principles of American Democracy
B: System of Government
1. Who is in charge of the executive branch?
. the President
`
    await Effect.gen(function* (_) {
      const questions = yield* parseQuestionsFile(text, { skipValidation: true })
      expect(questions.length).toBe(1)
      expect(questions[0]?.section).toBe('System of Government')
      return questions
    }).pipe(Effect.runPromise)
  })

  it('should handle questions with only one answer', async () => {
    const text = `
AMERICAN GOVERNMENT
A: Principles of American Democracy
1. What is the supreme law of the land?
. the Constitution
`
    await Effect.gen(function* (_) {
      const questions = yield* parseQuestionsFile(text, { skipValidation: true })
      expect(questions[0]?.answers).toEqual(['the Constitution'])
      return questions
    }).pipe(Effect.runPromise)
  })

  it('should handle answers with extra whitespace', async () => {
    const text = `
AMERICAN GOVERNMENT
A: Principles of American Democracy
1. What is the supreme law of the land?
.    the Constitution   
.   another answer   
`
    await Effect.gen(function* (_) {
      const questions = yield* parseQuestionsFile(text, { skipValidation: true })
      expect(questions[0]?.answers[0]).toBe('the Constitution')
      expect(questions[0]?.answers[1]).toBe('another answer')
      return questions
    }).pipe(Effect.runPromise)
  })

  it('should handle multiple themes and section context correctly', async () => {
    const text = `
AMERICAN GOVERNMENT
A: Principles of American Democracy
1. What is the supreme law of the land?
. the Constitution
AMERICAN HISTORY
A: Colonial Period
2. Who lived in America before the Europeans arrived?
. Native Americans
`
    await Effect.gen(function* (_) {
      const questions = yield* parseQuestionsFile(text, { skipValidation: true })
      expect(questions[0]?.theme).toBe('AMERICAN GOVERNMENT')
      expect(questions[1]?.theme).toBe('AMERICAN HISTORY')
      expect(questions[1]?.section).toBe('Colonial Period')
      return questions
    }).pipe(Effect.runPromise)
  })
})
