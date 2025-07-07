# Todo Tasks

## civics2json package
- [x] Some questions require more than one answer, eg question 9 asks "What are two rights in the Declaration of Independence?". Add a new property to the Question type to identify the number of expected answers. Note, some questions may seem like the require more than one answer, eg question 17 asks "What are the two parts of the U.S. Congress?", but a single answer covers both parts, eg (the Senate and House (of Representatives)).
  - [x] Question 64 asks "There were 13 original states. Name three." but the `expectedAnswers` property is set to 1.
  - [x] Question 45 asks "What are the two major political parties in the United States?*" but the `expectedAnswers` property is set to 2 when the question only requires one answer.
  - [x] Question 48 asks "There are four amendments to the Constitution about who can vote. Describe one of them." but the `expectedAnswers` property is set to 4 when the question only requires one answer.
- [ ] Question 43, "Who is the Governor of your state now?", does not contain a list of state governors and instead is an empty array. This is a re-occurring issue. THe governors are only updated when `npx tsx src/index.ts governors fetch --force` is used. Add logic to ensure that if the governors file is empty that they are retrieved.

## distractions package
- [x] Review data quality of questions and distractors, eg question 98 contains date based distractors while not being a date question
  - This is not complete:
    - [x] Question 20 should have distractors that are peoples names, eg famous politicians
- [x] Some answers have a particular format, eg question 4 has the answer "a change (to the Constitution)" where part of the answer contains parentheses. When the distractors don't follow a similar format it makes the answer stand out. Another example is question 6, "What is one right or freedom from the First Amendment?*" with some of the distractors containing "right to" which makes them stand out given most of the correct answers are a single value. We should standardize the distractors to match the format of the correct answers.
- This is not complete:
  - [x] Many of the questions about presidents have their first names in parentheses, eg (Franklin) Roosevelt. The same applies for questions about rivers and oceans, eg Mississippi (River). We should standardize the distractors to match the format of the correct answers.
  - [x] Question 100 asks for "two national U.S. holidays" but the distractors are not holidays.

## questionnaire package
- [x] Some questions contain multiple correct answers, eg question 6 asks "What is one right or freedom from the First Amendment?*" with five correct answers. Let's upgrade the question selection to pair question and answer together, marking correct and incorrect the both.
- [x] When a question is selected, include it's correct/incorrect weighting in the selection process so the UI can display it. Update the CLI to display the correct/incorrect weighting of the selected question.
- [x] I got an error running the questionnaire CLI `npx tsx src/cli/index.ts --state WA`:
      ```
      🇺🇸 US Civics Questionnaire Engine
      ===================================
      Answer questions to test your knowledge!
      Unanswered and incorrect questions will appear more frequently.

      Loaded 293 questions with distractors.
      State: WA

      [15:04:58.007] ERROR (#17):
        TypeError: Cannot destructure property 'question' of 'nextQuestionWithWeight.value' as it is undefined.
            at <anonymous> (/Users/jeremy/Documents/Code/civics100/questionnaire/src/cli/index.ts:39:15)
      ``