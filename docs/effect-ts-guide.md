# Effect-TS Guide

Comprehensive patterns for Effect-TS in this project.

## Table of Contents

- [Services](#services)
- [Dependency Injection](#dependency-injection)
- [Error Handling](#error-handling)
- [Composition](#composition)
- [Schema](#schema)
- [HTTP Requests](#http-requests)
- [Environment Variables](#environment-variables)
- [Logging](#logging)
- [Date and Time](#date-and-time)
- [Random](#random)
- [Anti-Patterns](#anti-patterns)

---

## Services

Entry into functions should be via an `Effect.Service` class for dependency injection and testing.

### Service Definition Pattern

```typescript
import { Effect, Layer, Data } from 'effect';

// Define functions outside the class for clarity
export const executeSomething = (dependency: Dependency) =>
  Effect.fn(function* (arg: string) {
    const result = yield* dependency.doWork(arg);
    return result;
  });

// Service class is minimal - just configuration
export class MyService extends Effect.Service<MyService>()(
  "project/MyService",  // Use namespaced identifier
  {
    effect: Effect.gen(function* () {
      const dependency = yield* Dependency;
      return {
        executeSomething: executeSomething(dependency),
      };
    }),
  }
) {}
```

### Test Layer Pattern

Create test layers for mocking in tests:

```typescript
export const TestMyServiceLayer = (overrides?: {
  executeSomething?: () => MyService["executeSomething"];
}) =>
  Layer.succeed(
    MyService,
    MyService.of({
      _tag: "MyService",
      executeSomething: overrides?.executeSomething ?? (() => Effect.succeed("")),
    })
  );
```

---

## Dependency Injection

Use currying to inject dependencies. First function takes dependencies, returns an `Effect.fn` for the actual logic.

```typescript
// Curried pattern: dependencies first, data last
export const processOrder = (orderService: OrderService, emailService: EmailService) =>
  Effect.fn(function* (orderId: string) {
    const order = yield* orderService.findOrder(orderId);
    yield* emailService.sendConfirmation(order.customerEmail);
    return order;
  });

// In service class
export class WorkflowService extends Effect.Service<WorkflowService>()(
  "project/WorkflowService",
  {
    effect: Effect.gen(function* () {
      const orderService = yield* OrderService;
      const emailService = yield* EmailService;
      return {
        processOrder: processOrder(orderService, emailService),
      };
    }),
  }
) {}
```

### Layer Composition

```typescript
// Combine layers
const AppLayer = Layer.mergeAll(
  DatabaseLayer,
  EmailServiceLayer,
  ConfigLayer,
);

// Feed dependencies
const FullLayer = OrderServiceLayer.pipe(
  Layer.provide(AppLayer)
);
```

---

## Error Handling

### Error Classification

| Type                               | Use Case                | Example                              |
| ---------------------------------- | ----------------------- | ------------------------------------ |
| **Expected Error** (`Effect.fail`) | Business logic failures | Validation failed, not found         |
| **Defect** (`Effect.die`)          | Programmer errors       | Invariant violated, impossible state |
| **Interruption**                   | Cancelled operations    | Timeout, race condition              |

### Tagged Errors

Always use tagged errors for type-safe pattern matching:

```typescript
import { Data, Effect } from 'effect';

// Define tagged errors
export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  readonly resource: string;
  readonly id: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string;
  readonly message: string;
}> {}

// Use in functions
const findCustomer = (id: string): Effect.Effect<Customer, NotFoundError> =>
  Effect.gen(function* () {
    const customer = yield* database.find(id);
    if (customer === undefined) {
      return yield* Effect.fail(new NotFoundError({ resource: "Customer", id }));
    }
    return customer;
  });
```

### Error Recovery

```typescript
// Catch specific error
const result = yield* findCustomer(id).pipe(
  Effect.catchTag("NotFoundError", (error) =>
    Effect.succeed(createDefaultCustomer(error.id))
  )
);

// Catch all errors
const resultOrDefault = yield* operation.pipe(
  Effect.catchAll((error) => Effect.succeed(defaultValue))
);

// Map errors to different type
const mapped = yield* operation.pipe(
  Effect.mapError((e) => new DomainError({ cause: e }))
);
```

### Wrapping Unsafe Code

Keep `Effect.try` and `Effect.tryPromise` to the **specific line** that may throw:

```typescript
// Bad - too wide
const process = Effect.try(() => {
  const parsed = JSON.parse(input);
  const validated = validate(parsed);
  const transformed = transform(validated);
  return transformed;
});

// Good - targeted
const process = Effect.gen(function* () {
  const parsed = yield* Effect.try(() => JSON.parse(input));
  const validated = validate(parsed);  // Pure, won't throw
  const transformed = transform(validated);  // Pure, won't throw
  return transformed;
});
```

---

## Composition

### Prefer Effect.gen Over flatMap

Use generator syntax for better readability:

```typescript
// Preferred
const workflow = Effect.gen(function* () {
  const customer = yield* findCustomer(id);
  const orders = yield* findOrders(customer.id);
  const total = calculateTotal(orders);
  return { customer, orders, total };
});

// Avoid chaining for complex flows
const workflow = findCustomer(id).pipe(
  Effect.flatMap((customer) =>
    findOrders(customer.id).pipe(
      Effect.map((orders) => ({
        customer,
        orders,
        total: calculateTotal(orders),
      }))
    )
  )
);
```

### Effect.fn for Reusable Functions

```typescript
export const processItem = Effect.fn(function* (item: Item) {
  const validated = yield* validate(item);
  const result = yield* save(validated);
  return result;
});
```

### Parallel Execution

```typescript
// Run independent effects in parallel
const [customers, orders, products] = yield* Effect.all([
  fetchCustomers(),
  fetchOrders(),
  fetchProducts(),
]);

// With concurrency control
const results = yield* Effect.all(items.map(processItem), {
  concurrency: 5,
});
```

---

## Schema

Use Effect Schema for all JSON validation.

### Define Schema and Type Together

```typescript
import { Schema } from 'effect';

// Define schema
export const CustomerResponse = Schema.TaggedStruct("CustomerResponse", {
  id: Schema.String,
  name: Schema.String,
  email: Schema.String,
  createdAt: Schema.DateFromString,
});

// Derive type (keep names the same unless conflict)
export type CustomerResponse = typeof CustomerResponse.Type;
```

### Decoding Data

```typescript
// Parse JSON string first
const json = yield* Schema.decodeUnknown(Schema.parseJson())(rawString);

// Then decode to typed structure
const customer = yield* Schema.decodeUnknown(CustomerResponse)(json);
```

### Creating Validated Data

```typescript
// Use .make() for construction
const response = CustomerResponse.make({
  id: "123",
  name: "John",
  email: "john@example.com",
  createdAt: new Date(),
});
```

---

## HTTP Requests

Use currying to allow HttpClient injection at runtime:

```typescript
import { HttpClient } from '@effect/platform';
import { FetchHttpClient } from '@effect/platform';

// Curried function for testability
export const fetchUrl = (httpClient: HttpClient.HttpClient) =>
  Effect.fn(function* (url: string) {
    const response = yield* httpClient.get(url);
    const text = yield* response.text;
    return text;
  });

// Usage
const program = Effect.gen(function* () {
  const httpClient = yield* HttpClient.HttpClient;
  const response = yield* fetchUrl(httpClient)("https://example.com");
  yield* Effect.log(response);
});

// Run with real HTTP client
program.pipe(
  Effect.provide(FetchHttpClient.layer),
  Effect.runPromise
);
```

---

## Environment Variables

Prefer `Config` over `process.env`:

```typescript
import { Config } from 'effect';

const config = Effect.gen(function* () {
  const apiUrl = yield* Config.string("API_URL");
  const timeout = yield* Config.number("TIMEOUT").pipe(
    Config.withDefault(5000)
  );
  const debug = yield* Config.boolean("DEBUG").pipe(
    Config.withDefault(false)
  );
  return { apiUrl, timeout, debug };
});
```

---

## Logging

Prefer `Effect.log` over `console.log`:

```typescript
// Simple logging
yield* Effect.log("Processing started");

// With data
yield* Effect.log("Order processed", { orderId, total });

// Log levels
yield* Effect.logDebug("Debug info");
yield* Effect.logInfo("Information");
yield* Effect.logWarning("Warning");
yield* Effect.logError("Error occurred");
```

---

## Date and Time

Use Effect's Clock for testable time:

```typescript
import { Clock } from 'effect';

const currentTime = yield* Clock.currentTimeMillis;
const date = new Date(currentTime);
```

---

## Random

Prefer Effect.random or Random over Math.random:

```typescript
import { Random } from 'effect';

const randomInt = yield* Random.nextIntBetween(1, 100);

// Or using the random service
const random = yield* Effect.random;
const value = yield* random.next;
```

---

## Tagged Data

Use Data.tagged for creating tagged types:

```typescript
import { Data } from 'effect';

type Person = {
  readonly _tag: "Person";
  readonly name: string;
  readonly age: number;
};

const Person = Data.tagged<Person>("Person");

// Create instances
const john = Person({ name: "John", age: 30 });
```

---

## Anti-Patterns

### Don't Leak Dependencies

Service method signatures should NOT include dependencies:

```typescript
// Bad - dependencies leak into signature
{
  readonly findCustomer: (id: string) => Effect.Effect<Customer, Error, Database | Logger>;
}

// Good - clean signature
{
  readonly findCustomer: (id: string) => Effect.Effect<Customer, NotFoundError>;
}
```

### Don't Use Promises Directly

```typescript
// Bad
const fetchData = async (url: string) => {
  const response = await fetch(url);
  return response.json();
};

// Good
const fetchData = (url: string) =>
  Effect.tryPromise({
    try: () => fetch(url).then((r) => r.json()),
    catch: (error) => new FetchError({ cause: error }),
  });
```

### Don't Use Generic Error Types

```typescript
// Bad
Effect.Effect<Customer, Error>

// Good
Effect.Effect<Customer, NotFoundError | ValidationError>
```

### Keep Effect.try Targeted

```typescript
// Bad - too wide
Effect.try(() => {
  // Multiple operations that might throw
});

// Good - target specific line
const parsed = yield* Effect.try(() => JSON.parse(input));
```
