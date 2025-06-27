import { Schema } from 'effect'
import { StateAbbreviation, StatesByAbbreviation } from './types'

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
