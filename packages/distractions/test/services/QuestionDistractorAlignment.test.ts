import { readFileSync } from 'fs'
import { join } from 'path'
import { CuratedDistractorDatabase } from '../../src/services/CuratedDistractorDatabase'

describe('Question-Distractor Alignment', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let civicsQuestions: any[]

  beforeAll(() => {
    // Load the actual civics questions
    const civicsQuestionsPath = join(__dirname, '../../../civics2json/data/civics-questions.json')
    civicsQuestions = JSON.parse(readFileSync(civicsQuestionsPath, 'utf8'))
  })

  describe('Critical question-distractor alignment fixes', () => {
    it('should have correct distractors for question 96 (13 stripes)', () => {
      const question = civicsQuestions.find((q) => q.questionNumber === 96)
      expect(question.question).toBe('Why does the flag have 13 stripes?')

      const entry = CuratedDistractorDatabase['96']
      expect(entry?.question).toBe('Why does the flag have 13 stripes?')
      expect(entry?.curatedDistractors).toEqual([
        'because there are 13 senators',
        'because there are 13 founding fathers',
        'because it represents 13 years of independence',
        'because there are 13 amendments'
      ])
    })

    it('should have correct distractors for question 97 (50 stars)', () => {
      const question = civicsQuestions.find((q) => q.questionNumber === 97)
      expect(question.question).toBe('Why does the flag have 50 stars?*')

      const entry = CuratedDistractorDatabase['97']
      expect(entry?.question).toBe('Why does the flag have 50 stars?')
      expect(entry?.curatedDistractors).toEqual([
        'because there are 50 original colonies',
        'because there are 50 senators',
        'because there are 50 founding fathers',
        'because it represents 50 years of independence'
      ])
    })

    it('should have correct distractors for question 98 (national anthem)', () => {
      const question = civicsQuestions.find((q) => q.questionNumber === 98)
      expect(question.question).toBe('What is the name of the national anthem?')

      const entry = CuratedDistractorDatabase['98']
      expect(entry?.question).toBe('What is the name of the national anthem?')
      expect(entry?.curatedDistractors).toContain('America the Beautiful')
      expect(entry?.curatedDistractors).toContain('God Bless America')
    })

    it('should have correct distractors for question 99 (Independence Day)', () => {
      const question = civicsQuestions.find((q) => q.questionNumber === 99)
      expect(question.question).toBe('When do we celebrate Independence Day?*')

      const entry = CuratedDistractorDatabase['99']
      expect(entry?.question).toBe('When do we celebrate Independence Day?')
      expect(entry?.curatedDistractors).toEqual(['July 3', 'July 5', 'December 25', 'January 1'])

      // Ensure no holiday names for a date question
      expect(entry?.curatedDistractors).not.toContain('Easter')
      expect(entry?.curatedDistractors).not.toContain("Mother's Day")
    })

    it('should have correct distractors for question 100 (national holidays)', () => {
      const question = civicsQuestions.find((q) => q.questionNumber === 100)
      expect(question.question).toBe('Name two national U.S. holidays.')

      const entry = CuratedDistractorDatabase['100']
      expect(entry?.question).toBe('Name two national U.S. holidays.')
      expect(entry?.curatedDistractors).toEqual([
        'Easter',
        "Mother's Day",
        "Father's Day",
        'Halloween'
      ])
    })
  })

  describe('General distractor validation', () => {
    it('should have all 100 questions in the database', () => {
      for (let i = 1; i <= 100; i++) {
        expect(CuratedDistractorDatabase[i.toString()]).toBeDefined()
      }
    })

    it('should have question text match between database and civics questions', () => {
      const criticalQuestions = [96, 97, 98, 99, 100]

      for (const questionNum of criticalQuestions) {
        const actualQuestion = civicsQuestions.find((q) => q.questionNumber === questionNum)
        const databaseEntry = CuratedDistractorDatabase[questionNum.toString()]

        // Remove asterisks and normalize whitespace for comparison
        const actualText = actualQuestion.question.replace(/\*$/, '').trim()
        const databaseText = databaseEntry?.question.replace(/\*$/, '').trim()

        expect(databaseText).toBe(actualText)
      }
    })

    it('should have appropriate distractor types for date questions', () => {
      // Question 99 is a date question
      const entry = CuratedDistractorDatabase['99']
      expect(entry?.answerType).toBe('date')

      // All distractors should be dates or date-like
      entry?.curatedDistractors.forEach((distractor) => {
        expect(distractor).toMatch(
          /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d+$|^\d+$/
        )
      })
    })

    it('should have appropriate distractor types for concept questions', () => {
      // Questions 96 and 97 are concept questions about flag meanings
      const entry96 = CuratedDistractorDatabase['96']
      const entry97 = CuratedDistractorDatabase['97']

      expect(entry96?.answerType).toBe('concept')
      expect(entry97?.answerType).toBe('concept')

      // All distractors should be explanatory statements starting with "because"
      entry96?.curatedDistractors.forEach((distractor) => {
        expect(distractor).toMatch(/^because/)
      })
      entry97?.curatedDistractors.forEach((distractor) => {
        expect(distractor).toMatch(/^because/)
      })
    })

    it('should have appropriate distractor types for anthem questions', () => {
      // Question 98 is about the national anthem
      const entry = CuratedDistractorDatabase['98']
      expect(entry?.answerType).toBe('anthem')

      // All distractors should be song names
      entry?.curatedDistractors.forEach((distractor) => {
        expect(distractor).toMatch(/^[A-Za-z\s',]+$/)
      })
    })

    it('should have appropriate distractor types for holiday questions', () => {
      // Question 100 is about national holidays
      const entry = CuratedDistractorDatabase['100']
      expect(entry?.answerType).toBe('holidays')

      // All distractors should be holiday names
      entry?.curatedDistractors.forEach((distractor) => {
        expect(distractor).toMatch(/^[A-Za-z\s']+$/)
      })
    })
  })

  describe('No common distractor mistakes', () => {
    it('should not have song names as distractors for flag questions', () => {
      const flagQuestions = ['96', '97']
      const songNames = ['America the Beautiful', 'God Bless America', "My Country, 'Tis of Thee"]

      flagQuestions.forEach((questionNum) => {
        const entry = CuratedDistractorDatabase[questionNum]
        songNames.forEach((songName) => {
          expect(entry?.curatedDistractors).not.toContain(songName)
        })
      })
    })

    it('should not have holiday names as distractors for date questions', () => {
      const dateQuestions = ['99'] // Independence Day question
      const holidayNames = ['Easter', "Mother's Day", "Father's Day", 'Halloween']

      dateQuestions.forEach((questionNum) => {
        const entry = CuratedDistractorDatabase[questionNum]
        holidayNames.forEach((holidayName) => {
          expect(entry?.curatedDistractors).not.toContain(holidayName)
        })
      })
    })

    it('should not have date formats as distractors for holiday questions', () => {
      const holidayQuestions = ['100'] // National holidays question
      const dateFormats = ['July 4', 'December 25', 'January 1']

      holidayQuestions.forEach((questionNum) => {
        const entry = CuratedDistractorDatabase[questionNum]
        dateFormats.forEach((dateFormat) => {
          expect(entry?.curatedDistractors).not.toContain(dateFormat)
        })
      })
    })
  })
})
