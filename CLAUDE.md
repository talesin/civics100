# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Quick Reference

| Task               | Guide                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| Coding standards   | [docs/index.md](./docs/index.md)                                                   |
| Effect-TS patterns | [docs/effect-ts-guide.md](./docs/effect-ts-guide.md)                               |
| Error handling     | [docs/effect-ts-guide.md#error-handling](./docs/effect-ts-guide.md#error-handling) |
| Type design        | [docs/type-design.md](./docs/type-design.md)                                       |
| Testing            | [docs/testing-guide.md](./docs/testing-guide.md)                                   |
| React/Tamagui      | [docs/react-guide.md](./docs/react-guide.md)                                       |

## Project Overview

Monorepo for parsing and processing U.S. Citizenship and Immigration Services (USCIS) Civics Test data.

**Workspaces:**
- **civics2json**: Core tool - downloads and converts USCIS Civics Test data to JSON
- **distractions**: Secondary workspace (in development)

**Tech Stack:**
- Effect-TS for functional programming and composability
- @effect/cli for command-line interface
- Effect Schema for runtime type validation

## Key Files

| File                                           | Purpose                   |
| ---------------------------------------------- | ------------------------- |
| `packages/civics2json/src/index.ts`            | CLI entry point           |
| `packages/civics2json/src/QuestionsManager.ts` | Main orchestration        |
| `packages/civics2json/src/types.ts`            | State/question types      |
| `packages/civics2json/src/schema.ts`           | Effect Schema definitions |

## Data Flow

1. Fetch raw data from USCIS and government sources
2. Parse HTML/XML into structured data
3. Construct questions with dynamic state-specific answers
4. Output JSON with static civics questions and dynamic political data

## Commands

### Root Level
```bash
npm test                    # Run tests across all workspaces
```

### civics2json
```bash
npm run clean              # Clean build artifacts
npm run lint               # Run ESLint
npm run build              # Build for distribution
npm run package            # Full build pipeline
npm test                   # Run Jest tests
```

### CLI Usage
```bash
npx tsx src/index.ts questions fetch      # Fetch civics questions
npx tsx src/index.ts questions parse      # Parse civics questions
npx tsx src/index.ts questions construct  # Construct final questions
npx tsx src/index.ts senators fetch       # Fetch senator data
npx tsx src/index.ts senators parse       # Parse senator data
npx tsx src/index.ts representatives fetch [--force]
npx tsx src/index.ts governors fetch [--force]
```

## Essential Rules

- **Temporary files**: Prefix with `temp_`, delete after use
- **Plans**: Save to `plans/` directory in markdown
- **Never overwrite**: `.envrc` file
- **Linting**: Do not auto-fix; let maintainer address
- **Coding standards**: See [docs/index.md](./docs/index.md)

## Website Styling (Tamagui)

### Theme Context
```typescript
const { theme } = useThemeContext();  // 'light' | 'dark'
const colors = themeColors[theme];
```

### Available CSS Classes
- Cards: `card`, `card-elevated`, `card-interactive`
- Buttons: `btn-primary`, `btn-secondary`, `btn-success`, `btn-error`
- Utilities: `focus-ring`, `animate-fade-in`, `text-gradient`
- Responsive: `hidden`, `md:flex`, `md:hidden`

### Notes
- Tailwind CSS removed - do not add Tailwind classes
- Test both light and dark themes when modifying styles
