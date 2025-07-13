# Website Specification

## Overview

This website is an interactive questionnaire that tests users' knowledge using the US Civics questions and answers. The website is built using Next.js and TypeScript. It will be a static website that can be deployed to GitHub Pages. The rest of the spec will detail the functionality of the website. It will describe functionality using user stories (as a [user], I want [feature] so that [benefit]) and acceptance criteria (given [context], when [event], then [result]).

## Tech Stack

- Effect-TS
- Next.js
- TypeScript
- Tailwind CSS
- GitHub Pages

## Implementation Details

- The website will be a static website that can be deployed to GitHub Pages.
- The website will be built using Next.js and TypeScript.
- The website will be deployed to GitHub Pages.
- TypeScript code will use Effect-TS for side effects and follow guidelines in code-style-guide.md.
- The website will use Tailwind CSS for styling.

## User Experience

- The website should be easy to navigate.
- The website should be responsive.
- The website should have a modern and clean design.
- The website should have a dark mode.
- The website should have a header with a logo and navigation links.
- The website should have a footer with links to social media and other resources.
- The questions should be displayed in a card layout like a deck of cards.

## Game Flow

The US Civics questionnaire will now follow a constrained session model. Each session presents **10 randomly selected questions** from the question bank. The session will **automatically end once the user answers 6 questions correctly** or all 10 are answered, whichever comes first.

### Card Game Flow

1. User lands on the homepage and selects "Take the Questionnaire".
2. User is navigated to the game screen.
3. A random subset of **10 questions** is selected and shuffled.
4. One question is displayed per card.
5. User selects an answer by clicking on one of the options.
6. The card visually confirms whether the selected answer is correct or incorrect.
7. After a short delay (or user action), the next card is shown.
8. If the user answers **6 questions correctly**, the game ends early.
9. Otherwise, the game ends after all 10 questions are answered.
10. The user is shown a results page with performance stats.

## Game UX Details

- Each question is presented on a "card" in a card deck.
- Answer selection highlights the choice and disables others.
- Cards automatically slide to the next question after a short delay or after clicking a "Next" button.
- Progress indicator shows current question number and total (e.g. "Card 3 of 10").
- At the end of the deck (or on early completion), a results summary appears showing:
  - Total correct answers
  - Percentage score
  - Message if quiz ended early due to reaching 6 correct
  - Option to retake the quiz
  - Option to return to homepage

## User Stories

### As a user, I want to see the home page with my previous results so that I can see how I did.
- Given I am on the home page, when I load the page, then I see my previous results.

### As a user, I want to see the home page with information about the US Civics questions and answers so that I can learn about the questions and answers.
- Given I am on the home page, when I load the page, then I see information and links about the US Civics questions and answers.

### As a user, I want to take the questionnaire so that I can test my knowledge of the US Civics questions and answers.
- Given I am on the home page, when I click the "Take the Questionnaire" button, then I am taken to the questionnaire page.

### As a user, I want the questions to be shuffled so that I can test my knowledge of the US Civics questions and answers.
- Given I am on the questionnaire page, when I load the page, then the questions are shuffled.

### As a user, I want to be able to select answers on the displayed card so that I can answer the question.
- Given I am on the questionnaire page, when I click an answer, then the answer is selected.
- Given I am on the questionnaire page, when I click an answer, then the answer is highlighted.

### As a user, I want to receive immediate feedback after each answer so that I can learn as I go.
- Given I answer a question, when I select an option, then I see whether the answer is correct.

### As a user, I want to see my progress through the deck so that I know how far I've gone.
- Given I am on the questionnaire page, when I view the current card, then I see the question number and total.

### As a user, I want to see a summary of my results after completing the quiz so that I can track my performance.
- Given I complete the last question or reach 6 correct answers, when the quiz ends, then I see a results screen.

### As a user, I want to retake the questionnaire so that I can improve my score.
- Given I see my results, when I click "Retake Quiz", then a new shuffled game begins.

### As a user, I want the quiz to end after 6 correct answers so that I can measure quick success.
- Given I am taking the questionnaire, when I reach 6 correct answers, then the game should end and take me to the results screen.

### As a user, I want to be limited to 10 questions per quiz so that sessions are focused and short.
- Given I start a new quiz, when the session begins, then I should only be asked up to 10 questions total.

## Test Scenarios (Acceptance Criteria)

| Scenario         | Given                 | When                               | Then                                   |
|------------------|------------------------|-------------------------------------|----------------------------------------|
| Early Win        | Quiz starts            | User reaches 6 correct answers      | Show results screen, mark quiz as completed early |
| Full Attempt     | Quiz starts            | User answers all 10 questions       | Show results screen                    |
| Progress Tracking| Quiz in progress       | User answers each question          | Show current card (e.g. "Card 4 of 10")|
| Retake           | Quiz ends              | User clicks "Retake Quiz"           | Restart quiz with new shuffled 10-question subset |