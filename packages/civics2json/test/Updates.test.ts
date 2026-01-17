import { describe, it, expect } from '@jest/globals'
import { parseUpdates } from '@src/Updates'
import { Effect } from 'effect'

describe('parseUpdates', () => {
  const questionHtml = `
  <div class="accordion__panel">
  <p>
    <strong>20. Who is one of your state's U.S. Senators now?*</strong>
  </p>
  <ul>
    <li>
      Answers will vary. [District of Columbia residents and residents of
      U.S. territories should answer that D.C. (or the territory where the
      applicant lives) has no U.S. Senators.]
    </li>
  </ul>
  <p> Visit <a href="https://www.senate.gov/">senate.gov</a> to find your state’s U.S. Senators. </p>
  <p>
    <br />
    <strong>23. Name your U.S. Representative.</strong>
  </p>
  <ul>
    <li>
      Answers will vary. [Residents of territories with nonvoting Delegates
      or Resident Commissioners may provide the name of that Delegate or
      Commissioner. Also acceptable is any statement that the territory has
      no (voting) Representatives in Congress.]
    </li>
  </ul>
  <p>
    <span>Visit </span>
    <a href="http://www.house.gov">
      <span>house.gov</span>
    </a>
    <span> to find your U.S. Representative.</span>
  </p>
  <p>
    <br />
    <strong>28. What is the name of the President of the United States
      now?*</strong>
  </p>
  <ul>
    <li>Donald J. Trump</li>
    <li>Donald Trump</li>
    <li>Trump<br />&nbsp;</li>
  </ul>
  <p>
    <strong>29. What is the name of the Vice President of the United States
      now?</strong>
  </p>
  <ul>
    <li>JD Vance</li>
    <li>Vance</li>
  </ul>
  <p>
    <br />
    <strong>39. How many justices are on the Supreme Court?</strong>
  </p>
  <ul>
    <li>nine (9)</li>
  </ul>
  <p>
    <br />
    <strong>40. Who is the Chief Justice of the United States now?</strong>
  </p>
  <ul>
    <li>John Roberts&nbsp;</li>
    <li>John G. Roberts, Jr.</li>
  </ul>
  <p>
    <br />
    <strong>43. Who is the Governor of your state now?</strong>
  </p>
  <ul>
    <li>
      Answers will vary. [District of Columbia residents should answer that
      D.C. does not have a Governor.]&nbsp;
    </li>
  </ul>
  <p> Visit <a href="https://www.usa.gov/states-and-territories"
    >usa.gov/states-and-territories</a>
    to find the Governor of your state. </p>
  <p>
    <br />
    <strong>46. What is the political party of the President now?</strong>
  </p>
  <ul>
    <li>Republican (Party)</li>
  </ul>
  <p>
    <br />
    <strong>47. What is the name of the Speaker of the House of Representatives
      now?</strong>
  </p>
  <ul>
    <li>Mike Johnson</li>
    <li>Johnson</li>
    <li>James Michael Johnson (birth name)</li>
  </ul>
  <p>
    <br />
    <strong>100. Name <u>two</u> national U.S. holidays.</strong>
  </p>
  <ul>
    <li>New Year’s Day</li>
    <li>Martin Luther King, Jr. Day</li>
    <li>Presidents’ Day</li>
    <li>Memorial Day</li>
    <li>Juneteenth</li>
    <li>Independence Day</li>
    <li>Labor Day</li>
    <li>Columbus Day</li>
    <li>Veterans Day</li>
    <li>Thanksgiving</li>
    <li>Christmas</li>
  </ul>
</div>
`

  const expectedJson = [
    {
      question: "Who is one of your state's U.S. Senators now?*",
      questionNumber: 20,
      answers: {
        _type: 'text',
        choices: [
          'Answers will vary. [District of Columbia residents and residents of U.S. territories should answer that D.C. (or the territory where the applicant lives) has no U.S. Senators.]'
        ]
      }
    },
    {
      question: 'Name your U.S. Representative.',
      questionNumber: 23,
      answers: {
        _type: 'text',
        choices: [
          'Answers will vary. [Residents of territories with nonvoting Delegates or Resident Commissioners may provide the name of that Delegate or Commissioner. Also acceptable is any statement that the territory has no (voting) Representatives in Congress.]'
        ]
      }
    },
    {
      question: 'What is the name of the President of the United States now?*',
      questionNumber: 28,
      answers: {
        _type: 'text',
        choices: ['Donald J. Trump', 'Donald Trump', 'Trump']
      }
    },
    {
      question: 'What is the name of the Vice President of the United States now?',
      questionNumber: 29,
      answers: {
        _type: 'text',
        choices: ['JD Vance', 'Vance']
      }
    },
    {
      question: 'How many justices are on the Supreme Court?',
      questionNumber: 39,
      answers: {
        _type: 'text',
        choices: ['nine (9)']
      }
    },
    {
      question: 'Who is the Chief Justice of the United States now?',
      questionNumber: 40,
      answers: {
        _type: 'text',
        choices: ['John Roberts', 'John G. Roberts, Jr.']
      }
    },
    {
      question: 'Who is the Governor of your state now?',
      questionNumber: 43,
      answers: {
        _type: 'text',
        choices: [
          'Answers will vary. [District of Columbia residents should answer that D.C. does not have a Governor.]'
        ]
      }
    },
    {
      question: 'What is the political party of the President now?',
      questionNumber: 46,
      answers: {
        _type: 'text',
        choices: ['Republican (Party)']
      }
    },
    {
      question: 'What is the name of the Speaker of the House of Representatives now?',
      questionNumber: 47,
      answers: {
        _type: 'text',
        choices: ['Mike Johnson', 'Johnson', 'James Michael Johnson (birth name)']
      }
    },
    {
      question: 'Name two national U.S. holidays.',
      questionNumber: 100,
      answers: {
        _type: 'text',
        choices: [
          'New Year’s Day',
          'Martin Luther King, Jr. Day',
          'Presidents’ Day',
          'Memorial Day',
          'Juneteenth',
          'Independence Day',
          'Labor Day',
          'Columbus Day',
          'Veterans Day',
          'Thanksgiving',
          'Christmas'
        ]
      }
    }
  ]
  it('should parse HTML for updated questions filtered for known questions', () => {
    const result = Effect.runSync(parseUpdates(questionHtml))
    expect(result).toEqual(expectedJson)
  })
})
