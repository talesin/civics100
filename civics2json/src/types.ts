import { Schema } from 'effect'
import { DeepReadonly } from 'ts-essentials'

/**
 * Union type of all U.S. states and territories.
 */
export type StateAbbreviation =
  | 'AL'
  | 'AK'
  | 'AZ'
  | 'AR'
  | 'CA'
  | 'CO'
  | 'CT'
  | 'DE'
  | 'FL'
  | 'GA'
  | 'HI'
  | 'ID'
  | 'IL'
  | 'IN'
  | 'IA'
  | 'KS'
  | 'KY'
  | 'LA'
  | 'ME'
  | 'MD'
  | 'MA'
  | 'MI'
  | 'MN'
  | 'MS'
  | 'MO'
  | 'MT'
  | 'NE'
  | 'NV'
  | 'NH'
  | 'NJ'
  | 'NM'
  | 'NY'
  | 'NC'
  | 'ND'
  | 'OH'
  | 'OK'
  | 'OR'
  | 'PA'
  | 'RI'
  | 'SC'
  | 'SD'
  | 'TN'
  | 'TX'
  | 'UT'
  | 'VT'
  | 'VA'
  | 'WA'
  | 'WV'
  | 'WI'
  | 'WY'
  | 'DC'
  | 'AS'
  | 'GU'
  | 'MP'
  | 'PR'
  | 'VI'

/**
 * Union type of all U.S. state and territory names.
 */
export type StateName =
  | 'Alabama'
  | 'Alaska'
  | 'Arizona'
  | 'Arkansas'
  | 'California'
  | 'Colorado'
  | 'Connecticut'
  | 'Delaware'
  | 'Florida'
  | 'Georgia'
  | 'Hawaii'
  | 'Idaho'
  | 'Illinois'
  | 'Indiana'
  | 'Iowa'
  | 'Kansas'
  | 'Kentucky'
  | 'Louisiana'
  | 'Maine'
  | 'Maryland'
  | 'Massachusetts'
  | 'Michigan'
  | 'Minnesota'
  | 'Mississippi'
  | 'Missouri'
  | 'Montana'
  | 'Nebraska'
  | 'Nevada'
  | 'New Hampshire'
  | 'New Jersey'
  | 'New Mexico'
  | 'New York'
  | 'North Carolina'
  | 'North Dakota'
  | 'Ohio'
  | 'Oklahoma'
  | 'Oregon'
  | 'Pennsylvania'
  | 'Rhode Island'
  | 'South Carolina'
  | 'South Dakota'
  | 'Tennessee'
  | 'Texas'
  | 'Utah'
  | 'Vermont'
  | 'Virginia'
  | 'Washington'
  | 'West Virginia'
  | 'Wisconsin'
  | 'Wyoming'
  | 'District of Columbia'
  | 'American Samoa'
  | 'Guam'
  | 'Northern Mariana Islands'
  | 'Puerto Rico'
  | 'U.S. Virgin Islands'

export type State = { abbreviation: StateAbbreviation; name: StateName; capital: string }

/**
 * Record of all U.S. states and territories by their abbreviation.
 */
