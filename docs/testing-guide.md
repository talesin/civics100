# Testing Guide

Testing patterns with Effect-TS and Jest.

## Test Structure

Tests are located in `test/` directories with `.test.ts` extension, co-located with the code they test.

```
src/
  services/
    CustomerService.ts
test/
  services/
    CustomerService.test.ts
```

---

## Testing Effect Code

### Basic Pattern

```typescript
import { Effect } from 'effect';

describe('MyFunction', () => {
  it('should return expected result', async () => {
    await Effect.gen(function* () {
      const result = yield* myFunction('input');
      expect(result).toEqual({ expected: 'value' });
    }).pipe(Effect.runPromise);
  });
});
```

### Testing with Services

```typescript
it('should process data', async () => {
  // Create test layer with mocked dependencies
  const testLayer = TestServiceLayer({
    getData: () => Effect.succeed(['item1', 'item2']),
  });

  await Effect.gen(function* () {
    const service = yield* MyService;
    const result = yield* service.processData('id');
    expect(result).toEqual(['item1', 'item2']);
  }).pipe(
    Effect.provide(testLayer),
    Effect.runPromise
  );
});
```

---

## Test Layer Pattern

Create test layers for each service to enable mocking:

### Service Definition

```typescript
export class CustomerService extends Effect.Service<CustomerService>()(
  "project/CustomerService",
  {
    effect: Effect.gen(function* () {
      const db = yield* Database;
      return {
        findCustomer: findCustomer(db),
        saveCustomer: saveCustomer(db),
      };
    }),
  }
) {}
```

### Test Layer

```typescript
export const TestCustomerServiceLayer = (overrides?: {
  findCustomer?: CustomerService["findCustomer"];
  saveCustomer?: CustomerService["saveCustomer"];
}) =>
  Layer.succeed(
    CustomerService,
    CustomerService.of({
      _tag: "CustomerService",
      findCustomer: overrides?.findCustomer ?? (() =>
        Effect.succeed({ id: 'test', name: 'Test Customer' })
      ),
      saveCustomer: overrides?.saveCustomer ?? (() =>
        Effect.succeed(undefined)
      ),
    })
  );
```

### Using Test Layers

```typescript
describe('OrderService', () => {
  it('should create order for valid customer', async () => {
    const customerLayer = TestCustomerServiceLayer({
      findCustomer: (id) => Effect.succeed({
        id,
        name: 'John',
        email: 'john@example.com',
      }),
    });

    const orderLayer = TestOrderServiceLayer();

    await Effect.gen(function* () {
      const orderService = yield* OrderService;
      const result = yield* orderService.createOrder('customer-123', items);
      expect(result.customerId).toBe('customer-123');
    }).pipe(
      Effect.provide(Layer.merge(customerLayer, orderLayer)),
      Effect.runPromise
    );
  });
});
```

---

## Testing Functions in Isolation

Test curried functions directly by passing mock dependencies:

```typescript
// Function under test
export const processOrder = (db: Database, email: EmailService) =>
  Effect.fn(function* (orderId: string) {
    const order = yield* db.findOrder(orderId);
    yield* email.sendConfirmation(order.customerEmail);
    return order;
  });

// Test
describe('processOrder', () => {
  it('should send confirmation email', async () => {
    const emailsSent: string[] = [];

    // Mock dependencies
    const mockDb = {
      findOrder: (id: string) => Effect.succeed({
        id,
        customerEmail: 'test@example.com',
      }),
    };

    const mockEmail = {
      sendConfirmation: (email: string) => {
        emailsSent.push(email);
        return Effect.succeed(undefined);
      },
    };

    await Effect.gen(function* () {
      yield* processOrder(mockDb, mockEmail)('order-123');
      expect(emailsSent).toContain('test@example.com');
    }).pipe(Effect.runPromise);
  });
});
```

---

## Testing Error Handling

### Testing Expected Errors

```typescript
it('should fail with NotFoundError when customer not found', async () => {
  const testLayer = TestCustomerServiceLayer({
    findCustomer: () => Effect.fail(new NotFoundError({
      resource: 'Customer',
      id: 'missing',
    })),
  });

  const result = await Effect.gen(function* () {
    const service = yield* CustomerService;
    return yield* service.findCustomer('missing');
  }).pipe(
    Effect.provide(testLayer),
    Effect.either,
    Effect.runPromise
  );

  expect(Either.isLeft(result)).toBe(true);
  if (Either.isLeft(result)) {
    expect(result.left._tag).toBe('NotFoundError');
  }
});
```

