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

This project uses Tamagui for styling with theme-aware patterns.

### Theme Context

```tsx
import { useThemeContext } from '@/context/ThemeContext';

export const Card = ({ children }: Props) => {
  const { theme } = useThemeContext();
  const colors = themeColors[theme];

  return (
    <div style={{ backgroundColor: colors.cardBg, color: colors.text }}>
      {children}
    </div>
  );
};
```

### Theme Color Maps

Define color maps for light/dark themes:

```tsx
const themeColors = {
  light: {
    text: '#111827',
    cardBg: '#ffffff',
    border: '#e5e7eb',
    primary: '#3b82f6',
  },
  dark: {
    text: '#ffffff',
    cardBg: '#1f2937',
    border: '#374151',
    primary: '#60a5fa',
  },
};
```

### CSS Classes (design-tokens.css)

Available utility classes:

| Class                                       | Purpose              |
| ------------------------------------------- | -------------------- |
| `card`, `card-elevated`, `card-interactive` | Card styling         |
| `btn-primary`, `btn-secondary`              | Button variants      |
| `btn-success`, `btn-error`                  | Status buttons       |
| `focus-ring`                                | Focus state styling  |
| `animate-fade-in`, `animate-bounce-in`      | Animations           |
| `text-gradient`, `text-balance`             | Text utilities       |
| `hidden`, `md:flex`, `md:hidden`            | Responsive utilities |

### Tamagui Components

Available in `/src/components/tamagui/`:

- `Button`, `Card`, `Text`, `Heading`, `Paragraph`
- Layout: `Stack`, `XStack`, `YStack`, `ZStack`

### Important Notes

- **Tailwind CSS has been removed** - do not add Tailwind classes
- Use design tokens from CSS variables when possible
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
