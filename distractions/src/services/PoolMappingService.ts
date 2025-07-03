import { Effect } from 'effect'
import type { QuestionType } from './QuestionClassifierService'

// Import all static pools
import { usBranchesOfGovernment } from '../data/pools/branches-of-government'
import { usStates, usTerritories, usOceans, usRivers } from '../data/pools/geography'
import { usStateCapitals } from '../data/pools/state-capitals'
import { cabinetLevels } from '../data/pools/government'
import { usPresidents, usVicePresidents, usWars } from '../data/pools/history'
import { usRepresentatives } from '../data/pools/representatives'
import { usRightsAndFreedoms } from '../data/pools/rights-freedoms'
import { usSenators } from '../data/pools/senators'

export type StaticPoolData = {
  readonly presidents: readonly string[]
  readonly vicePresidents: readonly string[]
  readonly wars: readonly string[]
  readonly branches: readonly string[]
  readonly cabinet: readonly string[]
  readonly states: readonly string[]
  readonly territories: readonly string[]
  readonly capitals: readonly string[]
  readonly oceans: readonly string[]
  readonly rivers: readonly string[]
  readonly representatives: readonly string[]
  readonly senators: readonly string[]
  readonly rights: readonly string[]
  readonly documents: readonly string[]
}

const staticPoolData: StaticPoolData = {
  presidents: usPresidents,
  vicePresidents: usVicePresidents,
  wars: usWars,
  branches: usBranchesOfGovernment,
  cabinet: cabinetLevels,
  states: usStates,
  territories: usTerritories,
  capitals: usStateCapitals,
  oceans: usOceans,
  rivers: usRivers,
  representatives: usRepresentatives,
  senators: usSenators,
  rights: usRightsAndFreedoms,
  documents: [
    'the Constitution',
    'the Declaration of Independence',
    'the Bill of Rights',
    'the Articles of Confederation',
    'the Federalist Papers',
    'the Emancipation Proclamation',
    'the Gettysburg Address',
    'the Magna Carta',
    'the Treaty of Paris',
    'the Louisiana Purchase',
    'the Monroe Doctrine'
  ]
}

export type PoolMapping = {
  readonly primary: readonly (keyof StaticPoolData)[]
  readonly secondary?: readonly (keyof StaticPoolData)[]
}

export class PoolMappingService extends Effect.Service<PoolMappingService>()('PoolMappingService', {
  effect: Effect.succeed({
    getPoolsForQuestionType: (questionType: QuestionType): PoolMapping => {
      switch (questionType) {
        case 'president':
          return {
            primary: ['presidents'],
            secondary: ['vicePresidents']
          }

        case 'war':
          return {
            primary: ['wars'],
            secondary: ['presidents'] // Presidents who led during wars
          }

        case 'government_branch':
          return {
            primary: ['branches'],
            secondary: ['cabinet']
          }

        case 'document':
          return {
            primary: ['documents'],
            secondary: ['rights'] // Related rights and freedoms
          }

        case 'state':
          return {
            primary: ['states'],
            secondary: ['territories', 'capitals', 'oceans', 'rivers']
          }

        case 'capital':
          return {
            primary: ['capitals'],
            secondary: ['states']
          }

        case 'rights':
          return {
            primary: ['rights'],
            secondary: ['documents']
          }

        case 'senator':
          return {
            primary: ['senators'],
            secondary: ['states']
          }

        case 'representative':
          return {
            primary: ['representatives'],
            secondary: ['states']
          }

        case 'governor':
          return {
            primary: ['states'],
            secondary: ['capitals']
          }

        case 'number':
          return {
            primary: ['states', 'territories'], // For counting questions
            secondary: ['wars', 'presidents']
          }

        case 'abstract':
          return {
            primary: ['branches', 'documents'],
            secondary: ['rights', 'presidents']
          }

        default:
          return {
            primary: ['documents', 'branches'],
            secondary: ['rights']
          }
      }
    },

    getStaticPoolData: (): StaticPoolData => staticPoolData,

    getDistractorsFromPools: (
      mapping: PoolMapping,
      excludeAnswers: readonly string[] = []
    ): readonly string[] => {
      const primaryDistractors = mapping.primary.flatMap((poolName) => staticPoolData[poolName])
      const secondaryDistractors =
        mapping.secondary?.flatMap((poolName) => staticPoolData[poolName]) ?? []

      const allDistractors = [...primaryDistractors, ...secondaryDistractors]

      // Filter out exact matches with correct answers
      return allDistractors.filter(
        (distractor) =>
          !excludeAnswers.some((answer) => answer.toLowerCase() === distractor.toLowerCase())
      )
    }
  })
}) {}
