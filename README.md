# civics100

This repository contains a set of tools for parsing and processing the [U.S. Citizenship and Immigration Services](https://www.uscis.gov) [Civics Test](https://www.uscis.gov/civics-test) data.

## civics2json

The `civics2json` tool downloads the [Civics Test](https://www.uscis.gov/civics-test) data from the [U.S. Citizenship and Immigration Services](https://www.uscis.gov) and converts it to a JSON file.

### Usage

```bash
npx civics2json
```

### Output

The `civics2json` tool outputs a JSON file containing the [Civics Test](https://www.uscis.gov/civics-test) data.

```json
{
  "questions": [
    {
      "theme": "AMERICAN GOVERNMENT",
      "section": "Principles of American Democracy",
      "question": "What is the supreme law of the land?",
      "answers": {
        "_type": "text",
        "choices": ["the Constitution"]
      }
    },
    {
      "theme": "AMERICAN GOVERNMENT",
      "section": "Principles of American Democracy",
      "question": "What does the Constitution do?",
      "answers": {
        "_type": "text",
        "choices": [
          "sets up the government",
          "defines the government",
          "protects basic rights of Americans"
        ]
      }
    }
  ]
}
```
