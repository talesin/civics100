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
Avoid the use of the any type, prefer explicitly typed or unknown
Wrap all non-local or unsafe code in Effect.try or Effect.tryPromise.
Use Effect.try or Effect.tryPromise instead of try/catch
Keep Effect.try and Effect.tryPromise to the specific line of code that may throw an error
Do not throw errors use Effect patterns
Avoid external state libraries (e.g., no Redux or Zustand).
Use ?? instead of || when checking for null or undefined.
Do not use implicit boolean expressions
Do not fix linting errors; let me address them first.
Prefer the use of types over interfaces unless there's precedence (ie. if there are specific examples or patterns to follow)

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
  executeSomething?: () => ExampleService["executeSomething"];
  executeAnother?: () => ExampleService["executeAnother"];
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

## Date and Time

```typescript
const currentTime = yield * Clock.currentTimeMillis;
const date = new Date(currentTime);
```

## Random

Prefer using Effect.random or Random over Math.random

```typescript
const n1 = yield * Random.nextIntBetween(1, 10);

// or

const random = yield * Effect.random;
const n2 = yield * random.next;
```

## Schema

Prefer using tagged schemas with derived types over interfaces, unless there is a specific need for an interface.
Keep names the same unless there is a conflict.

```typescript
// define the schema
export const SampleResponse = Schema.TaggedStruct("SampleResponse", {
  message: Schema.String,
  data: Schema.Array(Schema.String),
});

// define the type
export type SampleResponse = typeof SampleResponse.Type;

// decode the response from json
const response = yield * Schema.decodeUnknown(SampleResponse)(json);

// make the response
const response = SampleResponse.make({
  message: "Test message",
  data: [],
});
```

## Environment Variables

Prefer using Config over process.env

```typescript
const myEnvVar =
  yield * Config.string("MY_ENV_VAR").pipe(Config.withDefault("default value"));
```

## Logging

Prefer using Effect.log over console.log

```typescript
Effect.log("Hello World");
```

# React

A curated React style guide designed to help AI coding assistants like Claude, Copilot, and ChatGPT generate consistent, maintainable code.

## Based On

This guide is adapted from the [Airbnb React/JSX Style Guide](https://github.com/airbnb/javascript/tree/master/react), tailored for AI-first coding workflows.

## 1. Component Structure

- Always use **function components**.
- Prefer **arrow functions** unless a named function is explicitly required.
- Export only **one component per file**.
- **Match the file and component name**.

```tsx
// Good
export const Button = () => {
  return <button>Click me</button>;
};

// Bad
function Btn() {
  return <button>Click me</button>;
}
```

## 2. Props and Types

- Always define a `Props` type or interface, even if it's empty.
- Use `interface` unless you need unions or advanced types.

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return <button onClick={onClick}>{label}</button>;
};
```

## 3. Hooks

- Never call hooks conditionally.
- Extract complex `useEffect` logic into custom hooks.
- Prefer `useReducer` over multiple `useState` calls for complex state.

## 4. Styling

- Prefer **Tailwind CSS** or **CSS Modules**.
- Avoid inline styles unless dynamic and small.
- Descriptive class names if not using Tailwind.

## 5. Naming

- Use **descriptive PascalCase** names: `UserCard`, `SignInForm`, `NavBar`.
- Avoid vague or abbreviated names (`Uc`, `Sif`, `nb`).

## 6. Folder Structure

Organize components with their logic, styles, and tests.

```text
components/
  Button/
    Button.tsx
    Button.test.tsx
    Button.module.css
  Header/
    Header.tsx
```

## 7. Imports

- Group by type: **built-in**, **third-party**, **internal**.
- Alphabetize within groups.
- Prefer **absolute imports** using `tsconfig` paths.

```tsx
import React from "react";
import { useRouter } from "next/router";

import { Button } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
```

## 8. File Conventions

- Use `.tsx` for all React components.
- Co-locate tests with components: `ComponentName.test.tsx`.

## 9. Code Formatting

- Use **Prettier** with standard configuration.
- Use ESLint with:
  - `eslint-plugin-react`
  - `eslint-plugin-jsx-a11y`
- Use no semicolons if following Prettier defaults.

## 10. AI-Specific Additions

- Add comments to **non-trivial** logic.
- Use markers for protected code:
  ```tsx
  // AI: DO NOT MODIFY
  ```
- Add short summaries at top of files:
  ```tsx
  // Renders a button that triggers a parent callback when clicked.
  // Used across the site for primary actions.
  ```

## Example Component

```tsx
// Renders a styled button with an onClick callback
// Used in primary user actions
interface ButtonProps {
  label: string;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="rounded bg-blue-600 text-white px-4 py-2"
    >
      {label}
    </button>
  );
};
```

## Optional Tools

- Prettier: For consistent formatting.
- ESLint: For syntax and logic rules.
- TypeScript: Strongly recommended.
- Tailwind CSS: Encouraged for styling clarity and reuse.
- Testing Library + Jest: For unit and integration testing.
