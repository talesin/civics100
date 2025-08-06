# Issues

Issues and feature updates as of 2025-08-06

## State Selection in Web UI - ✅ 

State selection in the web UI doesn't impact the questionnaire - it defaults to California. Make sure the state selection is reflected in the questionnaire and that it filters the questions accordingly. This will ensure that users see questions relevant to their selected state.

## US Representatives and Senators contain State Abbreviations - ✅

The answers for the state US representatives and senators show the state next to their name, making it obvious which state they represent. This is redundant since the state is already selected in the UI. We should remove the state abbreviation from the representative and senator names in the answers.


## US Representatives by District

We need to update the US Representatives data to include district information. This will allow users to select their district and see the representatives for that district. The data should be structured in a way that allows easy filtering by district.
- Update the `data/civics-questions.json` to include the district information for each representative.
- Do not include the state in the representative's name, as it is redundant when the state is already selected.
- Make sure the representative's name is in the format "First Last" without the state abbreviation.

```json
{
  "theme": "AMERICAN GOVERNMENT",
  "section": "System of Government",
  "question": "Name your U.S. Representative.",
  "questionNumber": 23,
  "expectedAnswers": 1,
  "answers": {
    "_type": "representative",
    "choices": [
      {
        "representative": "Barry Moore",
        "state": "AL",
        "district": "1st"
      },
      {
        "representative": "Shomari Figures",
        "state": "AL",
        "district": "2nd"
      }
    ]
  }
}
```

## Distractor Generation

Distractors for many questions are currently hardcoded. We should implement a system to generate distractors based on the question type and context. These can pre computed and stored in the `questions-with-distractors.json` file. Distractors should be relevant to the question and not just random names or facts. The should follow the same pattern as the answers. We should analyze the answers for each questions and produce a test to determine the best distractors. This can be done by looking at the most common answers for each question type and then generating distractors that are similar but not the same.