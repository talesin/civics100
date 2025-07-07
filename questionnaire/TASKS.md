# Tasks

- [x] Review @../.windsurf/rules/code-style-guide.md for coding style guidelines for the following tasks
- [x] Review @../distractions/src/cli/index.ts for an example of how to use Effect CLI
- [x] Review @../distractions/src/services/DistractorManager.ts for an example of how to use Effect Services
- [x] Review @../distractions/test/services/DistractorManager.test.ts for an example of how to write tests
- [x] @./src/cli/index.ts should contain minimal logic and be focused on the console entry point. Move all logic out into an Effect.Service - @./src/cli/GameService.ts
- [x] Create an Effect.Service class in @./src/QuestionDataService.ts and include all exported functions in the return definition
- [x] Create a TestQuestionDataServiceLayer in @./src/QuestionDataService.ts
- [x] Create an Effect.Service class in @./src/QuestionSelector.ts and include all exported functions in the return definition
- [x] Update the CLI to use the new services
- [x] Test the CLI: npx tsx src/cli/index.ts
- [x] Create a TestQuestionSelectorLayer in @./src/QuestionSelector.ts
- [x] Update the tests to reflect the new changes
- [x] Ensure all tests pass: npm run test
- [x] Add comments to the code to explain the logic
