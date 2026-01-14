import { getConfig, EffectSuccessType } from './utils'

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
    'STATE_GOVERNMENTS_URL',
    'STATE_GOVERNMENTS_HTML_FILE',
    'STATE_GOVERNMENTS_JSON_FILE',
    'STATE_GOVERNMENTS_DATA_DIR',
    'GOVERNORS_JSON_FILE',
    'UPDATES_URL',
    'UPDATES_JSON_FILE',
    'UPDATES_HTML_FILE'
  ],
  {
    QUESTIONS_TEXT_FILE: { value: 'data/civics-questions-2025.txt' },
    QUESTIONS_URL: {
      value:
        'https://www.uscis.gov/sites/default/files/document/questions-and-answers/2025-Civics-Test-128-Questions-and-Answers.pdf'
    },
    QUESTIONS_JSON_FILE: { value: 'data/civics-questions.json' },
    SENATORS_URL: { value: 'https://www.senate.gov/general/contact_information/senators_cfm.xml' },
    SENATORS_XML_FILE: { value: 'data/senators.xml' },
    SENATORS_JSON_FILE: { value: 'data/senators.json' },
    REPRESENTATIVES_URL: { value: 'https://www.house.gov/representatives' },
    REPRESENTATIVES_HTML_FILE: { value: 'data/representatives.html' },
    REPRESENTATIVES_JSON_FILE: { value: 'data/representatives.json' },
    STATE_GOVERNMENTS_URL: { value: 'https://www.usa.gov/state-governments' },
    STATE_GOVERNMENTS_HTML_FILE: { value: 'data/state-governments.html' },
    STATE_GOVERNMENTS_JSON_FILE: { value: 'data/state-governments.json' },
    STATE_GOVERNMENTS_DATA_DIR: { value: 'data/state-governments' },
    GOVERNORS_JSON_FILE: { value: 'data/governors.json' },
    UPDATES_URL: {
      value:
        'https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates'
    },
    UPDATES_JSON_FILE: { value: 'data/updated-questions.json' },
    UPDATES_HTML_FILE: { value: 'data/updated-questions.html' }
  }
)

export type CivicsConfig = EffectSuccessType<typeof CivicsConfig>
