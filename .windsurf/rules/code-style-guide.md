---
trigger: always_on
---

# General

Refer to README.md for the app description.
Refer to PLAN.md for the app plan.
Never overwrite my .envrc file.

# Coding

Use descriptive file names—no abbreviations.
Use descriptive variable names—no abbreviations.
Use descriptive function names—no abbreviations.
Use descriptive class names—no abbreviations.
Always check for existing code before writing new code.
Do not drastically change existing patterns; iterate on them first.
Always prefer simple solutions.
Avoid code duplication where possible—check for existing implementations before writing new code.
Keep the codebase simple and easy to understand.
Focus only on areas of the code relevant to the task at hand.
Do not modify unrelated code.
Write thorough tests for all code.

# TypeScript

Use Effect schemas for all JSON validation.
Prefer pure functions and immutability in TypeScript.
Avoid returning null; prefer undefined and, where possible, use tagged union types.
Wrap all non-local or unsafe code in Effect.try or Effect.tryPromise.
Use Effect.try or Effect.tryPromise instead of try/catch
Keep Effect.try and Effect.tryPromise to the specific line of code that may throw an error
Avoid external state libraries (e.g., no Redux or Zustand).
Use ?? instead of || when checking for null or undefined.
Do not use implicit boolean expressions.
Do not fix linting errors; let me address them first.

## Effect Services

Entry into functions should be via an Effect.Service class. This will allow for dependency injection and testing. Do not create a a Live layer, Effect.Service provides a Default property for that.

```typescript
export class ExampleService extends Effect.Service<ExampleService>()(
  "ExampleService",
  {
    effect: Effect.gen(function* () {
      const dependency1 = yield* Dependency1;
      const dependency2 = yield* Dependency2;
      return {
        executeSomething: executeSomething(dependency1),
        executeAnother: executeAnother(dependency2),
      };
    }),
  }
) {}

export const TestExampleServiceLayer = (fn?: {
  executeSomething?: () => Effect.Effect<string, ExampleError>;
  executeAnother?: () => Effect.Effect<readonly Representative[], AnotherError>;
}) =>
  Layer.succeed(
    ExampleService,
    ExampleService.of({
      _tag: "ExampleService",
      executeSomething: fn?.executeSomething ?? (() => Effect.succeed("")),
      executeAnother: fn?.executeAnother ?? (() => Effect.succeed([])),
    })
  );
```

## HTTP Requests with Effect

Setup the function to fetch a URL with some simple currying. This allows the HttpClient to be injected at runtime.

```typescript
import { HttpClient } from "@effect/platform";
import { HttpClientError } from "@effect/platform/HttpClientError";

export const fetchUrl = (httpClient: HttpClient.HttpClient) =>
  Effect.fn(function* (url: string) {
    const response = yield* httpClient.get(url);
    const text = yield* response.text;

    return text;
  });
```

When running this you will need to do something similar to the following to provide the HttpClient

```typescript
const program = Effect.gen(function* () {
  const httpClient = yield* HttpClient;
  const response = yield* fetchUrl(httpClient)("https://example.com");
  Effect.log(response);
});

program.pipe(Effect.provide(FetchHttpClient.layer), Effect.runPromise);
```

## Prefer Effect.gen or Effect.fn over use of Effect.flatMap

In most cases (not all), using `Effect.gen/Effect.fn` with `yield*` is preferable to using multiple `Effect.map`s and `Effect.mapFlat`s.

```typescript
const example = Effect.gen(function* () {
  const result = yield* Effect.all([
    Effect.succeed(1),
    Effect.succeed(2),
    Effect.succeed(3),
  ]);
});

const func = Effect.fn(
  (a: Effect<number>, b: Effect<number>, c: Effect<number>) => {
    const result = yield * Effect.all([a, b, c]);
  }
);
```

## Testing with Effect

```typescript
  it('should do the thing', async () => {
    // use test layer to mock dependencies
    const testLayer = TestLayer({
      doTheThing: () => Effect.succeed([])
    })

    // run effect with test layer
    await Effect.gen(function* () {
      const service = yield* MyService
      const result = yield* service.doTheThing()
      expect(result).toEqual({ ... })
    }).pipe(
      Effect.provide(testLayer),
      Effect.runPromise
    )
  })
```

## Dependency Injection

The dependency injection pattern is used to provide dependencies to services. This allows for testing and dependency injection. This is using a currying pattern to provide the dependencies to the service. The first function should contain the dependencies arguments and return an Effect.fn that contains the arguments for the actual function.

Keep the service class minimal with just the code to define and configure it. All exported or supporting functions should be declared out side the class.

```typescript
export const executeSomething = (dependency1: Dependency1) =>
  Effect.fn(function* (arg1: string) {
    const dependency2 = yield* Dependency2;
    const result = yield* dependency1.executeSomething(arg1);
    return result;
  });

export class ExampleService extends Effect.Service<ExampleService>()(
  "ExampleService",
  {
    effect: Effect.gen(function* () {
      const dependency1 = yield* Dependency1;
      const dependency2 = yield* Dependency2;
      return {
        executeSomething: executeSomething(dependency1),
        executeAnother: executeAnother(dependency2),
      };
    }),
  }
) {}
```

## Tagged Data

```typescript
type Person = {
  readonly _tag: "Person"; // the tag
  readonly name: string;
};

const Person = Data.tagged<Person>("Person");
```

# Rust

Rust commands must not expose unsafe code.