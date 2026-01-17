# Distractions Package

A TypeScript-based distractor generation engine for civics questions, built with Effect-TS functional programming patterns. Creates comprehensive pools of plausible but incorrect answer choices for US Citizenship Test questions.

## Overview

The distractions package generates high-quality "distractor" answers (incorrect but plausible choices) for civics questions, enhancing the difficulty and educational value of practice tests. Rather than using random incorrect answers, it provides contextually relevant alternatives that effectively test knowledge.

### Core Concepts

- **Distractors** - Plausible but incorrect answer choices that challenge understanding
- **Static Pools** - Curated collections of related incorrect answers (e.g., non-federal holidays, incorrect historical figures)
- **Question Classification** - Automatic categorization of questions for appropriate distractor selection
- **Quality Assessment** - Validation of distractor relevance and educational value

## Features

### Distractor Generation Strategies

#### Static Pool Generation

For questions where distractors can be drawn from well-defined categories:

- **Branches of Government** - Legislative, Executive, Judicial mix-ups
- **Geography** - US states, territories, capitals, rivers, oceans
- **Government Positions** - Cabinet roles, constitutional offices
- **Historical Elements** - Presidents, Vice Presidents, wars, documents
- **Political Representatives** - Senators, Representatives from other states
- **Rights & Freedoms** - Bill of Rights and constitutional principles
- **State Information** - Capitals, governors from other states

#### Curated Distractor Database

Carefully selected incorrect answers that are:

- **Contextually Relevant** - Related to the correct answer domain
- **Educationally Valuable** - Test genuine understanding vs. memorization
- **Appropriately Challenging** - Neither too obvious nor impossibly obscure

### Technical Features

- **Effect-TS Architecture** - Functional programming with composable services
- **CLI Interface** - Simple command for generating distractor pools
- **Quality Metrics** - Assessment of distractor effectiveness
- **Similarity Analysis** - Prevent distractors that are too similar to correct answers
- **Integration Ready** - Designed for use by downstream quiz applications

## Prerequisites

- Node.js 20+
- npm 8+
- TypeScript 5+
- Access to civics2json question data

## Installation

The package is part of the civics100 monorepo workspace:

```bash
# From the monorepo root
npm install

# Or install workspace dependencies
npm install --workspace=distractions
```

## Usage

### CLI Generation

Generate distractors for all civics questions:

```bash
# Generate question-distractor pairs
npx tsx src/cli/index.ts

# This will create data/questions-with-distractors.json
```

The CLI will:

1. Load questions from the `civics2json` package
2. Classify each question by type and content
3. Generate appropriate distractors using static pools
4. Assess distractor quality and relevance
5. Output enhanced questions with distractor pools

### Programmatic API

Use the distractor services in other applications:

```typescript
import { Effect } from 'effect'
import { 
  DistractorManager, 
  CuratedDistractorService, 
  StaticGenerator 
} from 'distractions'

const program = Effect.gen(function* () {
  const manager = yield* DistractorManager
  const curatedService = yield* CuratedDistractorService
  
  // Generate distractors for all questions
  yield* manager.generateAndWrite()
  
  // Or generate for specific question types
  const historyDistractors = yield* curatedService.generateDistractors(
    'history', 
    3  // number of distractors
  )
  
  return historyDistractors
})

// Run with service dependencies
await Effect.runPromise(
  Effect.provide(program, [
    DistractorManager.Default,
    CuratedDistractorService.Default,
    StaticGenerator.Default
  ])
)
```

## Architecture

### Service Architecture

The package follows Effect-TS service patterns with dependency injection:

#### DistractorManager

Main orchestration service:

- `generateAndWrite()` - Complete distractor generation pipeline
- Coordinates between question loading and distractor generation
- Handles file I/O and output formatting

#### CuratedDistractorService  

Core distractor generation logic:

- `generateDistractors(category, count)` - Generate distractors by category
- `assessDistractorQuality()` - Evaluate distractor effectiveness
- `classifyQuestion()` - Determine appropriate distractor strategies

#### StaticGenerator

Static pool-based distractor creation:

- `generate()` - Process all questions with static distractors
- Integration with curated distractor pools
- Question classification and pool selection

#### Supporting Services

- **QuestionClassifierService** - Categorize questions by content type
- **PoolMappingService** - Map question types to distractor pools  
- **DistractorQualityService** - Assess distractor appropriateness
- **SimilarityService** - Prevent overly similar distractors

