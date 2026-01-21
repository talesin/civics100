# Website Specification

## Overview

This website is an interactive questionnaire that tests users' knowledge using the US Civics questions and answers. The website is built using Next.js and TypeScript. It will be a static website that can be deployed to GitHub Pages. The rest of the spec will detail the functionality of the website. It will describe functionality using user stories (as a [user], I want [feature] so that [benefit]) and acceptance criteria (given [context], when [event], then [result]).

## Tech Stack

- Effect-TS
- Next.js
- TypeScript
- Tamagui (cross-platform UI framework with theming)
- GitHub Pages

## Implementation Details

- The website will be a static website that can be deployed to GitHub Pages.
- The website will be built using Next.js and TypeScript.
- The website will be deployed to GitHub Pages.
- TypeScript code will use Effect-TS for side effects and follow guidelines in code-style-guide.md.
- The website will use Tamagui for cross-platform styling with built-in light/dark theme support.

## User Experience

- The website should be easy to navigate.
- The website should be responsive.
- The website should have a modern and clean design.
- The website should have a dark mode.
- The website should have a header with a logo and navigation links.
- The website should have a footer with links to social media and other resources.
- The questions should be displayed in a card layout like a deck of cards.

## Game Flow

The US Civics questionnaire follows a configurable session model. Users can choose from three quiz lengths: **20 questions** (Quick), **50 questions** (Standard), or **100 questions** (Full). For the 20-question mode, the session will **automatically end once the user answers 6 questions correctly** (an "early win"), or all 20 questions are answered, whichever comes first.

### Card Game Flow

1. User lands on the homepage and selects "Take the Questionnaire".
2. User is navigated to the game screen.
3. User selects quiz length: 20 (Quick), 50 (Standard), or 100 (Full) questions.
4. A random subset of questions is selected and shuffled.
5. One question is displayed per card with multiple-choice answers.
6. User selects an answer by clicking on one of the options.
7. The card visually confirms whether the selected answer is correct or incorrect.
8. After a short delay (or user action), the next card is shown.
9. For 20-question mode: if the user answers **6 questions correctly**, the game ends early with an "early win".
10. Otherwise, the game ends after all selected questions are answered.
11. The user is shown a results page with performance stats.

## Game UX Details

- Each question is presented on a "card" in a card deck.
- Answer selection highlights the choice and disables others.
- Cards automatically slide to the next question after a short delay or after clicking a "Next" button.
- Progress indicator shows current question number and total (e.g. "Card 3 of 20").
- At the end of the deck (or on early completion), a results summary appears showing:
  - Total correct answers
  - Percentage score
  - Message if quiz ended early due to reaching 6 correct (20-question mode only)
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

### As a user, I want to choose quiz length so that I can customize my study session.

- Given I start a new quiz, when the session begins, then I should be able to choose from 20 (Quick), 50 (Standard), or 100 (Full) questions.

### As a user, I want to the US state to default to my location so that I can take the quiz with the relevant questions.

- Given I am on the questionnaire page, when I load the page, then the US state should default to my location.

### As a user, I want to be able to select a US state so that I can take the quiz with the relevant questions.

- Given I am on the questionnaire page, when I select a US state, then the US state should be set to the selected state.

### As a user, I want the randomness of the questions to change based on my answers so that I can learn from my mistakes.

- Given I am on the questionnaire page, when I answer a question, then the randomness of the questions should change based on my answers.
- Given a particular question, when I answer incorrectly, then this question should be more likely to appear again in the next test.
- Given a particular question, when I answer correctly, then this question should be less likely to appear again in the next test.

### As a user, I want each test to hold a unique set of questions so that I can learn from my mistakes.

- Given I am on the questionnaire page, when I complete a test, then the questions should be shuffled and the randomness of the questions should change based on my answers.

### As a user, I want to see the percentage of all questions available I have answered correctly so that I can track my progress.

- Given I am on the questionnaire page, when I answer a question, then the percentage of all questions available I have answered correctly should be updated.

### As a user, I want to see a list of all question I have answered with my track record so that I can review my performance.

- Given I am on the results page, I want a link to a question bank so that I can review my performance.
- Given I am on the question bank, I want to see a list of all questions I have answered with my track record so that I can review my performance.

## Test Scenarios (Acceptance Criteria)

| Scenario          | Given                  | When                                  | Then                                                      |
| ----------------- | ---------------------- | ------------------------------------- | --------------------------------------------------------- |
| Quiz Length       | Homepage               | User starts quiz                      | User can select 20, 50, or 100 question quiz              |
| Early Win         | 20-question quiz       | User reaches 6 correct answers        | Show results screen, mark quiz as completed early         |
| Full Attempt      | Quiz starts            | User answers all selected questions   | Show results screen                                       |
| Progress Tracking | Quiz in progress       | User answers each question            | Show current card (e.g. "Card 4 of 20")                   |
| Retake            | Quiz ends              | User clicks "Retake Quiz"             | Restart quiz with new shuffled question subset            |