### Testing Error Recovery

```typescript
it('should use fallback when primary fails', async () => {
  const testLayer = TestCustomerServiceLayer({
    findCustomer: () => Effect.fail(new NotFoundError({
      resource: 'Customer',
      id: 'test',
    })),
  });

  await Effect.gen(function* () {
    const service = yield* CustomerService;
    const result = yield* service.findCustomer('test').pipe(
      Effect.catchTag('NotFoundError', () =>
        Effect.succeed({ id: 'default', name: 'Default Customer' })
      )
    );
    expect(result.id).toBe('default');
  }).pipe(
    Effect.provide(testLayer),
    Effect.runPromise
  );
});
```

---

## Testing with Effect.either

Use `Effect.either` to assert on both success and failure:

```typescript
it('should return Left for invalid input', async () => {
  const result = await validateEmail('not-an-email').pipe(
    Effect.either,
    Effect.runPromise
  );

  expect(Either.isLeft(result)).toBe(true);
});

it('should return Right for valid input', async () => {
  const result = await validateEmail('user@example.com').pipe(
    Effect.either,
    Effect.runPromise
  );

  expect(Either.isRight(result)).toBe(true);
  if (Either.isRight(result)) {
    expect(result.right.value).toBe('user@example.com');
  }
});
```

---

## Testing Async Operations

```typescript
it('should fetch and parse data', async () => {
  const mockHttpLayer = Layer.succeed(
    HttpClient.HttpClient,
    {
      get: (url: string) => Effect.succeed({
        text: Effect.succeed('{"data": "test"}'),
      }),
    } as HttpClient.HttpClient
  );

  await Effect.gen(function* () {
    const httpClient = yield* HttpClient.HttpClient;
    const result = yield* fetchData(httpClient)('https://api.example.com');
    expect(result.data).toBe('test');
  }).pipe(
    Effect.provide(mockHttpLayer),
    Effect.runPromise
  );
});
```

---

## Testing Schema Validation

```typescript
import { Schema } from 'effect';

describe('CustomerResponse schema', () => {
  it('should decode valid JSON', async () => {
    const input = {
      id: '123',
      name: 'John',
      email: 'john@example.com',
    };

    const result = await Schema.decodeUnknown(CustomerResponse)(input).pipe(
      Effect.either,
      Effect.runPromise
    );

    expect(Either.isRight(result)).toBe(true);
  });

  it('should fail for missing required field', async () => {
    const input = {
      id: '123',
      name: 'John',
      // missing email
    };

    const result = await Schema.decodeUnknown(CustomerResponse)(input).pipe(
      Effect.either,
      Effect.runPromise
    );

    expect(Either.isLeft(result)).toBe(true);
  });
});
```

---

## Best Practices

### Test One Thing

Each test should verify one behavior:

```typescript
// Good - focused tests
it('should find existing customer', async () => { ... });
it('should fail when customer not found', async () => { ... });
it('should validate email format', async () => { ... });

// Bad - multiple behaviors
it('should find customer and validate email and save changes', async () => { ... });
```

### Descriptive Test Names

```typescript
// Good
describe('OrderService.createOrder', () => {
  it('should create order with valid items', () => { ... });
  it('should fail with EmptyCartError when no items', () => { ... });
  it('should fail with NotFoundError when customer not found', () => { ... });
});

// Bad
describe('OrderService', () => {
  it('works', () => { ... });
  it('test 1', () => { ... });
});
```

### Arrange-Act-Assert

```typescript
it('should calculate total with discount', async () => {
  // Arrange
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 },
  ];
  const discount = 0.1;

  // Act
  const result = await calculateTotal(items, discount).pipe(
    Effect.runPromise
  );

  // Assert
  expect(result).toBe(225); // (200 + 50) * 0.9
});
```

---

## Test Configuration

Jest configuration for Effect-TS:

```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  "testMatch": ["**/test/**/*.test.ts"]
}
```
