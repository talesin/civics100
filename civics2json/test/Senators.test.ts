import { describe, it, expect } from '@jest/globals'
import { parseSenators } from '@src/Senators'
import { Effect } from 'effect'

const minimalXml = `<?xml version="1.0" encoding="UTF-8"?>
<contact_information>
  <member>
    <member_full>Doe (I-XX)</member_full>
    <last_name>Doe</last_name>
    <first_name>Jane</first_name>
    <party>I</party>
    <state>XX</state>
    <address>1 Main St</address>
    <phone>(555) 555-5555</phone>
    <email>jane.doe@example.com</email>
    <website>https://doe.senate.gov/</website>
    <class>Class I</class>
    <bioguide_id>D000000</bioguide_id>
  </member>
</contact_information>`

const multiXml = `<?xml version="1.0" encoding="UTF-8"?>
<contact_information>
  <member>
    <member_full>Doe (I-XX)</member_full>
    <last_name>Doe</last_name>
    <first_name>Jane</first_name>
    <party>I</party>
    <state>XX</state>
    <address>1 Main St</address>
    <phone>(555) 555-5555</phone>
    <email>jane.doe@example.com</email>
    <website>https://doe.senate.gov/</website>
    <class>Class I</class>
    <bioguide_id>D000000</bioguide_id>
  </member>
  <member>
    <member_full>Smith (D-YY)</member_full>
    <last_name>Smith</last_name>
    <first_name>John</first_name>
    <party>D</party>
    <state>YY</state>
    <address>2 Main St</address>
    <phone>(555) 555-0000</phone>
    <email>john.smith@example.com</email>
    <website>https://smith.senate.gov/</website>
    <class>Class II</class>
    <bioguide_id>S000001</bioguide_id>
  </member>
</contact_information>`

describe('parseSenators', () => {
  it('parses a single senator', async () => {
    const result = await Effect.runPromise(parseSenators(minimalXml))
    expect(result).toEqual([
      {
        last_name: 'Doe',
        first_name: 'Jane',
        party: 'I',
        state: 'XX',
        address: '1 Main St',
        phone: '(555) 555-5555',
        email: 'jane.doe@example.com',
        website: 'https://doe.senate.gov/',
        class: 'Class I',
        bioguide_id: 'D000000',
        member_full: 'Doe (I-XX)'
      }
    ])
  })

  it('parses multiple senators', async () => {
    const result = await Effect.runPromise(parseSenators(multiXml))
    expect(result.length).toBe(2)
    expect(result[0]?.last_name).toBe('Doe')
    expect(result[1]?.first_name).toBe('John')
    expect(result[1]?.class).toBe('Class II')
  })

  it('throws on malformed XML', async () => {
    await expect(
      Effect.runPromise(parseSenators('<contact_information><member></contact_information>'))
    ).rejects.toBeDefined()
  })

  it('throws on missing fields', async () => {
    // missing member_full, should fail schema
    const badXml = `<?xml version="1.0" encoding="UTF-8"?><contact_information><member><last_name>Doe</last_name></member></contact_information>`
    await expect(Effect.runPromise(parseSenators(badXml))).rejects.toBeDefined()
  })
})
