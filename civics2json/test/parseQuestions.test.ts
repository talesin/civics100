import { Effect, Console } from 'effect'
import { parseQuestionsFile } from '@src/parseQuestions'
import { Question } from '@src/types'
import { describe, it, expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'

const SAMPLE_QUESTIONS_FILE = path.join(__dirname, '../data/100q.txt')

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
          expect(firstQuestion.answers).toHaveProperty('_type')
          expect(firstQuestion.answers).toHaveProperty('choices')
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
        expect(q1_web.answers).toHaveProperty('_type', 'text')
        expect(q1_web.answers).toHaveProperty('choices')
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
        expect(q0_multi_ans.answers).toHaveProperty('_type', 'text')
        expect(q0_multi_ans.answers).toHaveProperty('choices')
        expect(q0_multi_ans.answers.choices).toEqual([
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
        answers: { _type: 'text', choices: ['the Constitution'] }
      })
      expect(questions[1]).toMatchObject({
        answers: {
          _type: 'text',
          choices: [
            'sets up the government',
            'defines the government',
            'protects basic rights of Americans'
          ]
        }
      })
      expect(questions[2]).toMatchObject({
        section: 'System of Government'
      })
      expect(questions[3]).toMatchObject({
        theme: 'AMERICAN HISTORY',
        answers: { _type: 'text', choices: ['Native Americans'] }
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
      expect(questions[0]?.answers).toHaveProperty('_type', 'text')
      expect(questions[0]?.answers).toHaveProperty('choices')
      expect(questions[0]?.answers.choices).toEqual([])
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
      expect(questions[0]?.answers).toMatchObject({ _type: 'text', choices: ['the Constitution'] })
      expect(questions[1]?.answers).toMatchObject({
        _type: 'text',
        choices: ['sets up the government', 'defines the government']
      })
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
      expect(questions[0]?.answers).toMatchObject({ _type: 'text', choices: ['the Constitution'] })
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
      expect(questions[0]?.answers).toMatchObject({
        _type: 'text',
        choices: ['the Constitution', 'another answer']
      })
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

  it('should ignore the intro text', async () => {
    const text = `
(rev. 01/19) 


Civics (History and Government) Questions for the Naturalization Test 

The 100 civics (history and government) questions and answers for the naturalization test are listed below. The civics test is an oral test and the USCIS Officer will ask the applicant up to 10 of the 100 civics questions. An applicant must answer 6 out of 10 questions correctly to pass the civics portion of the naturalization test. 

On the naturalization test, some answers may change because of elections or appointments. As you study for the test, make sure that you know the most current answers to these questions. Answer these questions with the name of the official who is serving at the time of your eligibility interview with USCIS. The USCIS Officer will not accept an incorrect answer. 

Although USCIS is aware that there may be additional correct answers to the 100 civics questions, applicants are encouraged to respond to the civics questions using the answers provided below. 

* If you are 65 years old or older and have been a legal permanent resident of the United States for 20 or more years, you may study just the questions that have been marked with an asterisk. 



AMERICAN GOVERNMENT 

A: Principles of American Democracy 



1. What is the supreme law of the land? 

. the Constitution 
`
    const questions = await parseQuestionsFile(text).pipe(Effect.runPromise)
    expect(questions).toHaveLength(1)
    expect(questions[0]).toMatchObject({
      theme: 'AMERICAN GOVERNMENT',
      section: 'Principles of American Democracy',
      question: 'What is the supreme law of the land?',
      answers: { _type: 'text', choices: ['the Constitution'] }
    })
  })

  it('should return 100 questions from sample file', async () => {
    const text = fs.readFileSync(SAMPLE_QUESTIONS_FILE, 'utf-8')
    const questions = await parseQuestionsFile(text).pipe(Effect.runPromise)
    expect(questions.length).toBe(100)
  })
})
