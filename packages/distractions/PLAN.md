# Distractions Project: High-Level Plan

## 1. Project Purpose

The primary goal of this project is to enhance the civics questions dataset by programmatically generating and adding a pool of plausible but incorrect answers (distractors) to each question. Rather than randomizing distractors at generation time, we aim to create a comprehensive set of distractors for each question that can be stored alongside the questions. This will allow downstream applications to randomly select from this pool as needed when creating practice tests, quizzes, and other learning materials. The distractors will be tailored to each question, ensuring they are relevant and effectively "distract" from the correct answer.

## 2. Core Components

### A. Distractor Generation Engine

This is the heart of the project, responsible for creating distractors. It will use a hybrid approach, combining static data pools with AI-powered generation.

#### i. Static Distractor Pools

For questions where distractors can be drawn from a known, finite set of data. These pools will be stored as simple data structures (e.g., arrays or JSON files).

- **Static Pools Created:**
  - `branches-of-government.ts`: Legislative, Executive, Judicial branches, etc.
  - `geography.ts`: U.S. states, territories, major rivers, and bordering oceans.
  - `government.ts`: Cabinet-level positions.
  - `history.ts`: U.S. Presidents, Vice Presidents, and major wars.
  - `representatives.ts`: U.S. Representatives.
  - `rights-freedoms.ts`: Key rights from the Bill of Rights.
  - `senators.ts`: U.S. Senators.
  - `state-capitals.ts`: U.S. state capitals.

#### ii. AI-Powered Distractor Generation

For questions requiring more nuanced or creative distractors that cannot be sourced from static lists. This will involve using a Large Language Model (LLM) to generate contextually relevant incorrect answers.

- **AI Generation Categories:**
  - **Famous People:** Well-known politicians, historical figures, or other public figures.
  - **Important Documents:** Plausible-sounding but incorrect documents (e.g., Magna Carta, Treaty of Versailles).
  - **Key Dates & Numbers:** Incorrect but plausible dates or numerical answers.
  - **Conceptual Distractors:** Abstract but related concepts (e.g., for "What is the rule of law?", a distractor could be "The majority always rules").
  - **Non-national Holidays:** Holidays that are not federal US holidays.

### B. Command-Line Application (CLI)

A CLI built with `@effect/cli` will serve as the entry point for running the distractor generation process. It will handle file I/O and configuration.

When can run it locally by: `npx tsx src/cli/index.ts`

### C. Data Processing Pipeline

1. **Input**: Read the `civics-questions.json` file from the `civics2json` package.
2. **Processing**: For each question, determine the appropriate distractor strategy (static, AI, or both).
3. **Generation**: Generate a comprehensive pool of distractors for each question, ensuring they do not overlap with the correct answer(s). The goal is to provide enough plausible distractors that downstream applications can randomly select from this pool.
4. **Output**: Write the enhanced question data (including the distractor pools) to a new JSON file.

## 3. Proposed File Hierarchy

```
distractions/
├── src/
│   ├── cli/
│   │   └── index.ts            # CLI entry point and command definitions
│   ├── data/
│   │   └── pools/
│   │       ├── branches-of-government.ts
│   │       ├── geography.ts
│   │       ├── government.ts
│   │       ├── history.ts
│   │       ├── representatives.ts
│   │       ├── rights-freedoms.ts
│   │       ├── senators.ts
│   │       └── state-capitals.ts
│   ├── generators/
│   │   ├── index.ts            # Main generator, routes by question type
│   │   ├── static-generator.ts # Logic for generating from static pools
│   │   └── ai-generator.ts     # Logic for generating using an LLM
│   ├── services/
│   │   └── ai.ts               # Wrapper for the AI/LLM service client
│   ├── types/
│   │   └── index.ts            # TypeScript types for questions & distractors
│   └── main.ts                 # Main pipeline orchestrator
├── test/
│   ├── generators/
│   │   └── static-generator.test.ts
│   └── main.test.ts
├── package.json
├── tsconfig.json
└── PLAN.md
```

## 4. Task List & Implementation Phases

### Phase 1: Setup and Static Distractors

- [x] Set up TypeScript project structure and configuration.
- [x] Add `civics2json` as a local dependency.
- [x] Implement the CLI entry point using Effect.
- [x] Define data types/schemas for questions and distractors in `src/types/index.ts`.
- [x] Populate static distractor pools in `src/data/pools/`.
- [x] Create the initial `static-generator.ts` file.
- [ ] Implement the `static-generator.ts` logic to create distractors from the pools based on question type.
- [ ] Implement the main processing pipeline in `main.ts` to read, process (with static generator), and write files.
- [ ] Add unit tests for the static generator.

