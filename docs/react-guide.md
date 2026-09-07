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
// (Sole exception: `ErrorBoundary` in packages/app - error boundaries are
// React's one remaining class-only API.)

// Bad - function declaration
function Button() { ... }
```

### One Component Per File

Export only one component per file, matching the filename. Component files are
flat (no per-component folders); a platform split adds sibling files:

```
packages/app/src/components/
  SpeakerButton.tsx                 # exports SpeakerButton (both platforms)
  ThemeToggle.tsx                   # web half
  ThemeToggle.native.tsx            # native half (Metro picks this)
  QuestionDetailModal.shared.ts     # props interface + pure helpers shared by both halves
website/test/components/
  ThemeToggle.test.tsx              # tests live under the consuming app's test/
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

### React 19 Idioms

This project runs React 19.2 on both platforms. Authority:
`$REFERENCES/react-dev/` (react.dev distilled — esp. chapters 06, 07, 10, 15).

- **`ref` is a normal prop — never `forwardRef`** (deprecated in React 19):

  ```tsx
  const MyInput = ({ ref, ...props }: MyInputProps) => <input ref={ref} {...props} />;
  ```

- **Provide context by rendering the context itself**, not `.Provider`
  (legacy form):

  ```tsx
  <ThemeContext value={contextValue}>{children}</ThemeContext>
  ```

- **`useEffectEvent` for reading latest props/state inside effects.** When an
  effect needs a value but must not re-run when it changes (event callbacks,
  `setTimeout` bodies, subscribe-once listeners), wrap the read in
  `useEffectEvent` instead of mirroring it into a ref or widening the dep
  array. Never suppress `react-hooks/exhaustive-deps` — a suppression is a bug.

  ```tsx
  const onKey = useEffectEvent((event: KeyboardEvent) => handleKey(event, latestState));
  useEffect(() => {
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []); // subscribe once; onKey always sees latest state
  ```

- **`useSyncExternalStore` for browser/external stores** (online status, theme
  class, voice lists) — not `useState` + `useEffect` + listener. Under Next.js
  SSR the third argument (`getServerSnapshot`) is mandatory.

- **Reset child state with `key`, not effects.** `key={question.id}` replaces
  a "reset state when prop changes" `useEffect`.

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

