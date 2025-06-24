import { describe, it, expect } from '@jest/globals'
import { parseRepresentatives } from '../src/Representatives'
import { Effect, Schema } from 'effect'
import { FileSystem, Path } from '@effect/platform'
import { NodeContext } from '@effect/platform-node'
import { RepresentativeSchema, StatesByAbbreviation } from '@src/types'

describe('parseRepresentatives', () => {
  const minimalHTML = `
    <table class="table">
      <caption id="state-california">California</caption>
      <tbody>
        <tr>
          <td>1st</td>
          <td><a href="https://lamalfa.house.gov">LaMalfa, Doug</a></td>
          <td>R</td>
          <td>2423 RHOB</td>
          <td>555-555-5555</td>
          <td>Committee Assignment</td>
        </tr>
        <tr>
          <td>2nd</td>
          <td><a href="https://huffman.house.gov">Huffman, Jared</a></td>
          <td>D</td>
          <td>1527 LHOB</td>
          <td>555-555-5555</td>
          <td></td>
        </tr>
      </tbody>
    </table>
  `

  it('parses a minimal valid HTML for one state', async () => {
    const result = await Effect.runPromise(parseRepresentatives(minimalHTML))
    expect(result).toHaveLength(2)
    expect(result[0]).toMatchObject({
      name: 'LaMalfa, Doug',
      state: 'CA',
      district: '1st',
      party: 'R',
      officeRoom: '2423 RHOB',
      website: 'https://lamalfa.house.gov',
      phone: '555-555-5555',
      committeeAssignment: 'Committee Assignment'
    })
    expect(result[1]).toMatchObject({
      name: 'Huffman, Jared',
      state: 'CA',
      district: '2nd',
      party: 'D',
      officeRoom: '1527 LHOB',
      website: 'https://huffman.house.gov',
      phone: '555-555-5555',
      committeeAssignment: ''
    })
  })

  it('parses a Virgin Islands representative', async () => {
    const html = `
      <table class="table">
        <caption id="state-virgin-islands">Virgin Islands</caption>
        <tbody>
          <tr>
            <td>At-Large</td>
            <td><a href="https://plaskett.house.gov">Plaskett, Stacey</a></td>
            <td>D</td>
            <td>331 CHOB</td>
            <td>202-225-1790</td>
            <td>Committee on Ways and Means</td>
          </tr>
        </tbody>
      </table>
    `
    const result = await Effect.runPromise(parseRepresentatives(html))
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      name: 'Plaskett, Stacey',
      state: 'VI',
      district: 'At-Large',
      party: 'D',
      officeRoom: '331 CHOB',
      website: 'https://plaskett.house.gov',
      phone: '202-225-1790',
      committeeAssignment: 'Committee on Ways and Means'
    })
  })

  it('ignores tables with unknown state captions', async () => {
    const html = `
      <table class="table">
        <caption>Unknownland</caption>
        <tbody>
          <tr>
            <td>1st</td>
            <td><a href="https://foo.house.gov">Foo, Bar</a></td>
            <td>X</td>
            <td>0000 XHOB</td>
          </tr>
        </tbody>
      </table>
    `
    const result = await Effect.runPromise(parseRepresentatives(html))
    expect(result).toHaveLength(0)
  })

  it('handles empty HTML gracefully', async () => {
    const result = await Effect.runPromise(parseRepresentatives(''))
    expect(result).toHaveLength(0)
  })

  it('trims whitespace and handles odd formatting', async () => {
    const html = `
      <table class="table">
        <caption id="state-california">  California  </caption>
        <tbody>
          <tr>
            <td>   1st   </td>
            <td> <a href="https://lamalfa.house.gov">   LaMalfa,   Doug   </a> </td>
            <td> R </td>
            <td> 2423 RHOB </td>
            <td> 555-555-5555 </td>
            <td> Committee Assignment </td>
          </tr>
        </tbody>
      </table>
    `
    const result = await Effect.runPromise(parseRepresentatives(html))
    expect(result[0]).toMatchObject({
      name: 'LaMalfa, Doug',
      state: 'CA',
      district: '1st',
      party: 'R',
      officeRoom: '2423 RHOB',
      website: 'https://lamalfa.house.gov',
      phone: '555-555-5555',
      committeeAssignment: 'Committee Assignment'
    })
  })

  it('parses multiple states and multiple rows', async () => {
    const html = `
      <table class="table">
        <caption id="state-california">California</caption>
        <tbody>
          <tr>
            <td>1st</td>
            <td><a href="https://lamalfa.house.gov">LaMalfa, Doug</a></td>
            <td>R</td>
            <td>2423 RHOB</td>
            <td>555-555-5555</td>
            <td>Committee Assignment</td>
          </tr>
        </tbody>
      </table>
      <table class="table">
        <caption id="state-arizona">Arizona</caption>
        <tbody>
          <tr>
            <td>1st</td>
            <td><a href="https://schweikert.house.gov">Schweikert, David</a></td>
            <td>R</td>
            <td>1527 LHOB</td>
            <td>555-555-5555</td>
            <td>Committee Assignment</td>
          </tr>
        </tbody>
      </table>
    `
    const result = await Effect.runPromise(parseRepresentatives(html))
    expect(result).toMatchObject([
      {
        name: 'LaMalfa, Doug',
        state: 'CA',
        district: '1st',
        party: 'R',
        officeRoom: '2423 RHOB',
        website: 'https://lamalfa.house.gov',
        phone: '555-555-5555',
        committeeAssignment: 'Committee Assignment'
      },
      {
        name: 'Schweikert, David',
        state: 'AZ',
        district: '1st',
        party: 'R',
        officeRoom: '1527 LHOB',
        website: 'https://schweikert.house.gov',
        phone: '555-555-5555',
        committeeAssignment: 'Committee Assignment'
      }
    ])
  })
})

describe('representatives.json data integrity', () => {
  it('has 435 representatives from the 50 states, five delegates, and one resident commissioner', async () => {
    await Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const path = yield* Path.Path

      const repsFile = path.join(__dirname, '../data/representatives.json')
      const data = yield* fs.readFileString(repsFile)
      // 50 states: 435 voting reps, 5 delegates, 1 resident commissioner = 441 total

      const representatives = yield* Schema.decodeUnknown(Schema.parseJson())(data).pipe(
        Effect.flatMap((json) => Schema.decodeUnknown(Schema.Array(RepresentativeSchema))(json))
      )

      expect(representatives).toHaveLength(441)

      const stateAbbrs = Object.keys(StatesByAbbreviation).filter(
        (k) => !['DC', 'GU', 'MP', 'AS', 'VI', 'PR'].includes(k) // exclude territories
      )

      const repsFromStates = representatives.filter((r) => stateAbbrs.includes(r.state))
      expect(repsFromStates).toHaveLength(435)

      // Delegates: DC, GU, MP, AS, VI (district: Delegate)
      const delegateTerritories = ['DC', 'GU', 'MP', 'AS', 'VI']
      const delegates = representatives.filter(
        (r) => delegateTerritories.includes(r.state) && r.district === 'Delegate'
      )
      expect(delegates).toHaveLength(5)

      // Resident Commissioner: PR (district: Resident Commissioner)
      const commissioners = representatives.filter(
        (r) => r.state === 'PR' && r.district === 'Resident Commissioner'
      )

      expect(commissioners).toHaveLength(1)
    }).pipe(Effect.provide(NodeContext.layer), Effect.runPromise)
  })
})
