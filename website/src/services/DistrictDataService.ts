import { StateAbbreviation } from 'civics2json'
import { civicsQuestionsWithDistractors } from 'questionnaire/data'

// Representatives data type simplified for district selection
type RepresentativeChoice = Readonly<{
  representative: string
  state: StateAbbreviation
  district: string
}>

// Senator data type
type SenatorChoice = Readonly<{
  senator: string
  state: StateAbbreviation
}>

// Governor data type
type GovernorChoice = Readonly<{
  governor: string
  state: StateAbbreviation
}>

// Module-level cache for extracted data (computed once, reused on subsequent calls)
let _representativesCache: readonly RepresentativeChoice[] | null = null
let _senatorsCache: readonly SenatorChoice[] | null = null
let _governorsCache: readonly GovernorChoice[] | null = null

/**
 * Extract representatives data from the static civics questions data
 * This gets the actual representatives from the civics2json package data
 * Results are cached after first extraction.
 */
const getRepresentativesData = (): readonly RepresentativeChoice[] => {
  if (_representativesCache !== null) {
    return _representativesCache
  }

  // Find the representatives question in the static data
  const representativeQuestion = civicsQuestionsWithDistractors.find(
    (q) => q.answers._type === 'representative'
  )

  if ((representativeQuestion != null) && representativeQuestion.answers._type === 'representative') {
    _representativesCache = representativeQuestion.answers.choices
    return _representativesCache
  }

  // This should never happen with valid data, but provide empty array as fallback
  console.warn('No representatives question found in civics data')
  _representativesCache = []
  return _representativesCache
}

/**
 * Get all districts for a given state
 * Returns array of district strings sorted in logical order
 */
export const getDistrictsForState = (state: StateAbbreviation): string[] => {
  const representatives = getRepresentativesData()

  const districts = representatives
    .filter((rep) => rep.state === state)
    .map((rep) => rep.district)
    .filter((district, index, array) => array.indexOf(district) === index) // Remove duplicates

  // Sort districts in logical order
  return districts.sort((a, b) => {
    // Handle special cases first
    if (a === 'At Large' && b !== 'At Large') return -1
    if (b === 'At Large' && a !== 'At Large') return 1
    if (a === 'Delegate' && b !== 'Delegate') return -1
    if (b === 'Delegate' && a !== 'Delegate') return 1
    if (a === 'Resident Commissioner' && b !== 'Resident Commissioner') return -1
    if (b === 'Resident Commissioner' && a !== 'Resident Commissioner') return 1

    // For numbered districts, extract the number and sort numerically
    const aMatch = parseInt(a.match(/^(\d+)/)?.[1] ?? '0')
    const bMatch = parseInt(b.match(/^(\d+)/)?.[1] ?? '0')

    return aMatch - bMatch
  })
}

/**
 * Get the representative for a specific state and district combination
 * Returns the representative's name or null if not found
 */
export const getRepresentativeForDistrict = (
  state: StateAbbreviation,
  district: string
): string | null => {
  const representatives = getRepresentativesData()

  const representative = representatives.find(
    (rep) => rep.state === state && rep.district === district
  )

  return (representative != null) ? representative.representative : null
}

/**
 * Get formatted district label for display
 * Handles different district types appropriately
 */
export const formatDistrictLabel = (district: string): string => {
  switch (district) {
    case 'At Large':
      return 'At-Large District'
    case 'Delegate':
      return 'Non-voting Delegate'
    case 'Resident Commissioner':
      return 'Resident Commissioner'
    default:
      // For numbered districts like "1st", "2nd", etc.
      if (district.match(/^\d+(st|nd|rd|th)$/) != null) {
        return `${district} District`
      }
      return district
  }
}

/**
 * Check if a district is valid for a given state
 */
export const isValidDistrict = (
  state: StateAbbreviation,
  district: string
): boolean => {
  const districts = getDistrictsForState(state)
  return districts.includes(district)
}

/**
 * Get the display name for a state-district combination
 */
export const getLocationDisplayName = (
  stateName: string,
  district?: string
): string => {
  if (district == null) {
    return stateName
  }

  const formattedDistrict = formatDistrictLabel(district)
  return `${stateName}, ${formattedDistrict}`
}

/**
 * Extract senators data from the static civics questions data
 * Results are cached after first extraction.
 */
const getSenatorData = (): readonly SenatorChoice[] => {
  if (_senatorsCache !== null) {
    return _senatorsCache
  }

  const senatorQuestion = civicsQuestionsWithDistractors.find(
    (q) => q.answers._type === 'senator'
  )

  if (senatorQuestion != null && senatorQuestion.answers._type === 'senator') {
    _senatorsCache = senatorQuestion.answers.choices
    return _senatorsCache
  }

  console.warn('No senators question found in civics data')
  _senatorsCache = []
  return _senatorsCache
}

/**
 * Extract governors data from the static civics questions data
 * Results are cached after first extraction.
 */
const getGovernorData = (): readonly GovernorChoice[] => {
  if (_governorsCache !== null) {
    return _governorsCache
  }

  const governorQuestion = civicsQuestionsWithDistractors.find(
    (q) => q.answers._type === 'governor'
  )

  if (governorQuestion != null && governorQuestion.answers._type === 'governor') {
    _governorsCache = governorQuestion.answers.choices
    return _governorsCache
  }

  console.warn('No governors question found in civics data')
  _governorsCache = []
  return _governorsCache
}

/**
 * Get senators for a given state
 * Returns array of senator names (typically 2 for states, 0 for territories)
 */
export const getSenatorForState = (state: StateAbbreviation): string[] => {
  const senators = getSenatorData()
  return senators
    .filter((s) => s.state === state)
    .map((s) => s.senator)
}

/**
 * Get governor for a given state
 * Returns the governor's name or null if not found
 */
export const getGovernorForState = (state: StateAbbreviation): string | null => {
  const governors = getGovernorData()
  const governor = governors.find((g) => g.state === state)
  return governor?.governor ?? null
}