// 3. Workspace packages (website / mobile code)
import { StatsSummary, Trophy } from 'app/components';
import { useThemeContext } from 'app';
// 3b. Website-local absolute paths (shims and web-only files)
import Layout from '@/components/Layout';
import { YStack, Text } from '@/components/tamagui';

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
import { YStack, Text } from './tamagui'; // inside packages/app
// website-local files: import { YStack, Text } from '@/components/tamagui';

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
import { useThemeContext } from 'app'; // shared; website also re-exports it from '@/components/TamaguiProvider'
const { theme, toggleTheme } = useThemeContext(); // 'light' | 'dark'
```

Use it for logic (e.g. the dark-mode checkbox), never for colors — colors come
from theme keys. The context lives in `packages/app/src/ThemeContext.tsx`; the
website's `TamaguiProvider` provides it (and bridges it to next-themes'
`html.t_dark` class), mobile will provide it from its root layout.

**SSR caveat:** anything whose server-rendered output depends on the resolved
theme (e.g. a single theme-dependent icon) hydration-mismatches, and React's
recovery re-render wipes next-themes' class from `<html>`. Render both variants
and toggle with CSS visibility (`ThemeToggle.tsx`), or platform-split so the
state-based render is native-only (`ThemeToggle.native.tsx`).

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

Available from `app/components/tamagui` (source in
`packages/app/src/components/tamagui/`; `@/components/tamagui` on the website
is a re-export shim):

- `Button`, `EditorialButton` (+`ghost` variant), `EditorialInput`,
  `EditorialSelect`, `LoadingSpinner`, `Card`, `Text`, `Heading`, `Paragraph`
- Layout: `Stack`, `XStack`, `YStack`, `ZStack`

### Important Notes

- **Tailwind CSS has been removed** - do not add Tailwind classes
- **Do not add new `var(--...)` references in components** — use theme keys.
  Shared code uses `fontFamily: '$serif'` (platform-split `fonts.ts` /
  `fonts.native.ts`); the only remaining `var(--font-family-serif)` literals
  are in the four unmoved route pages and go away as each screen moves. The
  web-only `InstallPrompt`/`OfflineIndicator` keep their CSS vars.
- Always test both light and dark themes when modifying styles

---

## Cross-Platform Components (`packages/app`)

Everything reusable lives in `packages/app` and renders on both Next.js (web)
and Expo/React Native. The port's history, per-stage gates and lessons are in
`plans/react-native-mobile-app.md` ("Phase 5 — STATUS"). Working rules:

### Platform splits

- `X.tsx` is the web half (also what `tsc` sees — it cannot resolve RN
  platform extensions), `X.native.tsx` the native half, `X.shared.ts` the
  props interface and pure helpers both halves import so they cannot drift.
  Both halves must export the same names.
- Splits are package-internal: reference them only through relative imports
  (or the components barrel). Never add a split file to the package.json
  `exports` map — Metro does not apply `.native` substitution there.
- Prefer one non-split file with an `isWeb` guard when only a style prop or a
  DOM-only attribute differs:

  ```tsx
  import { isWeb } from 'tamagui';
  <Container {...(isWeb ? { minHeight: '50vh' } : { flex: 1 })} />
  <Text {...(isWeb ? { whiteSpace: 'pre-wrap' } : {})} />
  ```

- Web-only browser APIs (`document`, `window`, `navigator.permissions`,
  `localStorage`) either get a native no-op half (`useKeyboardNavigation`) or
  a feature check that degrades (`hasGeolocation()` in `StateSelector`).
- Table/modal UIs keep their raw `<table>` / focus-trap web halves; their
  `.native.tsx` halves are stubs until Phase 6 builds real native lists.
- `Layout` (header/footer/nav) is web-only; screens receive navigation as
  callback props and the mobile route wrappers supply expo-router calls.

### Icons

Import from `app/components` (or `./icons` inside the package). `icons.ts`
re-exports `lucide-react` for web; `icons.native.ts` re-exports the same names
from `@tamagui/lucide-icons` per-icon subpaths. Add new icons to both halves.
Pass colors as resolved theme values: `color={theme.themeError?.get() as string}`.
`lucide-react` must never appear in the native bundle (the `expo export`
sourcemap grep enforces this).

### Pixel parity when converting raw DOM to Tamagui

Block-level Tamagui `Text`/stacks lose the body `16px/1.5` line-height strut
that inline `<span>`/`<svg>` had, so converted sites render ~7px short.
Reproduce the old line box explicitly (`lineHeight={21}`, wrapper `height={29}`
for a 22px icon) and let the visual suite confirm. For UI outside the 20
baselines, render the old (`git show HEAD:...` into a `temp_` file) and new
versions on a throwaway `temp_` page and pixel-diff the screenshots.

### Hooks lint

`packages/app` runs the full `eslint-plugin-react-hooks` recommended set,
including `set-state-in-effect` and `refs` (the website keeps
`set-state-in-effect` off). Consequences:

- Derive, don't sync: `const districts = useMemo(...)`, not an effect that
  calls `setDistricts`.
- Reset child state with `key={...}` at the call site, not a reset effect.
- Latest-callback reads inside subscribe-once effects go through
  `useEffectEvent` (`useKeyboardNavigation`, `QuestionDetailModal`).
- A value needed during render cannot come from a lazily-initialised `useRef`
  (the `refs` rule rejects render reads) — use a lazy `useState` initialiser.
- The css animation driver emits transitions only; keyframe loops need a JS
  clock (see `SpeakerButton`'s `PulsingIcon`).

### Package conventions

- `process.env` must use bracket access (`process.env['NODE_ENV']`) —
  `noPropertyAccessFromIndexSignature` is on; both bundlers still inline it.
- Prettier in `packages/app`: no semicolons, single quotes, no trailing commas,
  100 columns (`npx eslint .` in the package enforces it).
- `app` and `civics2json` have ESM-only `exports` maps; the website's
  `jest.config.ts` maps both straight to their TS source. Any new value import
  of another ESM-only workspace package from website code needs the same
  `moduleNameMapper` entry (type-only imports are elided and won't surface it).

---

## File Structure

```
packages/app/src/
  index.ts                 # root entry: ThemeContext, SharedBadge
  tamagui.config.ts        # tokens + light/dark themes
  fonts.ts / .native.ts    # $serif font (platform split)
  animations.ts / .native.ts
  components/
    index.ts               # barrel (exports subpath app/components)
    icons.ts / .native.ts
    tamagui/               # Button, Card, EditorialInput, LoadingSpinner, Text
    <Component>.tsx        # + .native.tsx / .shared.ts when split
  hooks/                   # useKeyboardNavigation (split), useTextToSpeech, ...
  services/                # Effect services; backends/adapters platform-split
  types/
website/src/
  app/<route>/page.tsx     # Next routes (screens move to packages/app/src/screens/)
  components/              # web-only: Layout, TamaguiProvider, InstallPrompt,
                           # OfflineIndicator, ServiceWorkerRegistration; rest are shims
  hooks/                   # shims + web-only useInstallPrompt, useOnlineStatus
website/test/              # jest for website + shared components it consumes
apps/mobile/app/           # expo-router routes (placeholder until Stage 17)
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
