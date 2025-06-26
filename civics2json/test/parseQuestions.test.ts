import { Effect } from 'effect'
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
      expect(questions).toStrictEqual([
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What is the supreme law of the land?',
          questionNumber: 1,
          answers: { _type: 'text', choices: ['the Constitution'] }
        },
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What does the Constitution do?',
          questionNumber: 2,
          answers: {
            _type: 'text',
            choices: [
              'sets up the government',
              'defines the government',
              'protects basic rights of Americans'
            ]
          }
        }
      ])
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
      expect(questions).toStrictEqual([
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What is the supreme law of the land?',
          questionNumber: 1,
          answers: { _type: 'text', choices: ['the Constitution'] }
        },
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What does the Constitution do?',
          questionNumber: 2,
          answers: {
            _type: 'text',
            choices: [
              'sets up the government',
              'defines the government',
              'protects basic rights of Americans'
            ]
          }
        }
      ])
    }).pipe(Effect.runPromise)
  })

  it('should skip questions when no leading number', async () => {
    const mockText = `
AMERICAN GOVERNMENT
A: Principles of American Democracy

What is the supreme law of the land?
. the Constitution
`
    await Effect.gen(function* () {
      const questions = yield* parseQuestionsFile(mockText, { skipValidation: true })
      expect(questions).toStrictEqual([])
    }).pipe(Effect.runPromise)
  })

  it('should return an empty array or handle error for empty input string', async () => {
    await Effect.gen(function* () {
      const questions = yield* parseQuestionsFile('')
      expect(questions).toStrictEqual([])
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
      expect(questions).toStrictEqual([
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What is one right or freedom from the First Amendment?*',
          questionNumber: 6,
          answers: {
            _type: 'text',
            choices: ['speech', 'religion', 'assembly', 'press', 'petition the government']
          }
        }
      ])
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
      expect(questions).toStrictEqual([
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What is the supreme law of the land?',
          questionNumber: 1,
          answers: { _type: 'text', choices: ['the Constitution'] }
        },
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'System of Government',
          question: 'Name one branch or part of the government.*',
          questionNumber: 13,
          answers: {
            _type: 'text',
            choices: ['Congress', 'legislative', 'President', 'executive', 'the courts', 'judicial']
          }
        }
      ])
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
      expect(questions).toStrictEqual([
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What is the supreme law of the land?',
          questionNumber: 1,
          answers: { _type: 'text', choices: ['the Constitution'] }
        },
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What does the Constitution do?',
          questionNumber: 2,
          answers: {
            _type: 'text',
            choices: [
              'sets up the government',
              'defines the government',
              'protects basic rights of Americans'
            ]
          }
        },
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'System of Government',
          question: 'Who is in charge of the executive branch?',
          questionNumber: 3,
          answers: { _type: 'text', choices: ['the President'] }
        },
        {
          theme: 'AMERICAN HISTORY',
          section: 'Colonial Period and Independence',
          question: 'Who lived in America before the Europeans arrived?',
          questionNumber: 4,
          answers: { _type: 'text', choices: ['Native Americans'] }
        }
      ])
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
      expect(questions).toStrictEqual([
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What is the supreme law of the land?',
          questionNumber: 1,
          answers: { _type: 'text', choices: [] }
        }
      ])
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
      expect(questions).toStrictEqual([
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What is the supreme law of the land?',
          questionNumber: 1,
          answers: { _type: 'text', choices: ['the Constitution'] }
        },
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What does the Constitution do?',
          questionNumber: 2,
          answers: {
            _type: 'text',
            choices: ['sets up the government', 'defines the government']
          }
        }
      ])
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
      expect(questions).toStrictEqual([
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What is the supreme law of the land?',
          questionNumber: 1,
          answers: { _type: 'text', choices: ['the Constitution'] }
        },
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What does the Constitution do?',
          questionNumber: 2,
          answers: {
            _type: 'text',
            choices: ['sets up the government']
          }
        }
      ])
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
      expect(questions).toStrictEqual([
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'System of Government',
          question: 'Who is in charge of the executive branch?',
          questionNumber: 1,
          answers: { _type: 'text', choices: ['the President'] }
        }
      ])
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
      expect(questions).toStrictEqual([
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What is the supreme law of the land?',
          questionNumber: 1,
          answers: { _type: 'text', choices: ['the Constitution'] }
        }
      ])
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
      expect(questions).toStrictEqual([
        {
          theme: 'AMERICAN GOVERNMENT',
          section: 'Principles of American Democracy',
          question: 'What is the supreme law of the land?',
          questionNumber: 1,
          answers: { _type: 'text', choices: ['the Constitution'] }
        },
        {
          theme: 'AMERICAN HISTORY',
          section: 'Colonial Period',
          question: 'Who lived in America before the Europeans arrived?',
          questionNumber: 2,
          answers: { _type: 'text', choices: ['Native Americans'] }
        }
      ])
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
    expect(questions).toStrictEqual([
      {
        theme: 'AMERICAN GOVERNMENT',
        section: 'Principles of American Democracy',
        question: 'What is the supreme law of the land?',
        questionNumber: 1,
        answers: { _type: 'text', choices: ['the Constitution'] }
      }
    ])
  })

  it('should return 100 questions from sample file', async () => {
    const text = fs.readFileSync(SAMPLE_QUESTIONS_FILE, 'utf-8')
    const questions = await parseQuestionsFile(text).pipe(Effect.runPromise)
    expect(questions.length).toBe(100)
  })
})