### Data Flow

```
civics2json → DistractorManager → StaticGenerator → Output
     ↓              ↓                    ↓
Static Pools → CuratedService → Quality Assessment
```

1. **Question Loading** - Import questions from `civics2json`
2. **Classification** - Categorize questions by type and content
3. **Pool Selection** - Choose appropriate static distractor pools
4. **Generation** - Create contextually relevant distractors
5. **Quality Assessment** - Validate distractor effectiveness
6. **Output** - Export questions with distractor pools

## Development

### Setup

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Generate distractors
npm run package
```

### Available Scripts

```bash
npm run clean         # Clean build artifacts and dependencies
npm run lint          # Run ESLint
npm run lint:fix      # Fix ESLint issues
npm run build         # Build TypeScript to dist/
npm run package       # Generate distractors, lint, test, and build
npm test              # Run Jest tests
npm run list-todos    # Find TODO comments
```

### Testing

The package includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Test specific services
npm test -- DistractorManager.test.ts
npm test -- CuratedDistractorService.test.ts
```

#### Test Architecture

- **Effect Test Layers** - Mock services for isolated testing
- **Service Testing** - Individual distractor generation logic
- **Quality Testing** - Distractor appropriateness validation
- **Integration Tests** - Complete generation pipeline

Example test with Effect layers:

```typescript
it('should generate appropriate distractors', async () => {
  const testLayer = TestCuratedDistractorServiceLayer({
    generateDistractors: (category) =>
      Effect.succeed(['distractor1', 'distractor2', 'distractor3'])
  })

  await Effect.gen(function* () {
    const service = yield* CuratedDistractorService
    const distractors = yield* service.generateDistractors('geography', 3)
    
    expect(distractors).toHaveLength(3)
    expect(distractors).not.toContain('') // No empty distractors
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
│   └── index.ts           # CLI entry point
├── services/              # Effect-TS services
│   ├── DistractorManager.ts        # Main orchestration
│   ├── CuratedDistractorService.ts # Core generation logic
│   ├── DistractorQualityService.ts # Quality assessment
│   ├── PoolMappingService.ts       # Pool selection
│   ├── QuestionClassifierService.ts # Question categorization
│   └── SimilarityService.ts        # Similarity analysis
├── generators/            # Distractor generators
│   └── StaticGenerator.ts # Static pool-based generation
├── data/                  # Data services and pools
│   ├── QuestionsDataService.ts     # Question data loading
│   └── pools/             # Static distractor pools
│       ├── branches-of-government.ts
│       ├── geography.ts
│       ├── government.ts
│       ├── history.ts
│       ├── representatives.ts
│       ├── rights-freedoms.ts
│       ├── senators.ts
│       └── state-capitals.ts
├── types.ts              # TypeScript type definitions
└── index.ts              # Main package exports

test/                     # Test suites
└── services/
    ├── DistractorManager.test.ts
    ├── CuratedDistractorService.test.ts
    ├── DistractorQualityService.test.ts
    ├── PoolMappingService.test.ts
    ├── QuestionClassifierService.test.ts
    └── SimilarityService.test.ts
```

## Distractor Strategies

### Static Pool Categories

#### Geography Distractors

For questions about US geography:

- **States**: Other US states for state-specific questions
- **Capitals**: State capitals from other states  
- **Rivers**: Major US rivers (Mississippi, Colorado, etc.)
- **Oceans**: Bodies of water bordering the US

#### Government Distractors

For questions about government structure:

- **Cabinet Positions**: Secretary roles and departments
- **Constitutional Offices**: President, Vice President, Speaker, etc.
- **Branches**: Legislative, Executive, Judicial concepts

#### Historical Distractors

For questions about US history:

- **Presidents**: Historical presidents for presidential questions
- **Vice Presidents**: Historical VPs for VP questions
- **Wars**: Major US conflicts and military actions
- **Documents**: Important historical documents

### Quality Metrics

Distractors are evaluated on:

- **Relevance** - Contextually related to the correct answer
- **Plausibility** - Believable for someone with partial knowledge
- **Educational Value** - Tests genuine understanding vs. guessing
- **Difficulty Balance** - Neither too obvious nor impossibly hard

### Example Output

