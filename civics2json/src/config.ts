import { Config } from 'effect'

export const QUESTIONS_TEXT_FILE = Config.string('QUESTIONS_TEXT_FILE').pipe(
  Config.withDefault('data/100q.txt')
)
export const CIVICS_QUESTIONS_URL = Config.string('CIVICS_QUESTIONS_URL').pipe(
  Config.withDefault(
    'https://www.uscis.gov/sites/default/files/document/questions-and-answers/100q.txt'
  )
)
export const QUESTIONS_JSON_FILE = Config.string('QUESTIONS_JSON_FILE').pipe(
  Config.withDefault('data/civics-questions.json')
)
