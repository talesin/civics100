# Coding Standards & Patterns

Quick reference guide for coding standards in this project. Each section links to detailed documentation.

## Quick Navigation

| Topic               | Guide                                              | Key Concepts                         |
| ------------------- | -------------------------------------------------- | ------------------------------------ |
| General principles  | [general-principles.md](./general-principles.md)   | Naming, simplicity, testing          |
| TypeScript patterns | [typescript-patterns.md](./typescript-patterns.md) | Types, nullish handling, expressions |
| Effect-TS           | [effect-ts-guide.md](./effect-ts-guide.md)         | Services, layers, error handling     |
| Functional patterns | [functional-patterns.md](./functional-patterns.md) | ROP, composition, immutability       |
| Type design         | [type-design.md](./type-design.md)                 | Discriminated unions, branded types  |
| React               | [react-guide.md](./react-guide.md)                 | Components, hooks, Tamagui           |
| Testing             | [testing-guide.md](./testing-guide.md)             | Effect testing, mock layers          |

## Pattern Lookup

### "How do I...?"

| Task                      | Pattern                           | Guide                                                                                |
| ------------------------- | --------------------------------- | ------------------------------------------------------------------------------------ |
| Handle errors             | Tagged errors + `catchTag`        | [effect-ts-guide.md#error-handling](./effect-ts-guide.md#error-handling)             |
| Create a service          | `Effect.Service` class            | [effect-ts-guide.md#services](./effect-ts-guide.md#services)                         |
| Inject dependencies       | Curried functions + Layers        | [effect-ts-guide.md#dependency-injection](./effect-ts-guide.md#dependency-injection) |
| Validate JSON             | Effect Schema                     | [effect-ts-guide.md#schema](./effect-ts-guide.md#schema)                             |
| Model state               | Discriminated unions              | [type-design.md#discriminated-unions](./type-design.md#discriminated-unions)         |
| Avoid primitive obsession | Branded/tagged types              | [type-design.md#branded-types](./type-design.md#branded-types)                       |
| Chain operations          | `Effect.gen` with `yield*`        | [effect-ts-guide.md#composition](./effect-ts-guide.md#composition)                   |
| Test Effect code          | Mock layers + `Effect.runPromise` | [testing-guide.md](./testing-guide.md)                                               |
| Fetch HTTP data           | `HttpClient` with currying        | [effect-ts-guide.md#http-requests](./effect-ts-guide.md#http-requests)               |

### Decision Matrix: Error Handling

| Situation                | Use                               | Example                               |
| ------------------------ | --------------------------------- | ------------------------------------- |
| Business rule violation  | `Effect.fail()` + tagged error    | Validation failed, insufficient funds |
| External service failure | `Effect.tryPromise()` + map error | API timeout, database connection      |
| Programmer error         | `Effect.die()` (defect)           | Invariant violated, impossible state  |
| Resource cleanup needed  | `Effect.acquireRelease()`         | File handle, connection pool          |

### Decision Matrix: Type Design

| Situation       | Pattern                            | Example                      |
| --------------- | ---------------------------------- | ---------------------------- |
| Multiple states | Discriminated union with `_tag`    | Loading/Error/Success        |
| Domain identity | Branded type                       | `CustomerId`, `EmailAddress` |
| Validated data  | Smart constructor returning Effect | `EmailAddress.create(str)`   |
| Optional value  | `Option<T>` or `undefined`         | Never use `null`             |

## Core Principles Summary

1. **Descriptive names** - No abbreviations in files, variables, functions, classes
2. **Prefer simplicity** - Avoid over-engineering, keep solutions focused
3. **Pure functions** - Prefer immutability, side effects at boundaries
4. **Explicit errors** - Use tagged errors, never throw in Effect code
5. **Type safety** - Make illegal states unrepresentable
6. **Test thoroughly** - Mock layers for isolation, test each function

## Anti-Patterns to Avoid

| Anti-Pattern                 | Instead Do                                   |
| ---------------------------- | -------------------------------------------- |
| `any` type                   | Use `unknown` or specific types              |
| `\|\|` for null checks       | Use `??` (nullish coalescing)                |
| Implicit boolean expressions | Be explicit: `if (value !== undefined)`      |
| Throwing errors              | Use `Effect.fail()` with tagged errors       |
| Wide `Effect.try` blocks     | Target the specific line that throws         |
| Leaking dependencies         | Keep service method signatures clean         |
| Primitive obsession          | Use branded/tagged types for domain concepts |
| Boolean flags for state      | Use discriminated unions                     |

## File Organization

```
docs/
├── index.md                 # This file - navigation hub
├── general-principles.md    # Core coding principles
├── typescript-patterns.md   # TypeScript-specific patterns
├── effect-ts-guide.md       # Effect-TS comprehensive guide
├── functional-patterns.md   # FP patterns for TypeScript
├── type-design.md           # Type-driven design
├── react-guide.md           # React + Tamagui patterns
└── testing-guide.md         # Testing with Effect
```
