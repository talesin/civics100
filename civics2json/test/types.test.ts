import { describe, it, expect } from '@jest/globals'
import {
  isStateAbbreviation,
  isStateName,
  isState,
  StatesByAbbreviation,
  StatesByName,
  StateAbbreviation,
  StateName
} from '@src/types'

describe('isStateAbbreviation', () => {
  it('returns true for valid state abbreviations', () => {
    expect(isStateAbbreviation('CA')).toBe(true)
    expect(isStateAbbreviation('NY')).toBe(true)
    expect(isStateAbbreviation('DC')).toBe(true)
  })
  it('returns false for invalid abbreviations', () => {
    expect(isStateAbbreviation('ZZ')).toBe(false)
    expect(isStateAbbreviation('California')).toBe(false)
    expect(isStateAbbreviation('')).toBe(false)
  })
})

describe('isStateName', () => {
  it('returns true for valid state names', () => {
    expect(isStateName('California')).toBe(true)
    expect(isStateName('New York')).toBe(true)
    expect(isStateName('District of Columbia')).toBe(true)
  })
  it('returns false for invalid names', () => {
    expect(isStateName('CA')).toBe(false)
    expect(isStateName('ZZ')).toBe(false)
    expect(isStateName('')).toBe(false)
  })
})

describe('isState', () => {
  it('returns true for valid abbreviations or names', () => {
    expect(isState('CA')).toBe(true)
    expect(isState('California')).toBe(true)
    expect(isState('DC')).toBe(true)
    expect(isState('District of Columbia')).toBe(true)
  })
  it('returns false for invalid values', () => {
    expect(isState('ZZ')).toBe(false)
    expect(isState('NotAState')).toBe(false)
    expect(isState('')).toBe(false)
  })
})

describe('StatesByAbbreviation', () => {
  it('maps valid abbreviations to state objects', () => {
    expect(StatesByAbbreviation['CA']?.name).toBe('California')
    expect(StatesByAbbreviation['NY']?.name).toBe('New York')
  })
  it('returns undefined for invalid abbreviations', () => {
    expect(StatesByAbbreviation['ZZ' as StateAbbreviation]).toBeUndefined()
  })
})

describe('StatesByName', () => {
  it('maps valid names to state objects', () => {
    expect(StatesByName['California']?.abbreviation).toBe('CA')
    expect(StatesByName['New York']?.abbreviation).toBe('NY')
  })
  it('returns undefined for invalid names', () => {
    expect(StatesByName['NotAState' as StateName]).toBeUndefined()
  })
})
