import { Config, Effect } from 'effect'

/** Alternative config values type */
export type AltValue =
  | { keys: string[]; value?: undefined; config?: undefined }
  | { value: string; keys?: undefined; config?: undefined }
  | { config: Config.Config<string>; keys?: undefined; value?: undefined }

/** Return typed config from array of keys with optional fallback values */
export const getConfig = <const T extends ReadonlyArray<string>>(
  names: T,
  alt?: { [K in T[number] as K]?: AltValue }
) =>
  Effect.gen(function* () {
    const getFirstConfig = (keys: string[]): Config.Config<string> => {
      if (keys.length === 0) return Config.fail(`not found`)
      const [key, ...rest] = keys
      return Config.string(key).pipe(Config.orElse(() => getFirstConfig(rest)))
    }

    const get = alt
      ? (name: string) => {
          const altValue = alt[name as keyof typeof alt]
          return getFirstConfig(altValue?.keys ?? [name]).pipe(
            Config.orElse(() =>
              altValue?.value !== undefined
                ? Config.succeed(altValue.value)
                : Config.fail(`Config for '${name}' does not exist`)
            )
          )
        }
      : (name: string) => Config.string(name)

    // map array of Config into Config of array
    const xs = yield* Config.all(
      names.map((name) => get(name).pipe(Config.map((value) => [name, value] as const)))
    )

    // type return value
    return Object.fromEntries(xs) as {
      [K in T[number] as K]: string
    }
  })

export default getConfig(
  [
    'QUESTIONS_TEXT_FILE',
    'CIVICS_QUESTIONS_URL',
    'QUESTIONS_JSON_FILE',
    'SENATORS_URL',
    'SENATORS_XML_FILE',
    'SENATORS_JSON_FILE',
    'REPRESENTATIVES_URL',
    'REPRESENTATIVES_HTML_FILE',
    'REPRESENTATIVES_JSON_FILE',
    'DEPENDENT_QUESTIONS_URL',
    'DEPENDENT_QUESTIONS_JSON_FILE',
    'DEPENDENT_QUESTIONS_HTML_FILE',
    'DEPENDENT_QUESTIONS_TEXT_FILE'
  ],
  {
    QUESTIONS_TEXT_FILE: { value: 'data/100q.txt' },
    CIVICS_QUESTIONS_URL: {
      value: 'https://www.uscis.gov/sites/default/files/document/questions-and-answers/100q.txt'
    },
    QUESTIONS_JSON_FILE: { value: 'data/civics-questions.json' },
    SENATORS_URL: { value: 'https://www.senate.gov/general/contact_information/senators_cfm.xml' },
    SENATORS_XML_FILE: { value: 'data/senators.xml' },
    SENATORS_JSON_FILE: { value: 'data/senators.json' },
    REPRESENTATIVES_URL: { value: 'https://www.house.gov/representatives' },
    REPRESENTATIVES_HTML_FILE: { value: 'data/representatives.html' },
    REPRESENTATIVES_JSON_FILE: { value: 'data/representatives.json' },
    DEPENDENT_QUESTIONS_URL: {
      value:
        'https://www.uscis.gov/citizenship/find-study-materials-and-resources/check-for-test-updates'
    },
    DEPENDENT_QUESTIONS_JSON_FILE: { value: 'data/dependent-questions.json' },
    DEPENDENT_QUESTIONS_HTML_FILE: { value: 'data/dependent-questions.html' },
    DEPENDENT_QUESTIONS_TEXT_FILE: { value: 'data/dependent-questions.txt' }
  }
)
