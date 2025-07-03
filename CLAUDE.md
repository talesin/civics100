# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo containing tools for parsing and processing U.S. Citizenship and Immigration Services (USCIS) Civics Test data. The project uses npm workspaces to manage two main packages:

- **civics2json**: Core tool that downloads and converts USCIS Civics Test data to JSON format
- **distractions**: Secondary workspace (appears to be in development)

## Architecture

### civics2json Architecture

The civics2json package is built with:

- **Effect-TS**: Functional programming library for composable, type-safe effects
- **CLI Framework**: Uses @effect/cli for command-line interface
- **Data Processing Pipeline**: Fetches, parses, and constructs civics questions from multiple sources

#### Key Components

- **QuestionsManager**: Central coordinator that orchestrates data fetching and processing
- **Client Services**: Separate clients for different data sources:
  - CivicsQuestionsClient: Fetches main civics questions
  - SenatorsClient: Fetches senator data
  - RepresentativesClient: Fetches representative data
  - GovernorsClient: Fetches governor data
  - Updates: Handles question updates
- **Data Types**: Comprehensive TypeScript types for all US states/territories and question formats
- **Schema Validation**: Uses Effect Schema for runtime type validation

#### Data Flow

1. Fetch raw data from USCIS and government sources
2. Parse HTML/XML into structured data
3. Construct questions with dynamic state-specific answers (senators, representatives, governors, capitals)
4. Output JSON with both static civics questions and dynamic political data

### Key Files

- `src/index.ts`: CLI entry point with command definitions
- `src/QuestionsManager.ts`: Main orchestration logic
- `src/types.ts`: Core TypeScript definitions for states and questions
- `src/schema.ts`: Effect Schema definitions for validation
- `src/config.ts`: Configuration management

## Development Commands

### Root Level

```bash
npm test                    # Run tests across all workspaces
```

### civics2json Workspace

```bash
npm run clean              # Clean build artifacts and dependencies
npm run lint               # Run ESLint
npm run lint:fix           # Run ESLint with auto-fix
npm run build              # Build for distribution using tsup
npm run package            # Full build pipeline: clean, install, lint, construct, build
npm test                   # Run Jest tests
```

### distractions Workspace

```bash
npm run clean              # Clean build artifacts and dependencies
npm run lint               # Run ESLint
npm run lint:fix           # Run ESLint with auto-fix
npm run build              # Build TypeScript using tsc
npm test                   # Run Jest tests
```

## CLI Usage

The civics2json tool provides a comprehensive CLI for data management:

```bash
# Main commands
npx tsx src/index.ts questions fetch      # Fetch civics questions
npx tsx src/index.ts questions parse      # Parse civics questions
npx tsx src/index.ts questions construct  # Construct final questions

npx tsx src/index.ts senators fetch       # Fetch senator data
npx tsx src/index.ts senators parse       # Parse senator data

npx tsx src/index.ts representatives fetch [--force]  # Fetch representatives
npx tsx src/index.ts representatives parse [--force]  # Parse representatives

npx tsx src/index.ts governors fetch [--force]        # Fetch governors

npx tsx src/index.ts updates fetch [--force]          # Fetch updates
npx tsx src/index.ts updates parse [--force]          # Parse updates
```

## Testing

- **Framework**: Jest with ts-jest preset
- **Configuration**: Both workspaces use similar Jest setups with TypeScript support
- **Test Files**: Located in `test/` directories with `.test.ts` extension
- **Coverage**: Tests cover core functionality including parsing, data fetching, and question construction

## Code Quality

- **TypeScript**: Strict configuration with comprehensive type checking
- **ESLint**: Enforces code quality with TypeScript-specific rules
- **Prettier**: Code formatting integrated with ESLint
- **Effect-TS**: Functional programming patterns for error handling and composability

## Coding Standards

### General Principles

- Use descriptive names for files, variables, functions, and classes—no abbreviations
- Always check for existing code before writing new implementations
- Do not drastically change existing patterns; iterate on them first
- Prefer simple solutions and avoid code duplication
- Keep the codebase simple and easy to understand
- Focus only on areas relevant to the task at hand
- Write thorough tests for all code
- Read .windsurf/rules/code-style-guide.md for more information

### TypeScript/Effect-TS Specific

- **Effect Schemas**: Use Effect schemas for all JSON validation
- **Pure Functions**: Prefer pure functions and immutability
- **Error Handling**: Wrap all non-local or unsafe code in `Effect.try` or `Effect.tryPromise` instead of try/catch
- **Null Handling**: Avoid returning null; prefer undefined and tagged union types
- **Null Coalescing**: Use `??` instead of `||` when checking for null or undefined
- **Boolean Expressions**: Do not use implicit boolean expressions
- **State Management**: Avoid external state libraries (no Redux or Zustand)
- **Effect Scope**: Keep `Effect.try` and `Effect.tryPromise` to the specific line that may throw

### Important Notes

- Do not fix linting errors automatically; let maintainer address them first
- Never overwrite `.envrc` file
- Refer to README.md and PLAN.md files for context

## Important Notes

- The project processes government data and maintains strict typing for state information
- Variable questions (senators, representatives, governors, capitals) are dynamically populated
- The tool is designed to handle both static civics questions and dynamic political data
- All data sources are fetched from official government websites
