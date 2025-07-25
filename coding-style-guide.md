# General

If there is a README.md refer to it for the app description.
If there is a TASKS.md refer to it for specific tasks
Never overwrite my .envrc file.

# Coding

Use descriptive file names—no abbreviations.
Use descriptive variable names—no abbreviations.
Use descriptive function names—no abbreviations.
Use descriptive class names—no abbreviations.
Always check for existing code before writing new code.
Do not drastically change existing patterns iterate on them first.
Always prefer simple solutions.
Avoid code duplication where possible—check for existing implementations before writing new code.
Keep the codebase simple and easy to understand.
Focus only on areas of the code relevant to the task at hand.
Do not modify unrelated code.
Write thorough tests for all code.

# TypeScript

Prefer pure functions and immutability in TypeScript.
Avoid returning null prefer undefined and, where possible, use tagged union types.
Avoid the use of the any type, prefer explicitly typed or unknown
Avoid external state libraries (e.g., no Redux or Zustand).
Use ?? instead of || when checking for null or undefined.
Do not use implicit boolean expressions, always use explicit boolean comparisons for non-boolean values, e.g. `if (value1 === null || value1 === undefined)` instead of `if (value)`.
Do not fix linting errors let me address them first.
Prefer the use of types over interfaces unless there's precedence (ie. if there are specific examples or patterns to follow)
Except at the edges, all effectful code (that is any non pure functions), will be written using Effect-TS.
Use Effect schemas for all JSON validation.
Wrap all non-local or unsafe code in Effect.try or Effect.tryPromise.
Use Effect.try or Effect.tryPromise instead of try/catch
Keep Effect.try and Effect.tryPromise to the specific line of code that may throw an error
Do not throw errors use Effect patterns
When testing prefer the use of expect(value).toMatchObject({...}) over multiple expect statements, unless there's no other way to test the code.

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
  executeSomething?: ExampleService["executeSomething"];
  executeAnother?: ExampleService["executeAnother"];
}) =>
  Layer.succeed(
    ExampleService,
    ExampleService.of({
      _tag: "ExampleService",
      executeSomething:
        fn?.executeSomething ??
        ((() =>
          Effect.succeed("")) as unknown as ExampleService["executeSomething"]),
      executeAnother:
        fn?.executeAnother ??
        ((() =>
          Effect.succeed([])) as unknown as ExampleService["executeAnother"]),
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

When testing with Effect, you will need to do something similar to the following. Prefer testing each function in isolation passing in mock dependencies.

```typescript
// function to test
const doTheThing = (service: Service) => Effect.fn(function* (arg: string) {
  const result = yield* service.doTheOtherThing()
  return result + arg
})


it('should do the thing', async () => {
  // use test layer to mock dependencies
  const testLayer = TestLayer({
    doTheOtherThing: () => Effect.succeed([])
  })

  // run effect with test layer
  await Effect.gen(function* () {
    const service = yield* MyService // get dependencies
    const result = yield* doTheThing(service)('arg) // call function with test data
    expect(result).toEqual({ ... })
  }).pipe(
    Effect.provide(testLayer), // provide test layer
    Effect.runPromise
  )
})
```

## Dependency Injection

A tenet of Effect-TS is that dependencies shouldn't be exposed by functions within a service. This is because it can lead to code that is hard to test and maintain. Services should be the only place that dependencies are exposed. Use function currying to pass dependencies to functions.

The dependency injection pattern is used to provide dependencies to functions. The first function should contain the dependencies arguments and return an Effect.fn that contains the arguments for the actual function.

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
