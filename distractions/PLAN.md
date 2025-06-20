# Distractions Project: High-Level Plan

## Task List

- [ ] Set up TypeScript project structure and configuration
- [ ] Implement CLI entry point using Effect
- [ ] Create data models/types for civics questions and distractors
- [ ] Implement file I/O utilities (read/write JSON)
- [ ] Populate static distractor pools
  - [ ] U.S. States
  - [ ] U.S. Territories
  - [ ] U.S. Presidents
  - [ ] U.S. Vice Presidents
  - [ ] Cabinet-level Positions
  - [ ] Constitutional Amendments
  - [ ] Rights and Freedoms
  - [ ] American Indian Tribes
  - [ ] Major U.S. Wars (by century)
  - [ ] National Holidays
  - [ ] U.S. Rivers
  - [ ] U.S. Oceans
  - [ ] U.S. Capitals (state and national)
  - [ ] U.S. Political Parties
- [ ] Implement basic distractor generation logic for each question type
- [ ] Integrate main pipeline to process input and output files
- [ ] Add unit and integration tests
- [ ] Write documentation and usage instructions

## 1. Project Purpose
Enhance the civics questions dataset by adding plausible but incorrect answers (distractors) to each question, making it more useful for creating practice tests and quizzes.

## 2. Core Components

### A. Command Line Application
- The project will be a command line app, implemented in TypeScript using the Effect library, following a similar architecture and approach as `civics2json`.
- The CLI will support commands to process the civics questions data and output a new file with generated distractors.

### B. Data Processing Pipeline
1. **Input**: Read `civics-questions.json`
2. **Processing**: For each question, generate a set of plausible but incorrect answers (**possible distractors**)
   - The output for each question will include a pool of possible distractors. These are not the final quiz options, but rather a set from which another application can randomly select distractors to combine with correct answers (up to five total, for example).
   - The number of possible distractors per question will vary depending on the nature of the question and answer:
     - Some questions may have only a few plausible distractors (e.g., open-ended or personal questions).
     - Others, such as those about U.S. states, presidents, or original colonies, may have a much larger pool (e.g., 50 states, but only 13 original colonies).
   - Distractor quality will be based on:
     - **Semantic Similarity**: Related but incorrect answers
     - **Common Misconceptions**: Frequently mistaken answers
     - **Plausible Variations**: Slightly modified versions of correct answers
     - **Thematic Distractors**: Answers that fit the theme but are factually wrong
3. **Output**: Save to a new file (e.g., `civics-questions-with-distractors.json`)

## 3. Technical Approach

### A. Project Setup
- Create new `distractions` directory in the project
- Set up TypeScript with similar config to main project
- Use the Effect library for functional programming, error handling, and CLI structure
- Reuse existing dependencies where possible

### B. Implementation Phases
1. **Phase 1: Basic Structure**
   - Create the file and directory structure as outlined below to support modular distractor generation and CLI usage.
   - Create data models for questions with distractors
   - Implement basic file I/O
   - Add simple hardcoded distractors for testing
   - Set up CLI command structure with Effect

2. **Phase 2: Smart Generation**
   - Implement distractor generation strategies tailored to question types
   - Add validation to ensure distractors don't match correct answers
   - Add tests for distractor quality

3. **Phase 3: Enhancement**
   - Add configuration options
   - Include validation and error handling
   - Document the API and CLI usage

---

## 4. Proposed File Hierarchy

```
distractions/
├── src/
│   ├── cli/
│   │   └── index.ts            # CLI entry point: parses args, runs commands
│   ├── data/
│   │   └── pools/
│   │       ├── states.ts       # List of all U.S. states
│   │       ├── presidents.ts   # List of all presidents
│   │       ├── amendments.ts   # List of all amendments
│   │       └── ...             # Other static distractor pools
│   ├── generators/
│   │   ├── index.ts            # Main generator interface, routes by question type
│   │   ├── government.ts       # Logic for government-related distractors
│   │   ├── history.ts          # Logic for history-related distractors
│   │   ├── people.ts           # Logic for people/roles distractors
│   │   └── general.ts          # General-purpose distractor logic
│   ├── types/
│   │   └── index.ts            # TypeScript types/interfaces for questions & distractors
│   ├── utils/
│   │   ├── file.ts             # File I/O utilities (read/write JSON, etc.)
│   │   ├── random.ts           # Random selection helpers
│   │   └── string.ts           # String helpers (normalization, comparison)
│   └── main.ts                 # Main pipeline: loads data, generates distractors, writes output
├── test/
│   ├── generators/
│   │   └── government.test.ts  # Unit tests for government distractors
│   ├── integration/
│   │   └── pipeline.test.ts    # End-to-end tests for the full pipeline
│   └── ...                     # Other test files
├── package.json
├── tsconfig.json
└── README.md
```

### File/Folder Descriptions

- **src/cli/index.ts**: CLI entry point. Handles argument parsing, help output, and dispatches to main logic.
- **src/data/pools/**: Static lists of possible distractors for various question types (e.g., all states, presidents, amendments). Imported by generators as needed.
- **src/generators/**: Contains logic for generating distractors for each type of question (government, history, people, etc.).
  - `index.ts`: Central export and routing by question type.
  - Specialized files (e.g., `government.ts`) encapsulate logic for specific question domains.
- **src/types/index.ts**: TypeScript types/interfaces for questions, answers, and distractors.
- **src/utils/**: Utility modules for file operations, randomization, and string handling.
- **src/main.ts**: Main pipeline. Reads input JSON, generates distractors, and writes output file.
- **test/**: Unit and integration tests for each generator and the overall pipeline.

## 4. Example Transformation

**Input:**
```json
{
  "question": "What is the supreme law of the land?",
  "answers": ["the Constitution"]
}
```

**Output:**
```json
{
  "question": "What is the supreme law of the land?",
  "answers": ["the Constitution"],
  "distractors": [
    "the Declaration of Independence",
    "the Bill of Rights",
    "federal law"
  ]
}
```

## 5. Next Steps
1. Review this high-level plan
2. Identify any missing components or concerns
3. Decide on implementation priorities
4. Begin with Phase 1 implementation
