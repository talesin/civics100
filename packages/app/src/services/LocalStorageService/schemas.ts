import { Effect, Option, Schema } from 'effect'
import type { StateAbbreviation } from 'civics2json'

// Valid US state and territory abbreviations
const VALID_STATE_ABBREVIATIONS = new Set([
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
  'DC',
  'PR',
  'GU',
  'VI',
  'AS',
  'MP'
] as const)

const isStateAbbreviation = (value: string): value is StateAbbreviation =>
  VALID_STATE_ABBREVIATIONS.has(value as StateAbbreviation)

// Effect Schemas for runtime validation
export const GameResultSchema = Schema.Struct({
  sessionId: Schema.NonEmptyString,
  totalQuestions: Schema.Number,
  correctAnswers: Schema.Number,
  incorrectAnswers: Schema.optionalWith(Schema.Number, { default: () => 0 }),
  percentage: Schema.Number,
  isEarlyWin: Schema.Boolean,
  isEarlyFail: Schema.optionalWith(Schema.Boolean, { default: () => false }),
  completedAt: Schema.DateFromString
})

// StateAbbreviation schema with runtime validation
export const StateAbbreviationSchema = Schema.String.pipe(
  Schema.filter(isStateAbbreviation, {
    message: (s) => `Invalid state abbreviation: ${s}`
  })
) as Schema.Schema<StateAbbreviation, string, never>

export const TtsSettingsSchema = Schema.Struct({
  voiceURI: Schema.NullOr(Schema.String),
  rate: Schema.Number.pipe(Schema.clamp(0.5, 2.0))
})

export const WebsiteGameSettingsSchema = Schema.Struct({
  maxQuestions: Schema.Number,
  winThreshold: Schema.Number,
  userState: StateAbbreviationSchema,
  userDistrict: Schema.optionalWith(Schema.String, { as: 'Option' }),
  questionNumbers: Schema.optionalWith(Schema.Array(Schema.Number), { as: 'Option' })
})

// Schema for answer history entries (ts stored as ISO string via JSON.stringify of Date)
export const AnswerHistoryEntrySchema = Schema.Struct({
  ts: Schema.DateFromString,
  correct: Schema.Boolean
})

// Schema for the full PairedAnswers record
export const PairedAnswersSchema = Schema.Record({
  key: Schema.String,
  value: Schema.Array(AnswerHistoryEntrySchema)
})

export const STORAGE_KEYS = {
  GAME_RESULTS: 'civics100_game_results',
  GAME_SETTINGS: 'civics100_game_settings',
  PAIRED_ANSWERS: 'civics100_paired_answers',
  TTS_SETTINGS: 'civics100_tts_settings',
  VERSION: 'civics100_storage_version'
} as const

export const STORAGE_VERSION = '1.0.0'

export const safeJsonParse = (json: string | null): Option.Option<unknown> =>
  Schema.decodeUnknownOption(Schema.parseJson())(json)

export const safeJsonStringify = <T>(value: T): Effect.Effect<string | undefined, never, never> => {
  return Effect.try({
    try: () => JSON.stringify(value),
    catch: () => undefined
  }).pipe(Effect.catchAll(() => Effect.succeed(undefined)))
}
