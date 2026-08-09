# React Guide

React patterns and Tamagui styling for this project.

## Component Structure

### Function Components Only

Always use function components with arrow functions:

```tsx
// Good
export const Button = () => {
  return <button>Click me</button>;
};

// Bad - class components
class Button extends React.Component { ... }

// Bad - function declaration
function Button() { ... }
```

### One Component Per File

Export only one component per file, matching the filename:

```
components/
  Button/
    Button.tsx        # exports Button
    Button.test.tsx   # tests for Button
```

---

## Props and Types

### Always Define Props

Define a Props type or interface, even if empty:

```tsx
interface ButtonProps {
  readonly label: string;
  readonly onClick: () => void;
  readonly disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, disabled }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
```

### Use Interface for Props

Use `interface` for component props (exception to the general "prefer type" rule):

```tsx
interface CardProps {
  readonly title: string;
  readonly children: React.ReactNode;
}
```

---

## Hooks

### Never Call Hooks Conditionally

```tsx
// Bad
if (someCondition) {
  const [value, setValue] = useState(0);
}

// Good
const [value, setValue] = useState(0);
if (someCondition) {
  // use value
}
```

### Extract Complex Logic

Extract complex `useEffect` logic into custom hooks:

```tsx
// Custom hook
const useCustomerData = (customerId: string) => {
  const [customer, setCustomer] = useState<Customer | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomer(customerId)
      .then(setCustomer)
      .finally(() => setLoading(false));
  }, [customerId]);

  return { customer, loading };
};

// Component
export const CustomerCard = ({ customerId }: Props) => {
  const { customer, loading } = useCustomerData(customerId);
  // ...
};
```

### Prefer useReducer for Complex State

```tsx
type State =
  | { _tag: 'Idle' }
  | { _tag: 'Loading' }
  | { _tag: 'Error'; error: string }
  | { _tag: 'Success'; data: Customer };

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; data: Customer }
  | { type: 'FETCH_ERROR'; error: string };

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'FETCH_START':
      return { _tag: 'Loading' };
    case 'FETCH_SUCCESS':
      return { _tag: 'Success', data: action.data };
    case 'FETCH_ERROR':
      return { _tag: 'Error', error: action.error };
  }
};

const [state, dispatch] = useReducer(reducer, { _tag: 'Idle' });
```

---

## Naming

### PascalCase for Components

```tsx
// Good
export const UserCard = () => { ... };
export const SignInForm = () => { ... };
export const NavigationBar = () => { ... };

// Bad - abbreviated
export const Uc = () => { ... };
export const SiF = () => { ... };
export const NavBar = () => { ... };  // Prefer full word
```

---

## Imports

Group and alphabetize:

```tsx
// 1. React and built-ins
import React, { useState, useEffect } from 'react';

// 2. Third-party
import { useRouter } from 'next/router';

// 3. Internal (absolute paths)
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

// 4. Relative
import { formatName } from './utils';
import type { CustomerProps } from './types';
```

---

## Tamagui Styling

Styling comes from Tamagui theme keys (defined in `packages/app/src/tamagui.config.ts`),
not CSS variables. Components are `styled()` definitions or use theme-resolving props.

### Styled components (preferred)

```tsx
import { styled } from 'tamagui';
import { YStack, Text } from '@/components/tamagui';

const InfoBox = styled(YStack, {
  backgroundColor: '$backgroundHover',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '$editorialRule',
  borderRadius: 6,
});

const Label = styled(Text, {
  fontSize: 14,
  color: '$editorialMuted',
});
```

### Theme values for native elements and props

When a value must go to a raw DOM element, SVG, or a prop (e.g. lucide `color=`),
resolve it with `useTheme()` — under the css driver `.get()` returns a CSS
variable reference, so it is SSR-safe and theme-reactive:

```tsx
import { useTheme } from 'tamagui';

const theme = useTheme();
const muted = theme.editorialMuted?.get() as string;
// <TrendingUp color={muted} />  or  style={{ color: muted }}
```

### Theme keys

- Editorial palette: `$editorialInk`, `$editorialPaper`, `$editorialRule`,
  `$editorialMuted`, `$editorialAccent`, `$editorialAccentSubtle`
- Parity keys (match the retired `--theme-*` values): `$themeError(+Bg/Text)`,
  `$themeSuccess(+Bg/Text)`, `$themeWarning(+Bg/Text)`, `$themePrimary`,
  `$themePurple`, `$themeCardBg`, `$neutral100`, `$shadowMd`
- NOTE: the pre-existing `$error`/`$success`/`$warning`/`$primary` keys have
  DIFFERENT values than the `theme*` parity keys — do not mix them up.

### Theme context (state only)

```tsx
import { useThemeContext } from '@/components/TamaguiProvider';
const { theme, toggleTheme } = useThemeContext(); // 'light' | 'dark'
```

Use it for logic (e.g. the dark-mode checkbox), never for colors — colors come
from theme keys.

### Remaining CSS classes (web-only)

| Class                                       | Purpose                                  |
| ------------------------------------------- | ---------------------------------------- |
| `card`, `card-elevated`, `card-interactive` | Card styling                             |
| `btn-primary`, `btn-secondary`              | Button variants                          |
| `btn-success`, `btn-error`                  | Status buttons                           |
| `focus-ring`                                | Focus state styling                      |
| `stats-strip`, `stats-strip-cell`           | Statistics grid (480/768px breakpoints)  |
| `hidden`, `md:flex`, `md:hidden`            | Responsive utilities                     |

`.btn-editorial*`, `.input-editorial`, `.badge*`, `.answer-btn*`,
`.accuracy-*/.prob-*`, `.spinner` and `.animate-*` were replaced by Tamagui
components in Phase 4 — do not reintroduce them.

### Tamagui Components

Available in `/src/components/tamagui/`:

- `Button`, `EditorialButton` (+`ghost` variant), `EditorialInput`,
  `EditorialSelect`, `LoadingSpinner`, `Card`, `Text`, `Heading`, `Paragraph`
- Layout: `Stack`, `XStack`, `YStack`, `ZStack`

### Important Notes

- **Tailwind CSS has been removed** - do not add Tailwind classes
- **Do not add new `var(--...)` references in components** — use theme keys;
  the only sanctioned exceptions are `var(--font-family-serif)` (until Phase 5
  wires `createFont`) and the web-only `InstallPrompt`/`OfflineIndicator`
- Always test both light and dark themes when modifying styles

---

## File Structure

```
components/
  Button/
    Button.tsx          # Component
    Button.test.tsx     # Tests
    Button.module.css   # Styles (if needed)
  Card/
    Card.tsx
    Card.test.tsx
```

---

## Testing Components

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders label', () => {
    render(<Button label="Click me" onClick={() => {}} />);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button label="Click me" onClick={onClick} />);
    fireEvent.click(screen.getByText('Click me'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

---

## AI-Specific Notes

Add comments to non-trivial logic:

```tsx
// AI: DO NOT MODIFY - Critical authentication flow
const handleAuth = () => { ... };
```

Add file summaries for complex components:

```tsx
// Renders a customer order summary with real-time updates.
// Connects to the order WebSocket for live status changes.
// Used on the order confirmation and tracking pages.
```
