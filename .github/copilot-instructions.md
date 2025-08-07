<!--
  .github/copilot-instructions.md
  Comprehensive guidance for AI coding agents in the civics100 monorepo.
-->
# GitHub Copilot Instructions for civics100 Monorepo

This document provides comprehensive, project-specific guidance for AI agents working in **civics100**, a multi-package repository for processing U.S. Civics Test data with a focus on Effect-TS functional programming patterns.

## 1. Project Architecture

### Workspace Structure
- **civics2json/**: Core CLI tool for data ingestion and transformation from USCIS sources
- **questionnaire/**: Offline quiz logic and game mechanics with CLI interface
- **distractions/**: Secondary workspace for distractor generation (lower priority)
- **website/**: Next.js 15 App Router frontend with full-stack functionality

### Data Flow
1. `civics2json` fetches raw HTML/XML from government sources
2. Parses and validates using Effect schemas into structured JSON
3. `questionnaire` and `website` consume generated JSON for quiz functionality
4. Dynamic questions populated with current senators, representatives, governors

## 2. Effect-TS Patterns (CRITICAL)

### Service Architecture
Always use Effect.Service for dependency injection:

```typescript
export class ExampleService extends Effect.Service<ExampleService>()(
  "ExampleService",
  {
    effect: Effect.gen(function* () {
      const dependency1 = yield* Dependency1;
      return {
        executeSomething: executeSomething(dependency1),
      };
    }),
  }
) {}

// Always provide test layers
export const TestExampleServiceLayer = (fn?: {
  executeSomething?: () => ExampleService["executeSomething"];
}) =>
  Layer.succeed(
    ExampleService,
    ExampleService.of({
      _tag: "ExampleService",
      executeSomething: fn?.executeSomething ?? (() => Effect.succeed("")),
    })
  );
```

### Effect Composition
- **ALWAYS** use `Effect.gen` or `Effect.fn` over `Effect.flatMap`
- **NEVER** use try/catch - wrap in `Effect.try` or `Effect.tryPromise`
- Keep Effect.try scoped to specific throwing operations
- Use `yield*` for effect sequencing

```typescript
const fetchData = (httpClient: HttpClient.HttpClient) =>
  Effect.fn(function* (url: string) {
    const response = yield* httpClient.get(url);
    const text = yield* response.text;
    return text;
  });
```

### Schema-First Development
All data validation through Effect schemas:

```typescript
export const SenatorSchema = Schema.Struct({
  last_name: Schema.String,
  first_name: Schema.String,
  state: Schema.Literal(...stateAbbreviations),
}).annotations({ name: 'Senator' });

export type Senator = typeof SenatorSchema.Type;

// Usage
const senator = yield* Schema.decodeUnknown(SenatorSchema)(rawData);
```

## 3. TypeScript Guidelines

### Strict Type Safety
- **NO** `any` type - use `unknown` or explicit typing
- Prefer `undefined` over `null` - use `??` not `||`
- Use tagged union types with `_tag` field for discriminated unions
- **NO** implicit boolean expressions

### Naming & Structure
- Descriptive names without abbreviations: `QuestionDataService`, not `QDS`
- Match file names to primary export: `QuestionsManager.ts` exports `QuestionsManager`
- Pure functions outside service classes, curried for dependency injection

## 4. React/Next.js Patterns (Website)

### Component Structure
```typescript
// Component summary comment
interface ComponentNameProps {
  requiredProp: string;
  optionalProp?: number;
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  requiredProp,
  optionalProp
}) => {
  // Component logic
  return (
    <div className="tailwind-classes">
      {requiredProp}
    </div>
  );
};
```

### Service Integration
Components consume Effect services through service providers:
- Delegate business logic to services
- Use Effect.runPromise in event handlers
- Handle errors through Effect error channels

## 5. Testing Requirements

### Effect Testing Pattern
```typescript
it('should process data correctly', async () => {
  const testLayer = TestServiceLayer({
    processData: () => Effect.succeed(['result'])
  });

  await Effect.gen(function* () {
    const service = yield* MyService;
    const result = yield* service.processData('input');
    expect(result).toEqual(['result']);
  }).pipe(
    Effect.provide(testLayer),
    Effect.runPromise
  );
});
```

### Coverage Requirements
- Test all parsing functions with real data samples
- Mock external services using test layers
- Integration tests for CLI commands
- Component testing for React UI

## 6. Data Processing Specifics

### Government Data Sources
- USCIS civics questions from official HTML pages
- Senate.gov XML for senator data
- House.gov for representative information
- State government pages for governor data

### Variable Questions
Handle dynamic question types in `VARIABLE_QUESTIONS`:
- State senators: "Who is one of your state's U.S. Senators now?*"
- Representatives: "Name your U.S. Representative."
- Governors: "Who is the Governor of your state now?"
- Capitals: "What is the capital of your state?*"

### Schema Validation
Every external data source has corresponding Effect schema:
- `SenatorSchema`, `RepresentativeSchema`, `GovernorSchema`
- Comprehensive state/territory type definitions
- Runtime validation with clear error messages

## 7. Build & Development Workflow

### Commands to Always Run
```bash
# After code changes
npm run lint        # ESLint across all workspaces
npm test           # Full test suite
npm run build      # Build all packages

# For CLI development
npx tsx src/index.ts [command] [subcommand] [flags]

# For website development
npm run dev --workspace=website
```

### File Organization
- Co-locate tests with source: `src/Service.ts` → `test/Service.test.ts`
- Keep schemas in dedicated `schema.ts` files
- Utils for pure functions, services for effects
- Types in `types.ts` with comprehensive state definitions

## 8. Code Quality Standards

### Required Practices
- **NEVER** modify `.envrc` files
- **ALWAYS** check existing patterns before creating new ones
- **NO** external state libraries (Redux, Zustand) - use Effect state
- Prefer simple solutions over complex abstractions
- Focus only on task-relevant code areas

### Error Handling
- No thrown errors - use Effect error channels
- Wrap unsafe operations in Effect.try/tryPromise
- Provide meaningful error types and messages
- Handle ParseError, HttpClientError, PlatformError

### Environment & Configuration
Use Effect Config instead of process.env:
```typescript
const apiKey = yield* Config.string("API_KEY").pipe(
  Config.withDefault("default-value")
);
```

## 9. AI-Specific Guidelines

### Code Generation
- Add brief component/function summary comments
- Use TODO markers for incomplete implementations
- Provide test scaffolding with new features
- Document any non-obvious business logic

### Pattern Matching
Follow existing patterns in similar files:
- Service structure in `civics2json/src/`
- Component patterns in `website/src/components/`
- CLI structure in `questionnaire/src/cli/`
- Test patterns across `test/` directories

### Integration Points
- Data flows from civics2json → questionnaire/website
- Services communicate through Effect dependency injection
- UI state managed through Effect-based services
- External APIs accessed through HttpClient effects

---

**Remember**: This is a functional programming codebase using Effect-TS patterns throughout. Always prioritize type safety, pure functions, and effect composition over imperative alternatives.