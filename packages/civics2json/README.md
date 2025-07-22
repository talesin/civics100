# Civics2JSON

A TypeScript-based tool for fetching and parsing USCIS civics questions from the official website into a structured JSON format.

## Overview

Civics2JSON is a command-line utility that helps you retrieve the official USCIS civics test questions and convert them into a machine-readable JSON format. This can be particularly useful for:

- Building study applications
- Creating practice tests
- Analyzing question patterns
- Integrating civics questions into other applications

## Features

- **Fetching**: Download the latest civics questions directly from the official USCIS website
- **Parsing**: Convert the HTML content into a structured JSON format
- **Type-Safe**: Built with TypeScript for better developer experience and type safety
- **Effectful**: Uses the Effect ecosystem for robust error handling and functional programming patterns

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

### Fetch Command

Download the latest civics questions from the USCIS website:

```bash
npx tsx src/index.ts fetch
```

This will fetch the HTML content from the official USCIS website and save it locally.

### Parse Command

Parse the fetched HTML content into a structured JSON file:

```bash
npx tsx src/index.ts parse
```

This will:

1. Read the previously fetched HTML content
2. Parse the questions and answers
3. Save them to a structured JSON file

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

- `src/`: Source code
  - `index.ts`: Main entry point and CLI setup
  - `CivicsQuestions.ts`: Core logic for fetching and parsing questions
  - `config.ts`: Configuration settings
- `test/`: Test files

## Dependencies

- `@effect/*`: For functional programming and effect management
- `typescript`: Type checking and compilation
- `tsx`: TypeScript execution
- `jest`: Testing framework
