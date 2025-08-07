import { StateAbbreviation } from 'civics2json'
import { civicsQuestionsWithDistractors } from 'questionnaire/data'

// Representatives data type simplified for district selection
type RepresentativeChoice = Readonly<{
  representative: string
  state: StateAbbreviation
  district: string
}>

/**
 * Extract representatives data from the static civics questions data
 * This gets the actual representatives from the civics2json package data
 */
const getRepresentativesData = (): readonly RepresentativeChoice[] => {
  // Find the representatives question in the static data
  const representativeQuestion = civicsQuestionsWithDistractors.find(
    (q) => q.answers._type === 'representative'
  )

  if ((representativeQuestion != null) && representativeQuestion.answers._type === 'representative') {
    const representativesData: readonly RepresentativeChoice[]  = representativeQuestion.answers.choices
    return representativesData
  }

  // This should never happen with valid data, but provide empty array as fallback
  console.warn('No representatives question found in civics data')
  return []
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