export const StatesByAbbreviation: Record<StateAbbreviation, State> = {
  AL: { abbreviation: 'AL', name: 'Alabama', capital: 'Montgomery' },
  AK: { abbreviation: 'AK', name: 'Alaska', capital: 'Juneau' },
  AZ: { abbreviation: 'AZ', name: 'Arizona', capital: 'Phoenix' },
  AR: { abbreviation: 'AR', name: 'Arkansas', capital: 'Little Rock' },
  CA: { abbreviation: 'CA', name: 'California', capital: 'Sacramento' },
  CO: { abbreviation: 'CO', name: 'Colorado', capital: 'Denver' },
  CT: { abbreviation: 'CT', name: 'Connecticut', capital: 'Hartford' },
  DE: { abbreviation: 'DE', name: 'Delaware', capital: 'Dover' },
  FL: { abbreviation: 'FL', name: 'Florida', capital: 'Tallahassee' },
  GA: { abbreviation: 'GA', name: 'Georgia', capital: 'Atlanta' },
  HI: { abbreviation: 'HI', name: 'Hawaii', capital: 'Honolulu' },
  ID: { abbreviation: 'ID', name: 'Idaho', capital: 'Boise' },
  IL: { abbreviation: 'IL', name: 'Illinois', capital: 'Springfield' },
  IN: { abbreviation: 'IN', name: 'Indiana', capital: 'Indianapolis' },
  IA: { abbreviation: 'IA', name: 'Iowa', capital: 'Des Moines' },
  KS: { abbreviation: 'KS', name: 'Kansas', capital: 'Topeka' },
  KY: { abbreviation: 'KY', name: 'Kentucky', capital: 'Frankfort' },
  LA: { abbreviation: 'LA', name: 'Louisiana', capital: 'Baton Rouge' },
  ME: { abbreviation: 'ME', name: 'Maine', capital: 'Augusta' },
  MD: { abbreviation: 'MD', name: 'Maryland', capital: 'Annapolis' },
  MA: { abbreviation: 'MA', name: 'Massachusetts', capital: 'Boston' },
  MI: { abbreviation: 'MI', name: 'Michigan', capital: 'Lansing' },
  MN: { abbreviation: 'MN', name: 'Minnesota', capital: 'Saint Paul' },
  MS: { abbreviation: 'MS', name: 'Mississippi', capital: 'Jackson' },
  MO: { abbreviation: 'MO', name: 'Missouri', capital: 'Jefferson City' },
  MT: { abbreviation: 'MT', name: 'Montana', capital: 'Helena' },
  NE: { abbreviation: 'NE', name: 'Nebraska', capital: 'Lincoln' },
  NV: { abbreviation: 'NV', name: 'Nevada', capital: 'Carson City' },
  NH: { abbreviation: 'NH', name: 'New Hampshire', capital: 'Concord' },
  NJ: { abbreviation: 'NJ', name: 'New Jersey', capital: 'Trenton' },
  NM: { abbreviation: 'NM', name: 'New Mexico', capital: 'Santa Fe' },
  NY: { abbreviation: 'NY', name: 'New York', capital: 'Albany' },
  NC: { abbreviation: 'NC', name: 'North Carolina', capital: 'Raleigh' },
  ND: { abbreviation: 'ND', name: 'North Dakota', capital: 'Bismarck' },
  OH: { abbreviation: 'OH', name: 'Ohio', capital: 'Columbus' },
  OK: { abbreviation: 'OK', name: 'Oklahoma', capital: 'Oklahoma City' },
  OR: { abbreviation: 'OR', name: 'Oregon', capital: 'Salem' },
  PA: { abbreviation: 'PA', name: 'Pennsylvania', capital: 'Harrisburg' },
  RI: { abbreviation: 'RI', name: 'Rhode Island', capital: 'Providence' },
  SC: { abbreviation: 'SC', name: 'South Carolina', capital: 'Columbia' },
  SD: { abbreviation: 'SD', name: 'South Dakota', capital: 'Pierre' },
  TN: { abbreviation: 'TN', name: 'Tennessee', capital: 'Nashville' },
  TX: { abbreviation: 'TX', name: 'Texas', capital: 'Austin' },
  UT: { abbreviation: 'UT', name: 'Utah', capital: 'Salt Lake City' },
  VT: { abbreviation: 'VT', name: 'Vermont', capital: 'Montpelier' },
  VA: { abbreviation: 'VA', name: 'Virginia', capital: 'Richmond' },
  WA: { abbreviation: 'WA', name: 'Washington', capital: 'Olympia' },
  WV: { abbreviation: 'WV', name: 'West Virginia', capital: 'Charleston' },
  WI: { abbreviation: 'WI', name: 'Wisconsin', capital: 'Madison' },
  WY: { abbreviation: 'WY', name: 'Wyoming', capital: 'Cheyenne' },
  DC: {
    abbreviation: 'DC',
    name: 'District of Columbia',
    capital: 'D.C. is not a state and does not have a capital'
  },
  AS: { abbreviation: 'AS', name: 'American Samoa', capital: 'Pago Pago' },
  GU: { abbreviation: 'GU', name: 'Guam', capital: 'Hagatna' },
  MP: { abbreviation: 'MP', name: 'Northern Mariana Islands', capital: 'Saipan' },
  PR: { abbreviation: 'PR', name: 'Puerto Rico', capital: 'San Juan' },
  VI: { abbreviation: 'VI', name: 'U.S. Virgin Islands', capital: 'Charlotte Amalie' }
}

