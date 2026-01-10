# Type-Driven Design

Design types so that invalid states cannot be constructed.

## Core Maxim

> **"Make Illegal States Unrepresentable"**

Design your types so that invalid combinations cannot be constructed at compile time.

---

## Discriminated Unions

Use discriminated unions with `_tag` instead of boolean flags or optional properties.

### Boolean Flags Allow Invalid States

```typescript
// Bad - allows invalid combinations
type ApiState = {
  isLoading: boolean;
  error?: string;
  data?: User;
};

// These are all "valid" but nonsensical:
// { isLoading: true, error: "oops", data: someUser }
// { isLoading: false, error: undefined, data: undefined }
```

### Discriminated Unions Prevent Invalid States

```typescript
// Good - each state is explicit and complete
type ApiState<T> =
  | { readonly _tag: 'Idle' }
  | { readonly _tag: 'Loading' }
  | { readonly _tag: 'Error'; readonly error: string }
  | { readonly _tag: 'Success'; readonly data: T };

// Only valid combinations possible:
const loading: ApiState<User> = { _tag: 'Loading' };
const success: ApiState<User> = { _tag: 'Success', data: user };
```

### State Machines

Model business processes as explicit states:

```typescript
type Order =
  | { readonly _tag: 'Draft'; readonly items: readonly Item[] }
  | { readonly _tag: 'Submitted'; readonly items: readonly Item[]; readonly submittedAt: Date }
  | { readonly _tag: 'Paid'; readonly items: readonly Item[]; readonly payment: PaymentInfo }
  | { readonly _tag: 'Shipped'; readonly items: readonly Item[]; readonly tracking: string }
  | { readonly _tag: 'Delivered'; readonly items: readonly Item[]; readonly deliveredAt: Date };

// Functions work on specific states
const ship = (order: Extract<Order, { _tag: 'Paid' }>): Extract<Order, { _tag: 'Shipped' }> => ({
  _tag: 'Shipped',
  items: order.items,
  tracking: generateTracking(),
});
```

---

## Branded Types

Prevent mixing up primitive types that represent different domain concepts.

### Problem: Primitive Obsession

```typescript
// Bad - easy to mix up parameters
const createOrder = (customerId: string, productId: string, quantity: number) => { ... };

// Oops - wrong order
createOrder(productId, customerId, 5);  // Compiles but wrong!
```

### Solution: Tagged/Branded Types

```typescript
// Define branded types
type CustomerId = { readonly _tag: 'CustomerId'; readonly value: string };
type ProductId = { readonly _tag: 'ProductId'; readonly value: string };
type Quantity = { readonly _tag: 'Quantity'; readonly value: number };

// Constructors
const CustomerId = (value: string): CustomerId => ({ _tag: 'CustomerId', value });
const ProductId = (value: string): ProductId => ({ _tag: 'ProductId', value });
const Quantity = (value: number): Quantity => ({ _tag: 'Quantity', value });

// Now type-safe
const createOrder = (customerId: CustomerId, productId: ProductId, quantity: Quantity) => { ... };

// Compile error - wrong types
createOrder(ProductId("abc"), CustomerId("123"), Quantity(5));  // Error!
```

### Using Data.tagged

```typescript
import { Data } from 'effect';

type EmailAddress = {
  readonly _tag: 'EmailAddress';
  readonly value: string;
};

const EmailAddress = Data.tagged<EmailAddress>('EmailAddress');

const email = EmailAddress({ value: 'user@example.com' });
```

---

## Smart Constructors

Validate data at construction time to ensure only valid instances exist.

### Basic Pattern

```typescript
import { Effect, Data } from 'effect';

class InvalidEmailError extends Data.TaggedError("InvalidEmailError")<{
  readonly input: string;
}> {}

type EmailAddress = {
  readonly _tag: 'EmailAddress';
  readonly value: string;
};

const EmailAddress = {
  create: (input: string): Effect.Effect<EmailAddress, InvalidEmailError> => {
    if (input.length === 0) {
      return Effect.fail(new InvalidEmailError({ input }));
    }
    if (!input.includes('@')) {
      return Effect.fail(new InvalidEmailError({ input }));
    }
    return Effect.succeed({ _tag: 'EmailAddress', value: input });
  },

  // Unsafe constructor for trusted data (e.g., from database)
  unsafeFrom: (value: string): EmailAddress => ({ _tag: 'EmailAddress', value }),
};

// Usage
const email = yield* EmailAddress.create(userInput);
```

