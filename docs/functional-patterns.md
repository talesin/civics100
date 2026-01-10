# Functional Patterns

Functional programming patterns adapted for TypeScript with Effect-TS.

## Table of Contents

- [Railway-Oriented Programming](#railway-oriented-programming)
- [Core Operations: Map, Bind, Apply](#core-operations-map-bind-apply)
- [Function Composition](#function-composition)
- [Immutability Patterns](#immutability-patterns)
- [Functional Architecture](#functional-architecture)

---

## Railway-Oriented Programming

Treats computation as a railway with two tracks: **success** and **failure**. Functions either continue on the success track or switch to the failure track.

### When to Use ROP

| Use ROP                  | Don't Use ROP                      |
| ------------------------ | ---------------------------------- |
| Expected domain errors   | System exceptions (file not found) |
| Validation pipelines     | When stack traces are essential    |
| Business rule violations | Performance-critical hot paths     |
| User input validation    | When error details don't matter    |

### Basic Pipeline

```typescript
import { Effect, pipe } from 'effect';

// Each step can succeed or fail
const processOrder = (input: OrderInput) =>
  pipe(
    validateOrder(input),           // May fail with ValidationError
    Effect.flatMap(checkInventory), // May fail with InventoryError
    Effect.flatMap(processPayment), // May fail with PaymentError
    Effect.flatMap(createShipment), // May fail with ShippingError
  );

// Or with generator syntax (preferred for readability)
const processOrder = Effect.gen(function* () {
  const validated = yield* validateOrder(input);
  const inventory = yield* checkInventory(validated);
  const payment = yield* processPayment(inventory);
  const shipment = yield* createShipment(payment);
  return shipment;
});
```

### Error Recovery Points

```typescript
const processWithFallback = Effect.gen(function* () {
  const result = yield* primaryService.fetch(id).pipe(
    Effect.catchTag("NotFoundError", () =>
      fallbackService.fetch(id)
    ),
    Effect.catchTag("TimeoutError", () =>
      cachedService.get(id)
    ),
  );
  return result;
});
```

---

## Core Operations: Map, Bind, Apply

Understanding when to use each operation.

### Map (Transform Values)

Use when transforming a value inside a container without changing the container structure.

```typescript
// Signature: (A => B) => Effect<A> => Effect<B>

// Transform success value
const doubled = Effect.map(getValue(), (x) => x * 2);

// In pipeline
const result = yield* fetchUser(id).pipe(
  Effect.map((user) => user.name),
);
```

### Bind / FlatMap (Chain Operations)

Use when each operation depends on the result of the previous one, and each can fail independently.

```typescript
// Signature: (A => Effect<B>) => Effect<A> => Effect<B>

// Chain dependent operations
const result = yield* findCustomer(id).pipe(
  Effect.flatMap((customer) => findOrders(customer.id)),
  Effect.flatMap((orders) => calculateTotal(orders)),
);

// Each step can fail - failure stops the chain
```

### Apply (Combine Independent Effects)

Use when combining multiple independent effects, especially for validation with error accumulation.

```typescript
// Combine independent validations
const validatePerson = (input: PersonInput) =>
  Effect.all({
    name: validateName(input.name),
    email: validateEmail(input.email),
    age: validateAge(input.age),
  });

// All validations run, errors can be accumulated
```

### Decision Matrix

| Situation                   | Use                     | Reason                                 |
| --------------------------- | ----------------------- | -------------------------------------- |
| Transform success value     | `map`                   | Simple transformation                  |
| Chain dependent operations  | `flatMap` / generator   | Each step needs previous result        |
| Combine independent effects | `Effect.all`            | Parallel execution, error accumulation |
| Handle failure and continue | `catchTag` / `catchAll` | Recovery paths                         |

---

## Function Composition

Build complex behavior by composing simple functions.

### Currying: Config First, Data Last

Design functions for partial application:

```typescript
// Configuration parameters first
const validateWith = (rules: ValidationRules) =>
  (data: unknown) =>
    // validation logic

// Data parameters last - enables piping
const validateEmail = validateWith(emailRules);
const validateAge = validateWith(ageRules);

// Use in pipelines
const result = yield* pipe(
  input,
  validateEmail,
  Effect.flatMap(validateAge),
);
```

### Partial Application Over Lambdas

```typescript
// Prefer partial application
const addTax = (rate: number) => (price: number) => price * (1 + rate);
const addVAT = addTax(0.2);
const prices = items.map(addVAT);

// Over inline lambdas
const prices = items.map((item) => item * 1.2);
```

### Named Steps for Complex Pipelines

```typescript
// Bad - too many chained operations
const result = validate >> transform >> filter >> map >> sort >> aggregate >> format;

// Good - named intermediate steps
const processData = Effect.gen(function* () {
  const validated = yield* validateInput(input);
  const transformed = yield* transformData(validated);
  const filtered = filterInvalid(transformed);
  const sorted = sortByPriority(filtered);
  return formatOutput(sorted);
});
```

---

## Immutability Patterns

Prefer immutable data and compute new states from old.

### Copy-on-Write Updates

```typescript
// Record updates
type Customer = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly address: Address;
};

const updateEmail = (customer: Customer, newEmail: string): Customer => ({
  ...customer,
  email: newEmail,
});

// Nested updates
const updateStreet = (customer: Customer, newStreet: string): Customer => ({
  ...customer,
  address: {
    ...customer.address,
    street: newStreet,
  },
});
```

### Avoid Mutable State

```typescript
// Bad - mutation
let total = 0;
for (const item of items) {
  total += item.price;
}

// Good - reduction
const total = items.reduce((sum, item) => sum + item.price, 0);

// Or with Effect
const total = items.reduce(
  (acc, item) => acc + item.price,
  0
);
```

### Recursive Patterns with Accumulators

```typescript
// Tail-recursive pattern
const sumList = (items: number[]): number => {
  const loop = (remaining: number[], acc: number): number => {
    if (remaining.length === 0) return acc;
    const [head, ...tail] = remaining;
    return loop(tail, acc + head);
  };
  return loop(items, 0);
};

// Or use built-in (often more optimized)
const total = items.reduce((a, b) => a + b, 0);
```

---

## Functional Architecture

Structure applications with pure business logic at center, I/O at boundaries.

### Pure Core, Impure Shell

```typescript
// Pure domain functions - easy to test
module Domain {
  export const calculateTotal = (items: readonly Item[]): Money =>
    items.reduce((sum, item) => sum + item.price, Money(0));

  export const applyDiscount = (total: Money, discount: Discount): Money =>
    total * (1 - discount.rate);

  export const validateOrder = (order: Order): ValidationResult =>
    // Pure validation logic
}

// Impure shell - I/O operations
module OrderService {
  export const processOrder = (
    saveOrder: (order: Order) => Effect.Effect<void, DbError>,
    sendEmail: (email: Email) => Effect.Effect<void, EmailError>,
  ) => (order: Order) =>
    Effect.gen(function* () {
      const validated = Domain.validateOrder(order);
      if (!validated.isValid) {
        return yield* Effect.fail(new ValidationError(validated.errors));
      }
      const total = Domain.calculateTotal(order.items);
      yield* saveOrder({ ...order, total });
      yield* sendEmail(createConfirmation(order));
    });
}
```

### Dependency Injection via Function Parameters

```typescript
// Functions declare what capabilities they need
const processWorkflow = (
  validateCustomer: (id: string) => Effect.Effect<Customer, NotFoundError>,
  saveOrder: (order: Order) => Effect.Effect<void, DbError>,
  sendEmail: (email: string, order: Order) => Effect.Effect<void, EmailError>,
) => (order: Order) =>
  Effect.gen(function* () {
    const customer = yield* validateCustomer(order.customerId);
    yield* saveOrder(order);
    yield* sendEmail(customer.email, order);
  });

// Wire up at composition root
const main = () => {
  const processor = processWorkflow(
    Database.validateCustomer,
    Database.saveOrder,
    Email.sendConfirmation,
  );
  // Use processor...
};
```

### Separation of Concerns

| Layer          | Responsibility | Characteristics                  |
| -------------- | -------------- | -------------------------------- |
| Domain         | Business logic | Pure functions, no dependencies  |
| Application    | Orchestration  | Composes domain + infrastructure |
| Infrastructure | I/O operations | Database, HTTP, file system      |

```typescript
// Domain - pure
const calculateShipping = (weight: number, distance: number): Money => { ... };

// Application - orchestrates
const processShipment = (db: Database, shipping: ShippingService) =>
  Effect.fn(function* (orderId: string) {
    const order = yield* db.findOrder(orderId);
    const cost = calculateShipping(order.weight, order.distance);
    yield* shipping.createLabel(order, cost);
  });

// Infrastructure - I/O
const ShippingServiceLive = Layer.effect(ShippingService, ...);
```
