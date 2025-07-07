# Todo Tasks

## civics2json package
- [ ] Some questions require more than one answer, eg quesiton 9 asks "What are two rights in the Declaration of Independence?". Add a new property to the Question type to identify the number of expected answers. Note, some questions may seem like the require more than one answer, eg question 17 asks "What are the two parts of the U.S. Congress?", but a single answer covers both parts, eg (the Senate and House (of Representatives)).

## distractions package
- [ ] Review data quality of questions and distractors, eg question 98 contains date based distractors while not being a date question
- [ ] Some answers have a particular format, eg question 4 has the answer "a change (to the Constitution)" where part of the answer contains parentheses. When the distractors don't follow a similar format it makes the answer stand out. Another example is question 6, "What is one right or freedom from the First Amendment?*" with some of the distractors containing "right to" which makes them stand out given most of the correct answers are a single value. We should standardize the distractors to match the format of the correct answers.

## questionnaire package
- [ ] Some questions contain multiple correct answers, eg question 6 asks "What is one right or freedom from the First Amendment?*" with five correct answers. Let's upgrade the question selection to pair question and answer together, marking correct and incorrect the both.
- [ ] When a question is selected, include it's correct/incorrect weighting in the selection process so the UI can display it. Update the CLI to display the correct/incorrect weighting of the selected question.
