import { describe, it, expect } from '@jest/globals'
import { Effect } from 'effect'
import { parseGovernorInfo } from '@src/Governors'
import { type StateAbbreviation } from '@src/types'

describe('parseGovernorInfo', () => {
  const state: StateAbbreviation = 'CA'
  const validHtml = `
    <div id="State-Directory-Table">
      <div>
        <span class="field field--name-field-website field--type-link field--label-hidden field__item line-height-2">
          <a href="https://www.ca.gov/">California</a>
        </span>
      </div>
      <div>
        <span class="field field--name-field-governor field--type-link field--label-hidden field__item line-height-2">
          <a href="https://www.gov.ca.gov/">Governor Gavin Newsom</a>
        </span>
      </div>
      <div>
        <span class="field field--name-field-governor-contact field--type-link field--label-hidden field__item line-height-2">
          <a href="https://www.gov.ca.gov/contact/">Contact Governor Newsom</a>
        </span>
      </div>
      <div>
        <p class="phoneNumberField">1-916-445-2841</p>
      </div>
      <div>
        <span class="field field--name-field-street-1">1021 O Street, Suite 9000</span>
        <span class="field field--name-field-city">Sacramento</span>,
        <span class="field field--name-field-state-abbr">CA</span>
        <span class="field field--name-field-zip">95814</span>
      </div>
    </div>
  `

  it('parses all required governor fields from valid html', async () => {
    const result = await Effect.runPromise(parseGovernorInfo(validHtml, state))
    expect(result).toEqual({
      state: 'CA',
      name: 'Gavin Newsom',
      governorUrl: 'https://www.gov.ca.gov/',
      contactUrl: 'https://www.gov.ca.gov/contact/',
      phone: '1-916-445-2841',
      address: {
        street: '1021 O Street, Suite 9000',
        city: 'Sacramento',
        state: 'CA',
        zip: '95814'
      },
      stateGovernmentWebsite: 'https://www.ca.gov/'
    })
  })

  it('throws ParseError if required fields are missing', async () => {
    const missingHtml = `
      <div id="State-Directory-Table">
        <div>
          <span class="field field--name-field-website field--type-link field--label-hidden field__item line-height-2">
            <a href="https://www.ca.gov/">California</a>
          </span>
        </div>
        <!-- Missing governor field -->
        <div>
          <span class="field field--name-field-governor-contact field--type-link field--label-hidden field__item line-height-2">
            <a href="https://www.gov.ca.gov/contact/">Contact Governor Newsom</a>
          </span>
        </div>
        <div>
          <p class="phoneNumberField">1-916-445-2841</p>
        </div>
        <div>
          <span class="field field--name-field-street-1">1021 O Street, Suite 9000</span>
          <span class="field field--name-field-city">Sacramento</span>,
          <span class="field field--name-field-state-abbr">CA</span>
          <span class="field field--name-field-zip">95814</span>
        </div>
      </div>
    `
    await Effect.gen(function* () {
      const result = yield* Effect.either(parseGovernorInfo(missingHtml, state))
      expect(result).toMatchObject({
        _tag: 'Left',
        left: {
          _tag: 'ParseError'
        }
      })
    }).pipe(Effect.runPromise)
  })

  it('throws ParseError if #State-Directory-Table is missing', async () => {
    const noTableHtml = `<div><p>No table here</p></div>`
    await Effect.gen(function* () {
      const result = yield* Effect.either(parseGovernorInfo(noTableHtml, state))
      expect(result).toMatchObject({
        _tag: 'Left',
        left: {
          _tag: 'ParseError'
        }
      })
    }).pipe(Effect.runPromise)
  })

  it('throws ParseError if address fields are missing', async () => {
    const missingAddressHtml = `
      <div id="State-Directory-Table">
        <div>
          <span class="field field--name-field-website field--type-link field--label-hidden field__item line-height-2">
            <a href="https://www.ca.gov/">California</a>
          </span>
        </div>
        <div>
          <span class="field field--name-field-governor field--type-link field--label-hidden field__item line-height-2">
            <a href="https://www.gov.ca.gov/">Governor Gavin Newsom</a>
          </span>
        </div>
        <div>
          <span class="field field--name-field-governor-contact field--type-link field--label-hidden field__item line-height-2">
            <a href="https://www.gov.ca.gov/contact/">Contact Governor Newsom</a>
          </span>
        </div>
        <div>
          <p class="phoneNumberField">1-916-445-2841</p>
        </div>
        <!-- Missing address -->
      </div>
    `
    await Effect.gen(function* () {
      const result = yield* Effect.either(parseGovernorInfo(missingAddressHtml, state))
      expect(result).toMatchObject({
        _tag: 'Left',
        left: {
          _tag: 'ParseError'
        }
      })
    }).pipe(Effect.runPromise)
  })

  it('throws ParseError for malformed html', async () => {
    const malformedHtml = `<div id="State-Directory-Table"><span class="field field--name-field-website"><a href="https://www.ca.gov/">California</a></span></div` // missing closing >
    await Effect.gen(function* () {
      const result = yield* Effect.either(parseGovernorInfo(malformedHtml, state))
      expect(result).toMatchObject({
        _tag: 'Left',
        left: {
          _tag: 'ParseError'
        }
      })
    }).pipe(Effect.runPromise)
  })

  it('parses with missing optional fields', async () => {
    const minimalHtml = `
      <div id="State-Directory-Table">
        <div>
          <span class="field field--name-field-website field--type-link field--label-hidden field__item line-height-2">
            <a href="https://www.ca.gov/">California</a>
          </span>
        </div>
        <div>
          <span class="field field--name-field-governor field--type-link field--label-hidden field__item line-height-2">
            <a href="https://www.gov.ca.gov/">Governor Gavin Newsom</a>
          </span>
        </div>
        <div>
          <!-- No contact -->
        </div>
        <div>
          <!-- No phone -->
        </div>
        <div>
          <span class="field field--name-field-street-1">1021 O Street, Suite 9000</span>
          <span class="field field--name-field-city">Sacramento</span>,
          <span class="field field--name-field-state-abbr">CA</span>
          <span class="field field--name-field-zip">95814</span>
        </div>
      </div>
    `
    const result = await Effect.runPromise(parseGovernorInfo(minimalHtml, state))
    expect(result).toEqual({
      state: 'CA',
      name: 'Gavin Newsom',
      governorUrl: 'https://www.gov.ca.gov/',
      contactUrl: undefined,
      phone: undefined,
      address: {
        street: '1021 O Street, Suite 9000',
        city: 'Sacramento',
        state: 'CA',
        zip: '95814'
      },
      stateGovernmentWebsite: 'https://www.ca.gov/'
    })
  })
})
