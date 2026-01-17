# Civics2JSON Package

A TypeScript-based tool for fetching and parsing USCIS civics questions from the official website into a structured JSON format. Built with Effect-TS functional programming patterns for robust data processing and government source integration.

## Overview

Civics2JSON is a comprehensive data processing pipeline that retrieves official USCIS civics test questions and converts them into structured JSON format. It serves as the foundational data layer for the entire civics100 monorepo ecosystem.

### Key Capabilities

- **Official Data Sources** - Fetches from USCIS, Senate, House, and state government websites
- **Variable Questions** - Dynamically populates state-specific senators, representatives, and governors
- **Schema Validation** - Runtime type checking with Effect schemas
- **Structured Output** - Clean JSON format for downstream consumption
- **Update Tracking** - Monitors USCIS test updates and changes

### Integration

This package provides data for:

- **[questionnaire](../questionnaire)** - Interactive quiz game engine
- **[distractions](../distractions)** - Distractor answer generation
- **[website](../../website)** - Web-based practice interface

## Features

### Data Processing Pipeline

- **Multi-Source Fetching** - USCIS questions, Senate XML, House HTML, state government pages
- **HTML/XML Parsing** - Convert diverse formats into structured data
- **Schema Validation** - Runtime type checking with comprehensive error reporting
- **Dynamic Updates** - Track and integrate USCIS test changes

### Government Data Integration  

- **US Senators** - Real-time data from Senate.gov XML feed
- **US Representatives** - Current representatives by district from House.gov
- **State Governors** - Governor information from state government websites
- **State Capitals** - Complete state and territory capital data
- **Variable Questions** - Dynamic population of state-specific answers

### Technical Features

- **Effect-TS Architecture** - Functional programming with composable effects
- **CLI Interface** - Comprehensive command structure for data operations
- **Caching Strategy** - Local file caching to minimize external requests
- **Force Refresh** - Override caching for fresh data when needed
- **Type Safety** - Strict TypeScript with comprehensive schemas

## Prerequisites

- Node.js (v16 or later)
- npm
- TypeScript (installed as a dev dependency)

## Installation

You can use the tool directly with `npx` without installation:

```bash
npx tsx src/index.ts <command>
```

## Usage

### Complete Pipeline

Generate the full civics questions dataset:

```bash
# Build complete dataset with all variable questions
npx tsx src/index.ts questions construct
```

This runs the complete pipeline:

1. Fetches/parses civics questions
2. Retrieves current senators, representatives, governors
3. Processes USCIS test updates
4. Generates final structured JSON

### Individual Commands

#### Civics Questions

```bash
# Fetch raw HTML from USCIS
npx tsx src/index.ts questions fetch

# Parse HTML into structured data
npx tsx src/index.ts questions parse
```

#### Government Representatives

```bash
# US Senators
npx tsx src/index.ts senators fetch
npx tsx src/index.ts senators parse

# US Representatives  
npx tsx src/index.ts representatives fetch [--force]
npx tsx src/index.ts representatives parse [--force]

# State Governors
npx tsx src/index.ts governors fetch [--force]
```

#### Test Updates

```bash
# USCIS test updates
npx tsx src/index.ts updates fetch [--force]
npx tsx src/index.ts updates parse [--force]
```

### Command Options

- `--force` - Override local cache and fetch fresh data
- Commands automatically use cached data when available

## Development

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── index.ts              # CLI entry point and command definitions
├── QuestionsManager.ts   # Main orchestration and pipeline logic
├── config.ts            # Configuration settings
├── types.ts             # Core TypeScript definitions
├── schema.ts            # Effect schema definitions
├── utils.ts             # Utility functions
├── CivicsQuestions.ts   # USCIS question fetching and parsing
├── Senators.ts          # Senate XML processing
├── Representatives.ts   # House HTML processing  
├── Governors.ts         # State government processing
├── Updates.ts           # USCIS test updates
├── Questions.ts         # Question data exports
└── parseQuestions.ts    # Question parsing utilities

data/                    # Generated data files
├── civics-questions.json     # Base USCIS questions
├── senators.json            # Current US Senators
├── representatives.json     # Current US Representatives
├── governors.json          # Current state governors
├── updated-questions.json  # USCIS test updates
└── state-governments/      # State government HTML cache

test/                   # Comprehensive test suite
├── QuestionsManager.test.ts
├── Senators.test.ts
├── Representatives.test.ts
├── Governors.test.ts
├── Updates.test.ts
└── parseQuestions.test.ts
```

## Architecture

### Effect-TS Service Pattern

The package follows Effect-TS architectural patterns:

```typescript
export class QuestionsManager extends Effect.Service<QuestionsManager>()(
  'QuestionsManager',
  {
    effect: Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem
      const config = yield* CivicsConfig
      // ... inject dependencies
      
      return {
        fetchCivicsQuestions: fetchCivicsQuestions(fs, client, config),
        constructQuestions: constructQuestions(/* ... */)
      }
    }),
    dependencies: [/* service dependencies */]
  }
) {}
```

### Data Processing Pipeline

1. **Fetch** - Retrieve raw data from government sources
2. **Parse** - Convert HTML/XML to structured objects  
3. **Validate** - Schema validation with comprehensive error handling
4. **Transform** - Map to final question format with variable answers
5. **Output** - Write structured JSON for downstream consumption

### Variable Question Processing

The package handles dynamic questions that change based on current office holders:

- **State Senators**: "Who is one of your state's U.S. Senators now?*"
- **Representatives**: "Name your U.S. Representative."
- **Governors**: "Who is the Governor of your state now?"
- **Capitals**: "What is the capital of your state?*"

These are populated with current data and tagged by state for filtering.

## Dependencies

- `@effect/*` - Functional programming and effect management
- `fast-xml-parser` - XML parsing for Senate data
- `linkedom` - DOM manipulation for HTML parsing
- `typescript` - Type checking and compilation
- `tsx` - TypeScript execution
- `jest` - Testing framework
- `ts-essentials` - TypeScript utility types
