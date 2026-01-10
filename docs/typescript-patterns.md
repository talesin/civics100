# TypeScript Patterns

TypeScript-specific coding patterns and conventions for this project.

## Type vs Interface

Prefer `type` over `interface` unless there's existing precedent in the codebase.

```typescript
// Preferred
type Customer = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
};

// Use interface only when extending or for specific patterns
interface Repository<T> {
  find(id: string): Effect.Effect<T, NotFoundError>;
  save(entity: T): Effect.Effect<void>;
}
```

## Avoiding `any`

Never use `any`. Prefer `unknown` for truly unknown values, or be explicit about types.

```typescript
// Bad
const parseData = (data: any) => { ... };

// Good - when type is truly unknown
const parseData = (data: unknown) => {
  // Validate and narrow type before use
};

// Better - when you know the shape
const parseData = (data: RawDataInput) => { ... };
```

## Null Handling

### Prefer `undefined` Over `null`

```typescript
// Bad
const findUser = (id: string): User | null => { ... };

// Good
const findUser = (id: string): User | undefined => { ... };

// Better - use Option or Effect for explicit handling
const findUser = (id: string): Option<User> => { ... };
```

### Use Nullish Coalescing

Use `??` instead of `||` for null/undefined checks.

```typescript
// Bad - treats 0, '', false as "missing"
const port = config.port || 3000;

// Good - only replaces null/undefined
const port = config.port ?? 3000;
```

## Boolean Expressions

Do not use implicit boolean expressions. Be explicit about conditions.

```typescript
// Bad - relies on truthiness
if (user.email) { ... }
if (items.length) { ... }

// Good - explicit conditions
if (user.email !== undefined) { ... }
if (items.length > 0) { ... }
```

## Readonly by Default

Mark data as readonly to signal immutability intent.

```typescript
type Customer = {
  readonly id: string;
  readonly name: string;
  readonly orders: readonly Order[];
};

// For function parameters
const processItems = (items: readonly Item[]) => { ... };
```

## Literal Types and Unions

Use literal types for finite sets of values.

```typescript
// Bad
type Status = string;

// Good
type Status = 'pending' | 'processing' | 'shipped' | 'delivered';

// With discriminated unions
type OrderState =
  | { readonly _tag: 'Pending' }
  | { readonly _tag: 'Processing'; startedAt: Date }
  | { readonly _tag: 'Shipped'; trackingNumber: string }
  | { readonly _tag: 'Delivered'; deliveredAt: Date };
```

## Strict Configuration

This project uses strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "moduleResolution": "bundler",
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Import Organization

Group imports by type and alphabetize within groups:

```typescript
// 1. Built-in/Node modules
import * as fs from 'fs';
import * as path from 'path';

// 2. Third-party libraries
import { Effect, Layer } from 'effect';
import { HttpClient } from '@effect/platform';

// 3. Internal modules (absolute paths)
import { CustomerService } from '@/services/CustomerService';
import { validateEmail } from '@/validation/email';

// 4. Relative imports (same package)
import { processOrder } from './orderUtils';
import type { OrderInput } from './types';
```

## Type-Only Imports

Use type-only imports when importing only types:

```typescript
import type { Customer, Order } from './types';
import { processCustomer } from './customerService';
```

## Generic Constraints

Be specific with generic constraints:

```typescript
// Too broad
const processItems = <T>(items: T[]) => { ... };

// Better - constrain to what's needed
const processItems = <T extends { id: string }>(items: T[]) => { ... };
```

## Anti-Patterns

| Anti-Pattern            | Problem                | Solution                        |
| ----------------------- | ---------------------- | ------------------------------- |
| `any` type              | Loses type safety      | Use `unknown` or specific types |
| `as` type assertions    | Bypasses type checking | Use type guards or refinement   |
| `!` non-null assertion  | Hides potential nulls  | Handle null explicitly          |
| `// @ts-ignore`         | Silences real errors   | Fix the underlying issue        |
| Optional chaining abuse | `a?.b?.c?.d`           | Restructure data or use Option  |
