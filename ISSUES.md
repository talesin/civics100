# Issues

## 2026-01-19 Font Size

The font size in several locations is too small to read. It is probably worth setting a minimum font size. Areas that are too small to read or should be larger due to emphasis:

- On the Game Settings:
  - "Select your state" above state drop down
  - State drop down text
  - Text that says "Selected <state> Capital: <capital>", small but in particular the state name is even smaller
  - "Questions will be customized based on your selected state's representatives, senators, and governor"
  - "Select your congressional district:"
  - District drop down text
  - Text below district drop down that seems to repeat the district name - is this even necessary?
  - "Selecting your district will show only your specific representative in relevant questions"
  - Everything in the elected officials box, but in particular "Senators", "Governor" and "U.S. Representative"
  - The description of the limits, eg "The game ends when you reach the pass threshold (early win), answer 9 questions incorrectly (early fail), or complete all questions. This matches the 2025 USCIS Civics Test format."
- The footer where "US Civics Test Practice" is very small and "Test your knowledge of American civics and history with questions based on the official U.S. Citizenship Test." is impossibly small to read
- On the Game Complete page:
  - Passing score is too small to read
  - "Session completed at ..." is impossibly small

## 2026-01-20 Multiple Choice Questions

The question _"There were 13 original states. Name five"_ needs a selection of 5 answers, however the `expectedAnsers` for it in `packages/civics2json/data/civics-questions.json` was set to 1. We should ensure that this value always reflects the actually number of expected answers.

## 2026-01-20 Testing Specific Questions in the Web UI

We need to be able to choose specfic questions for testing.