# Issue

Some questions require 2 or more answers, but only allow the user to select 1 answer. Changes will need to be made in the CLI and the web versions.

Remember to follow [coding-style-guide.md](coding-style-guide.md).

Example:

```json
{
  "theme": "AMERICAN GOVERNMENT",
  "section": "Principles of American Democracy",
  "question": "What are two rights in the Declaration of Independence?",
  "questionNumber": 9,
  "expectedAnswers": 2,
  "answers": {
    "_type": "text",
    "choices": [
      "life",
      "liberty",
      "pursuit of happiness"
    ]
}
```
