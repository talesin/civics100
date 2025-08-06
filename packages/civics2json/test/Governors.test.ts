import { describe, it, expect } from '@jest/globals'
import { parseStateLinks } from '@src/Governors'
import { Effect } from 'effect'

describe('parseStateLinks', () => {
  const sampleHtml = `
<ul id="statelist">
  <li><a class="url" id="AL" href="/states/alabama">Alabama (AL)</a></li>
  <li><a class="url" id="AK" href="/states/alaska">Alaska (AK)</a></li>
  <li><a class="url" id="CA" href="/states/california">California (CA)</a></li>
  <li><a class="url" id="DC" href="/states/district-of-columbia">District of Columbia (DC)</a></li>
  <li><a class="url" id="FM" href="/states/federated-states-of-micronesia">Federated States of Micronesia (FM)</a></li>
  <li><a class="url" id="ZZ" href="">Invalid State</a></li>
  <li><a class="url" href="/states/missing-id">Missing ID</a></li>
</ul>
`

  it('parses all valid state links and normalizes URLs', async () => {
    const result = await Effect.runPromise(parseStateLinks(sampleHtml))
    expect(result).toEqual([
      { state: 'AK', url: '/states/alaska' },
      { state: 'AL', url: '/states/alabama' },
      { state: 'CA', url: '/states/california' },
      { state: 'DC', url: '/states/district-of-columbia' }
    ])
  })

  it('ignores links with missing id or url', async () => {
    const html = `
<ul id="statelist">
  <li><a class="url" id="AL" href="/states/alabama">Alabama (AL)</a></li>
  <li><a class="url" href="/states/missing-id">Missing ID</a></li>
  <li><a class="url" id="AK"></a></li>
</ul>`
    const result = await Effect.runPromise(parseStateLinks(html))
    expect(result).toEqual([{ state: 'AL', url: '/states/alabama' }])
  })

  it('returns an empty array for no matches', async () => {
    const html = `<ul id="statelist"></ul>`
    const result = await Effect.runPromise(parseStateLinks(html))
    expect(result).toEqual([])
  })

  it('returns empty array  for invalid HTML', async () => {
    const result = await Effect.runPromise(parseStateLinks('<not-html'))
    expect(result).toEqual([])
  })
})
