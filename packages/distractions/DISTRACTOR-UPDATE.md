# Task

Generate or augment **10–15 plausible distractors** per question in `questions-with-distractors.json` using OpenAI APIs, structured templates, or heuristics depending on the answer `_type`.

## Context

Each item in the dataset looks like:

```json
{
  "question": "What is the supreme law of the land?",
  "answers": {
    "_type": "text",
    "choices": ["the Constitution"]
  },
  "distractors": [...]
}
```

We want to populate or expand the `distractors` field to include 10–15 high-quality options.

---

# Goals

1. Parse the input file `questions-with-distractors.json`
2. For each question:
   - Determine the answer `_type`
   - Choose the correct distractor generation strategy:
     - For `_type: text`: use OpenAI unless the answer pattern suggests a known structure (e.g. names, dates, places)
     - For `_type: senator`, `representative`, `governor`, `capital`: pull distractors from the full list of people/places in the dataset, filtered by incorrect state/district
   - Combine with existing distractors
   - Deduplicate and filter:
     - Remove fuzzy duplicates
     - Avoid correct answers (globally)
     - Ensure structural consistency
   - Replace the existing `distractors` field with the cleaned final list
3. Write output to `questions-with-distractors.generated.json`

---

# Inputs

- `questions-with-distractors.json`
- OpenAI API key (via `.env` or process env)
- Optional CLI flags:
  - `--regen-all`: ignore existing distractors
  - `--regen-incomplete`: only regenerate if `distractors.length < 10`
  - `--num 15`: target distractor count per question
  - `--filter-similar`: apply similarity filtering
  - `--check-answers`: filter out distractors that appear as correct answers elsewhere

---

# Distractor Strategies by `_type`

### _type: `text`

Use OpenAI prompt generation **unless** a pattern is detected:
- If answer matches:
  - U.S. states → pull random other states
  - Presidents → pull real but wrong presidents
  - Dates or years → generate similar-sounding wrong dates
  - Numbers (e.g. 50, 1776) → jittered or nearby alternatives

Use this prompt:

````
You are an expert in U.S. civics education.

Write 10–15 plausible but incorrect answers for the question below.

### Instructions:
- Each distractor must be *wrong*, but sound reasonable.
- Match the structure and type of the correct answers.
- Avoid joke or implausible responses.
- Output a JSON array.

### Question:
{{question}}

### Correct Answer(s):
{{formattedAnswers}}

### Theme:
{{theme}} / {{section}}

### Output:
JSON array only
````

---

### _type: `senator`, `representative`, `governor`

Generate distractors by:
- Selecting people from other states
- Filtering out names from the correct state or territory
- Formatting consistently:
  - `{{first}} {{last}}` or title-cased name only
- Random sampling to reach 10–15 unique options

---

### _type: `capital`

Generate distractors by:
- Selecting capitals of **other** states or territories
- Avoiding:
  - Capitals of the correct state
  - Major cities like NYC or LA unless they're plausible
- Ensure names are all legitimate U.S. capitals or well-known incorrect options

---

# Output Format

```json
{
  "question": "...",
  "answers": {
    "_type": "text" | "senator" | "representative" | "governor" | "capital",
    "choices": [...]
  },
  "distractors": [
    "... up to 15 final distractors ..."
  ]
}
```

---

# Success Criteria

- Each question has **10–15 high-quality distractors**
- All distractors are **plausible but wrong**
- No distractor duplicates any correct answer
- Structure and content are consistent
- Final output written to `questions-with-distractors.generated.json`