```json
{
  "question": "What is the supreme law of the land?",
  "correctAnswer": "the Constitution",
  "distractors": [
    "the Declaration of Independence",
    "the Bill of Rights", 
    "the Articles of Confederation"
  ]
}
```

## Integration

### With civics2json

- Imports base question data and schemas
- Uses question classification for distractor selection
- Maintains question metadata and structure

### With questionnaire

- Provides questions-with-distractors for game sessions
- Enables multiple-choice question generation
- Supports adaptive learning with quality distractors

### With website

- Supplies distractor pools for web-based quizzes
- Ensures consistent question difficulty across platforms
- Enables real-time distractor selection

## API Reference

### Core Types

```typescript
// Enhanced question with distractors
interface QuestionWithDistractors {
  question: string
  correctAnswer: string | string[]
  distractors: string[]
  category: QuestionCategory
  difficulty: DistractorDifficulty
}

// Distractor generation options
interface DistractorOptions {
  count: number
  category?: QuestionCategory
  excludeSimilar?: boolean
  qualityThreshold?: number
}

// Quality assessment
interface DistractorQuality {
  relevance: number      // 0-1 score
  plausibility: number   // 0-1 score
  educational: number    // 0-1 score
  overall: number        // Composite score
}
```

### Service Methods

#### DistractorManager

- `generateAndWrite()` - Complete distractor generation pipeline

#### CuratedDistractorService

- `generateDistractors(category, count)` - Generate by category
- `assessDistractorQuality(distractor, correct)` - Quality evaluation
- `classifyQuestion(question)` - Determine question category

#### StaticGenerator  

- `generate()` - Process all questions with static pools
- Integration with static distractor pools

## Configuration

### Distractor Pool Configuration

Customize static pools by editing files in `src/data/pools/`:

```typescript
// src/data/pools/geography.ts
export const GEOGRAPHY_DISTRACTORS = {
  states: ['California', 'Texas', 'Florida', /* ... */],
  capitals: ['Sacramento', 'Austin', 'Tallahassee', /* ... */],
  rivers: ['Mississippi River', 'Colorado River', /* ... */]
}
```

### Quality Thresholds

Adjust distractor quality requirements:

```typescript
// Quality thresholds for distractor acceptance
const QUALITY_THRESHOLDS = {
  relevance: 0.7,      // Minimum contextual relevance
  plausibility: 0.6,   // Minimum believability
  educational: 0.8,    // Minimum educational value
  overall: 0.7         // Minimum composite score
}
```

## Troubleshooting

### Common Issues

**Missing Question Data**:

```bash
# Ensure civics2json data is available
cd ../civics2json
npx tsx src/index.ts questions construct

# Return to distractions
cd ../distractions
npx tsx src/cli/index.ts
```

**Empty Distractor Pools**:

- Check static pool files in `src/data/pools/`
- Verify question classification logic
- Review quality threshold settings

**Build Errors**:

```bash
# Clean and reinstall
npm run clean
npm install
npm run build
```

### Output Validation

Verify generated distractors:

```bash
# Check output file
cat data/questions-with-distractors.json | jq '.[] | select(.distractors | length < 3)'

# Validate distractor quality
npm test -- DistractorQualityService.test.ts
```

## Contributing

### Adding New Distractor Pools

1. Create new pool file in `src/data/pools/`
2. Define distractor arrays by category
3. Update `PoolMappingService` to use new pools
4. Add tests for new distractor categories

### Improving Quality Assessment

1. Enhance similarity detection algorithms
2. Add new quality metrics and thresholds
3. Implement machine learning for quality prediction
4. Test with real user data for validation

### Code Style

- Follow Effect-TS patterns for service architecture
- Use dependency injection for all external dependencies
- Write comprehensive tests for distractor quality
- Document distractor selection rationale

## Educational Philosophy

The distractor generation follows educational best practices:

- **Conceptual Testing** - Focus on understanding vs. memorization
- **Common Misconceptions** - Include distractors based on typical errors  
- **Progressive Difficulty** - Adjust challenge level appropriately
- **Authentic Assessment** - Use realistic incorrect alternatives

This approach ensures practice tests effectively prepare users for the actual citizenship test while building genuine civic knowledge.

## License

Part of the civics100 monorepo. See root LICENSE for details.

---

See `PLAN.md` for detailed implementation roadmap and development phases.
