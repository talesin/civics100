import { describe, it, expect } from '@jest/globals'
import { parseRepresentatives } from '../src/Representatives'
import { Effect } from 'effect'

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
        </tr>
        <tr>
          <td>2nd</td>
          <td><a href="https://huffman.house.gov">Huffman, Jared</a></td>
          <td>D</td>
          <td>1527 LHOB</td>
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
      phone: '',
      committeeAssignment: ''
    })
    expect(result[1]).toMatchObject({
      name: 'Huffman, Jared',
      state: 'CA',
      district: '2nd',
      party: 'D',
      officeRoom: '1527 LHOB',
      website: 'https://huffman.house.gov',
      phone: '',
      committeeAssignment: ''
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

  it('skips rows with missing columns', async () => {
    const html = `
      <table class="table">
        <caption id="state-california">California</caption>
        <tbody>
          <tr>
            <td>1st</td>
            <td><a href="https://lamalfa.house.gov">LaMalfa, Doug</a></td>
            <td>R</td>
            <!-- Missing officeRoom column -->
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
      phone: '',
      committeeAssignment: ''
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
          </tr>
        </tbody>
      </table>
    `
    const result = await Effect.runPromise(parseRepresentatives(html))
    expect(result).toHaveLength(2)
    expect(result[0]?.state).toBe('CA')
    expect(result[1]?.state).toBe('AZ')
  })
})