### Phase 2: AI-Powered Distractor Generation

- [ ] Set up a service wrapper for the AI/LLM API in `src/services/ai.ts`.
- [ ] Implement `ai-generator.ts` to generate distractors for relevant questions.
- [ ] Integrate the AI generator into the main pipeline in `main.ts`, with logic to decide when to use it.
- [ ] Securely manage API keys (e.g., using environment variables).
- [ ] Add tests for the AI generator (may require mocking the API).

### Phase 3: Refinement and Documentation

- [ ] Refine the logic for selecting the number of distractors.
- [ ] Improve error handling and logging throughout the pipeline.
- [ ] Add comprehensive integration tests.
- [ ] Write `README.md` with clear documentation on how to install, configure, and run the project.

## 5. Types

### Question

The `Question` type will be imported from the `civics2json` package. We will extend it or use a new type for the output.

```typescript
import { Question as BaseQuestion } from 'civics2json/types'

type QuestionWithDistractors = BaseQuestion & {
  distractors: string[]
}
```

Original Question type:

```typescript
type Question = DeepReadonly<{
  theme: string
  section: string
  question: string
  questionNumber: number
  answers:
    | { _type: 'text'; choices: string[] }
    | { _type: 'senator'; choices: { senator: string; state: StateAbbreviation }[] }
    | { _type: 'representative'; choices: { representative: string; state: StateAbbreviation }[] }
    | { _type: 'governor'; choices: { governor: string; state: StateAbbreviation }[] }
    | { _type: 'capital'; choices: { capital: string; state: StateAbbreviation }[] }
}>
```

# Implmentation Style Guidelines

## Effect Services

Entry into the various functions should be via an Effect.Service class. This will allow for dependency injection and testing.

```typescript
export class ExampleService extends Effect.Service<ExampleService>()('ExampleService', {
  effect: Effect.gen(function* () {
    const dependency1 = yield* Dependency1
    const dependency2 = yield* Dependency2
    return {
      executeSomething: executeSomething(dependency1),
      executeAnother: executeAnother(dependency2)
    }
  })
}) {}

export const TestExampleServiceLayer = (fn?: {
  executeSomething?: () => Effect.Effect<string, ExampleError>
  executeAnother?: () => Effect.Effect<readonly Representative[], AnotherError>
}) =>
  Layer.succeed(
    ExampleService,
    ExampleService.of({
      _tag: 'ExampleService',
      executeSomething: fn?.executeSomething ?? (() => Effect.succeed('')),
      executeAnother: fn?.executeAnother ?? (() => Effect.succeed([]))
    })
  )
```

## Effect CLI

The CLI should be built using the `@effect/cli` library. It should be a subcommand of the main CLI application. There should be limited logic in the CLI entry point, and most of the logic should be in the Effect.Service classes.

```typescript
const exampleSubCommand = Command.make(
  'example',
  { option: Options.boolean('option').pipe(Options.withDescription('Option')) },
  ({ option }) => ExampleService.pipe(Effect.flatMap((service) => service.executeSomething(option)))
).pipe(Command.withDescription('Example command'))

const anotherExampleSubCommand = Command.make(
  'another-example',
  { option: Options.boolean('option').pipe(Options.withDescription('Option')) },
  ({ option }) => ExampleService.pipe(Effect.flatMap((service) => service.executeAnother(option)))
).pipe(Command.withDescription('Another example command'))

const exampleCommand = Command.make('example').pipe(
  Command.withSubcommands([exampleSubCommand, anotherExampleSubCommand])
)

const command = Command.make('example-cli').pipe(Command.withSubcommands([exampleCommand]))

export const cli = Command.run(command, {
  name: 'Example CLI',
  version: '0.1.0'
})

// Run the CLI
Effect.runPromise(Effect.provide(cli(process.argv), NodeContext.layer))
```

## Dependency Injection

The dependency injection pattern is used to provide dependencies to services. This allows for testing and dependency injection. This is using a currying pattern to provide the dependencies to the service. The first function should contain the dependencies arguments and return an Effect.fn that contains the arguments for the actual function.

```typescript
export const executeSomething = (dependency1: Dependency1) =>
  Effect.fn(function* (arg1: string) {
    const dependency2 = yield* Dependency2
    const result = yield* dependency1.executeSomething(arg1)
    return result
  })

export class ExampleService extends Effect.Service<ExampleService>()('ExampleService', {
  effect: Effect.gen(function* () {
    const dependency1 = yield* Dependency1
    const dependency2 = yield* Dependency2
    return {
      executeSomething: executeSomething(dependency1),
      executeAnother: executeAnother(dependency2)
    }
  })
}) {}
```