/**
 * Record of all U.S. states and territories by their name.
 */
export const StatesByName = Object.fromEntries(
  Object.entries(StatesByAbbreviation).map(([, state]) => [state.name, state])
) as Record<StateName, State>

/**
 * Checks if a string is a valid state abbreviation.
 */
export const isStateAbbreviation = (value: string): value is StateAbbreviation =>
  StatesByAbbreviation[value as StateAbbreviation] !== undefined

/**
 * Checks if a string is a valid state name.
 */
export const isStateName = (value: string): value is StateName =>
  StatesByName[value as StateName] !== undefined

/**
 * Checks if a string is a valid state abbreviation or name.
 */
export const isState = (value: string): value is StateAbbreviation | StateName =>
  isStateAbbreviation(value) || isStateName(value)

/**
 * A question from the civics questions file.
 *
 * @property theme - The theme of the question (e.g. "The United States Constitution")
 * @property section - The section of the question (e.g. "Section 1")
 * @property question - The question text
 * @property answers - An array of answers, either text or senators
 */
export type Question = DeepReadonly<{
  theme: string
  section: string
  question: string
  answers:
    | { _type: 'text'; choices: string[] }
    | { _type: 'senator'; choices: { senator: string; state: StateAbbreviation }[] }
    | { _type: 'representative'; choices: { representative: string; state: StateAbbreviation }[] }
}>

export const SenatorSchema = Schema.Struct({
  last_name: Schema.String,
  first_name: Schema.String,
  party: Schema.String,
  state: Schema.Literal(
    ...Object.values(StatesByAbbreviation).map((s) => s.abbreviation)
  ).annotations({
    name: 'State'
  }),
  address: Schema.String,
  phone: Schema.String,
  email: Schema.String,
  website: Schema.String,
  class: Schema.String,
  bioguide_id: Schema.String,
  member_full: Schema.String
}).annotations({
  name: 'Senator'
})
export type Senator = typeof SenatorSchema.Type

export const RepresentativeSchema = Schema.Struct({
  name: Schema.NonEmptyString,
  state: Schema.Literal(
    ...Object.values(StatesByAbbreviation).map((s) => s.abbreviation)
  ).annotations({
    name: 'State'
  }),
  district: Schema.NonEmptyString,
  party: Schema.NonEmptyString,
  officeRoom: Schema.NonEmptyString,
  phone: Schema.NonEmptyString,
  committeeAssignment: Schema.String,
  website: Schema.NonEmptyString
}).annotations({
  name: 'Representative'
})
export type Representative = typeof RepresentativeSchema.Type

export const GovernorSchema = Schema.Struct({
  state: Schema.Literal(...Object.values(StatesByAbbreviation).map((s) => s.abbreviation)),
  name: Schema.NonEmptyString,
  governorUrl: Schema.NonEmptyString,
  contactUrl: Schema.optional(Schema.NonEmptyString),
  phone: Schema.optional(Schema.NonEmptyString),
  address: Schema.Struct({
    street: Schema.NonEmptyString,
    city: Schema.NonEmptyString,
    state: Schema.NonEmptyString,
    zip: Schema.NonEmptyString
  }).annotations({
    name: 'Address'
  }),
  stateGovernmentWebsite: Schema.NonEmptyString
}).annotations({
  name: 'Governor'
})
export type Governor = typeof GovernorSchema.Type

export const StateGovernmentLinkSchema = Schema.Struct({
  state: Schema.Literal(
    ...Object.values(StatesByAbbreviation).map((s) => s.abbreviation)
  ).annotations({
    name: 'State'
  }),
  url: Schema.String,
  file: Schema.optional(Schema.String)
})
export type StateGovernmentLink = typeof StateGovernmentLinkSchema.Type
export type StateGovernmentLinks = ReadonlyArray<StateGovernmentLink>

export type StateGovernmentPage = Readonly<{ state: StateAbbreviation; url: string; html: string }>
