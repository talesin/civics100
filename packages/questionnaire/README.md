# Questionnaire Package

A TypeScript-based interactive civics question engine built with Effect-TS, providing both CLI and programmatic interfaces for conducting US Citizenship Test practice sessions with adaptive learning capabilities.

## Overview

The questionnaire package serves as the core game engine for civics test practice sessions. It integrates with the `civics2json` package for question data and the `distractions` package for answer choices, providing:

- **Interactive CLI Game** - Command-line interface for practice sessions
- **Adaptive Learning** - Questions adapt based on user performance history
- **Game Session Management** - Comprehensive session state tracking
- **Effect-TS Services** - Functional programming patterns with dependency injection
- **Type-Safe API** - Full TypeScript support with schema validation

## Features

### Core Functionality

- **Adaptive Question Selection** - Prioritizes unanswered and incorrectly answered questions
- **Game Session Tracking** - Complete session state management with statistics
- **Multiple Answer Types** - Support for single and multiple-choice questions
- **Early Win Detection** - Sessions end when user achieves passing score (6+ correct)
- **State-Specific Questions** - Dynamic questions for senators, representatives, and governors

### Technical Features

- **Effect-TS Architecture** - Functional programming with composable services
- **CLI Interface** - Interactive command-line game with real-time feedback
- **Programmatic API** - Import and use services in other applications
- **Comprehensive Testing** - Full test coverage with Effect test layers
- **Type Safety** - Strict TypeScript with schema validation

## Prerequisites

- Node.js 20+
- npm 8+
- TypeScript 5+

## Installation

The package is part of the civics100 monorepo workspace:

```bash
# From the monorepo root
npm install

# Or install workspace dependencies
npm install --workspace=questionnaire
```

## Usage

### CLI Game Interface

Start an interactive civics practice session:

```bash
# Basic usage with state selection
npx tsx src/cli/index.ts --state CA

# Test specific questions (for development)
npx tsx src/cli/index.ts --state NY --questions "1,20,43,100"

# Short form aliases
npx tsx src/cli/index.ts -s TX -q "28,29,46,47"
```

#### CLI Commands and Options

- `--state, -s` - Required: Your state abbreviation (e.g., CA, NY, TX)
- `--questions, -q` - Optional: Comma-separated question numbers for testing

#### Interactive Commands

During gameplay:

- **A, B, C, D** - Select answer choice
- **stats** - Display current session statistics
- **quit** - Exit the game

### Programmatic API

Use the questionnaire services in other applications:

```typescript
import { Effect } from 'effect'
import { GameService, QuestionDataService, QuestionSelector } from 'questionnaire'
import type { GameSettings } from 'questionnaire'

const program = Effect.gen(function* () {
  const gameService = yield* GameService
  const questionDataService = yield* QuestionDataService
  
  // Create a new game session
  const settings: GameSettings = {
    maxQuestions: 10,
    winThreshold: 6,
    userState: 'CA'
  }
  
  const { session, questions } = yield* gameService.createGameSession(settings)
  
  // Transform questions for UI display
  const questionDisplays = questions.map((q, index) =>
    gameService.transformQuestionToDisplay(q, index + 1, questions.length)
  )
  
  return { session, questions: questionDisplays }
})

// Run with service dependencies
await Effect.runPromise(
  Effect.provide(program, [
    GameService.Default,
    QuestionDataService.Default,
    QuestionSelector.Default
  ])
)
```

## Architecture

### Service Architecture

The package follows Effect-TS service patterns with dependency injection:

#### GameService

Core game logic and session management:

- `createGameSession()` - Initialize new practice sessions
- `processGameAnswer()` - Handle user answers and update state
- `calculateGameResult()` - Generate final statistics
- `transformQuestionToDisplay()` - Convert questions for UI consumption

#### QuestionDataService  

Question data loading and filtering:

- `loadQuestions()` - Load and filter questions by state and criteria
- Integration with `civics2json` for base questions
- Integration with `distractions` for answer choices

#### QuestionSelector

Adaptive learning and question selection:

- `selectPairedQuestion()` - Choose next question using adaptive algorithm
- `recordPairedAnswer()` - Track user performance for learning
- Prioritizes unanswered and incorrectly answered questions

#### CLIGameService

CLI-specific game interface and interaction:

- `initializeGame()` - Set up CLI game session
- `displayQuestion()` - Format questions for terminal display
- `processAnswer()` - Handle CLI user input
- `displayStats()` - Show session statistics

### Data Flow

```
civics2json → QuestionDataService → GameService → CLI/API
     ↓              ↓                    ↓
distractions → QuestionSelector → Session Management
```

1. **Data Sources**: Questions from `civics2json`, distractors from `distractions`
2. **Question Selection**: `QuestionSelector` uses adaptive algorithms
3. **Session Management**: `GameService` tracks game state
4. **Interface Layer**: CLI or programmatic API consumption

## Development

### Setup

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test

# Start CLI development
npm start -- --state CA
```

### Available Scripts

```bash
npm run clean         # Clean build artifacts and dependencies
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run build         # Build TypeScript to dist/
npm run test          # Run Jest tests
npm start             # Start CLI game
npm run list-todos    # Find TODO comments
```

### Testing

The package includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Test specific services
npm test -- GameService.test.ts
npm test -- QuestionSelector.test.ts
```

#### Test Architecture