### Constrained Types

```typescript
class StringTooLongError extends Data.TaggedError("StringTooLongError")<{
  readonly maxLength: number;
  readonly actualLength: number;
}> {}

type String50 = {
  readonly _tag: 'String50';
  readonly value: string;
};

const String50 = {
  create: (input: string): Effect.Effect<String50, StringTooLongError> => {
    if (input.length > 50) {
      return Effect.fail(new StringTooLongError({
        maxLength: 50,
        actualLength: input.length,
      }));
    }
    return Effect.succeed({ _tag: 'String50', value: input });
  },
};

// Domain types use constrained types
type Customer = {
  readonly name: String50;
  readonly email: EmailAddress;
};
```

---

## Exhaustive Pattern Matching

Handle all cases explicitly and let the compiler verify completeness.

### The `never` Trick

```typescript
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered';

const getStatusMessage = (status: OrderStatus): string => {
  switch (status) {
    case 'pending':
      return 'Order is pending';
    case 'processing':
      return 'Order is being processed';
    case 'shipped':
      return 'Order has been shipped';
    case 'delivered':
      return 'Order was delivered';
    default: {
      // If you miss a case, TypeScript error here
      const exhaustive: never = status;
      return exhaustive;
    }
  }
};
```

### With Discriminated Unions

```typescript
type Result<T, E> =
  | { readonly _tag: 'Ok'; readonly value: T }
  | { readonly _tag: 'Error'; readonly error: E };

const handle = <T, E>(result: Result<T, E>): string => {
  switch (result._tag) {
    case 'Ok':
      return `Success: ${result.value}`;
    case 'Error':
      return `Error: ${result.error}`;
    default: {
      const exhaustive: never = result;
      return exhaustive;
    }
  }
};
```

---

## Option Instead of Null

Use `Option<T>` or explicit `undefined` instead of `null`.

```typescript
import { Option } from 'effect';

// Instead of
const findUser = (id: string): User | null => { ... };

// Use Option
const findUser = (id: string): Option.Option<User> => { ... };

// Or explicit undefined
const findUser = (id: string): User | undefined => { ... };

// Handle with pattern matching
const userName = Option.match(findUser(id), {
  onNone: () => 'Unknown',
  onSome: (user) => user.name,
});
```

---

## Anti-Patterns

### Primitive Obsession

```typescript
// Bad
const createCustomer = (id: number, name: string, email: string) => { ... };

// Good
const createCustomer = (id: CustomerId, name: CustomerName, email: EmailAddress) => { ... };
```

### Incomplete Type Modeling

```typescript
// Bad - status as string allows any value
type Order = {
  status: string;
};

// Good - explicit states
type Order = {
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
};
```

### Optional Properties Everywhere

```typescript
// Bad - unclear which combinations are valid
type User = {
  id: string;
  email?: string;
  phoneNumber?: string;
  verifiedEmail?: boolean;
  verifiedPhone?: boolean;
};

// Good - explicit states
type User =
  | { readonly _tag: 'Unverified'; readonly id: string; readonly email: string }
  | { readonly _tag: 'EmailVerified'; readonly id: string; readonly email: string }
  | { readonly _tag: 'FullyVerified'; readonly id: string; readonly email: string; readonly phone: string };
```

### Catch-All Without Exhaustiveness

```typescript
// Bad - silently ignores new cases
const process = (status: Status) => {
  if (status === 'pending') { ... }
  else { ... }  // What if new status added?
};

// Good - compiler catches missing cases
const process = (status: Status) => {
  switch (status) {
    case 'pending': ...
    case 'processing': ...
    default: {
      const exhaustive: never = status;
      throw new Error(`Unhandled status: ${exhaustive}`);
    }
  }
};
```

---

## Summary

| Principle                           | Implementation                           |
| ----------------------------------- | ---------------------------------------- |
| Make illegal states unrepresentable | Discriminated unions with `_tag`         |
| Prevent primitive obsession         | Branded/tagged types                     |
| Validate at boundaries              | Smart constructors returning Effect      |
| Handle all cases                    | Exhaustive pattern matching with `never` |
| Avoid null                          | Use `Option<T>` or explicit `undefined`  |
| Model domain concepts               | Use domain vocabulary in type names      |
