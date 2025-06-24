import { getConfig, SuccessType } from './utils'

export const CivicsConfig = getConfig(
  [
    'QUESTIONS_TEXT_FILE',
    'QUESTIONS_URL',
    'QUESTIONS_JSON_FILE',
    'SENATORS_URL',
    'SENATORS_XML_FILE',
    'SENATORS_JSON_FILE',
    'REPRESENTATIVES_URL',
    'REPRESENTATIVES_HTML_FILE',
    'REPRESENTATIVES_JSON_FILE',
    'UPDATES_URL',
    'UPDATES_JSON_FILE',
    'UPDATES_HTML_FILE'
  ],
  {
    QUESTIONS_TEXT_FILE: { value: 'data/100q.txt' },
    QUESTIONS_URL: {
      value: 'https://www.uscis.gov/sites/default/files/document/questions-and-answers/100q.txt'
    },
    QUESTIONS_JSON_FILE: { value: 'data/civics-questions.json' },
    SENATORS_URL: { value: 'https://www.senate.gov/general/contact_information/senators_cfm.xml' },
    SENATORS_XML_FILE: { value: 'data/senators.xml' },
    SENATORS_JSON_FILE: { value: 'data/senators.json' },
    REPRESENTATIVES_URL: { value: 'https://www.house.gov/representatives' },
    REPRESENTATIVES_HTML_FILE: { value: 'data/representatives.html' },
    REPRESENTATIVES_JSON_FILE: { value: 'data/representatives.json' },
    UPDATES_URL: {
      value:
        'https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates'
    },
    UPDATES_JSON_FILE: { value: 'data/updated-questions.json' },
    UPDATES_HTML_FILE: { value: 'data/updated-questions.html' }
  }
)

export type CivicsConfig = SuccessType<typeof CivicsConfig>