- **Effect Test Layers** - Mock services for isolated testing
- **Service Testing** - Individual service logic validation  
- **Integration Tests** - Complete game session workflows
- **CLI Testing** - Command-line interface functionality

Example test with Effect layers:

```typescript
it('should create game session with correct settings', async () => {
  const testLayer = TestGameServiceLayer({
    createGameSession: (settings) => 
      Effect.succeed({
        session: { /* mock session */ },
        questions: [/* mock questions */]
      })
  })

  await Effect.gen(function* () {
    const gameService = yield* GameService
    const { session } = yield* gameService.createGameSession({
      maxQuestions: 10,
      winThreshold: 6,
      userState: 'CA'
    })
    
    expect(session.settings.maxQuestions).toBe(10)
  }).pipe(
    Effect.provide(testLayer),
    Effect.runPromise
  )
})
```

## Project Structure

```
src/
├── cli/                    # Command-line interface
│   ├── index.ts           # CLI entry point and commands
│   └── CLIGameService.ts  # CLI-specific game logic
├── services/              # Effect-TS services
│   ├── GameService.ts     # Core game session management
│   ├── QuestionDataService.ts  # Question data loading
│   └── QuestionSelector.ts     # Adaptive question selection
├── data/                  # Data utilities and exports
│   └── index.ts          # Re-exports from civics2json
├── types.ts              # TypeScript type definitions
└── index.ts              # Main package exports

test/                     # Test suites
├── GameService.test.ts
├── QuestionDataService.test.ts
├── QuestionSelector.test.ts
├── CLIGameService.test.ts
└── types.test.ts
```

## Game Logic

### Session Flow

1. **Initialization** - Create session with user state and preferences
2. **Question Selection** - Adaptive algorithm chooses next question
3. **Answer Processing** - Validate and record user responses
4. **Progress Tracking** - Update statistics and learning data
5. **Completion** - End session on early win (6+ correct) or max questions

### Adaptive Learning

The question selector implements adaptive learning:

- **New Questions** - Higher weight for unanswered questions
- **Incorrect Answers** - Increased probability for wrong answers
- **Correct Answers** - Lower weight but still included in rotation
- **Performance Tracking** - Session-to-session learning persistence

### Answer Validation

Supports multiple answer formats:

- **Single Choice** - Standard A/B/C/D selection
- **Multiple Choice** - Questions requiring multiple selections
- **Expected Answers** - Flexible validation for variable-length answers

## Integration

### With civics2json

- Imports base question data and types
- Uses `StateAbbreviation` type for state validation
- Leverages question schemas for type safety

### With distractions  

- Imports questions with distractor pools
- Uses generated incorrect answers for multiple choice
- Maintains question-distractor relationships

### With website

- Provides services for web interface
- Supports programmatic session management
- Enables real-time game state updates

## API Reference

### Core Types

```typescript
// Game session configuration
interface GameSettings {
  maxQuestions: number
  winThreshold: number
  userState: StateAbbreviation
  questionNumbers?: readonly number[]
}

// Active game session
interface GameSession {
  id: string
  questions: readonly string[]
  currentQuestionIndex: number
  correctAnswers: number
  totalAnswered: number
  isCompleted: boolean
  isEarlyWin: boolean
  startedAt: Date
  completedAt?: Date
  settings: GameSettings
}

// Final results
interface GameResult {
  sessionId: string
  totalQuestions: number
  correctAnswers: number
  percentage: number
  isEarlyWin: boolean
  completedAt: Date
}
```

### Service Methods

#### GameService

- `createGameSession(settings, pairedAnswers?)` - Create new session
- `processGameAnswer(session, answer)` - Process user answer
- `calculateGameResult(session)` - Generate final statistics
- `validateAnswerSelection(selected, correct, expected?)` - Validate answers

#### QuestionDataService

- `loadQuestions(options)` - Load filtered question set
- Integration with data packages for question loading

#### QuestionSelector  

- `selectPairedQuestion(available, history)` - Adaptive question selection
- `recordPairedAnswer(questionId, correct, history)` - Track performance

## Troubleshooting

### Common Issues

**CLI State Error**:

```bash
# Ensure valid state abbreviation
npx tsx src/cli/index.ts --state INVALID
# Error: Invalid state abbreviation

# Use valid 2-letter code
npx tsx src/cli/index.ts --state CA
```

**Missing Question Data**:

```bash
# Ensure civics2json data is available
cd ../civics2json
npx tsx src/index.ts questions construct

# Return to questionnaire
cd ../questionnaire
npm start -- --state NY
```

**Build Errors**:

```bash
# Clean and reinstall
npm run clean
npm install
npm run build
```

### Dependencies

The package requires data from other workspace packages:

- `civics2json` - Base question data and types  
- `distractions` - Questions with distractor pools

Ensure these packages are built before using questionnaire:

```bash
# From monorepo root
npm run build --workspace=civics2json
npm run build --workspace=distractions
npm run build --workspace=questionnaire
```

## Contributing

### Code Style

- Follow Effect-TS patterns for service architecture
- Use dependency injection for all external dependencies
- Write comprehensive tests for all functionality
- Maintain strict TypeScript configuration

### Service Development

- Keep services pure and composable
- Use Effect.gen for readable async composition
- Provide test layers for all services
- Document service interfaces and dependencies

## License

Part of the civics100 monorepo. See root LICENSE for details.
