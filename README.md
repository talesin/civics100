# civics100

A TypeScript monorepo for US Citizenship Test preparation, built with Effect-TS and modern web technologies.

> **Note**: This project is an experiment in building a complete application primarily through AI-assisted development (Claude Code), while attempting to maintain high code quality through functional programming patterns, strict typing, and comprehensive testing.

## What's Inside

- **civics2json** - Processes official USCIS civics test data
- **distractions** - Generates incorrect answer choices
- **questionnaire** - Interactive quiz game engine
- **website** - Next.js web application for practice tests

## Quick Start

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run the website
npm run dev --workspace=website
# Visit http://localhost:3000
```

## 2025 USCIS Test Requirements

The application implements the latest 2025 USCIS Civics Test format:
- **Default**: 20 questions, pass with 12 correct (60%)
- **Options**: 20, 50, or 100 questions per session
- **Pass rates**: 60%, 70%, 80%, 90%, or 100%
- **Early win**: Game ends when pass threshold is reached
- **Early fail**: Game auto-ends after 9 incorrect answers

## Development

```bash
# Test all packages
npm test

# Lint all packages
npm run lint

# Clean everything
npm run clean
```

## Tech Stack

- TypeScript with strict configuration
- Effect-TS functional programming
- Next.js 15 with App Router
- React 19
- Tamagui (cross-platform UI framework)
- Jest + React Testing Library

## License

MIT
