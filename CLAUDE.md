# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Quick Reference

| Task               | Guide                                                                              |
| ------------------ | ---------------------------------------------------------------------------------- |
| Coding standards   | [docs/index.md](./docs/index.md)                                                   |
| Effect-TS patterns | [docs/effect-ts-guide.md](./docs/effect-ts-guide.md)                               |
| Error handling     | [docs/effect-ts-guide.md#error-handling](./docs/effect-ts-guide.md#error-handling) |
| Type design        | [docs/type-design.md](./docs/type-design.md)                                       |
| Testing            | [docs/testing-guide.md](./docs/testing-guide.md)                                   |
| React/Tamagui      | [docs/react-guide.md](./docs/react-guide.md)                                       |
| OpenAI integration | [docs/openai-guide.md](./docs/openai-guide.md)                                     |

External references are available in the path in the `$REFERENCES` environment variable.

## Project Overview

Monorepo for parsing and processing U.S. Citizenship and Immigration Services (USCIS) Civics Test data,
plus the practice-test apps built on it (Next.js website and an Expo mobile app that share one UI package).

**Workspaces:**

- **civics2json** (`packages/civics2json`): Core tool - downloads and converts USCIS Civics Test data to JSON
- **distractions** (`packages/distractions`): Generates incorrect answer choices
- **questionnaire** (`packages/questionnaire`): Quiz game engine (sessions, pairing, scoring)
- **app** (`packages/app`): Shared cross-platform UI - Tamagui config, components, hooks, Effect services, types.
  Source-shipped (no build step); exports subpaths `app`, `app/components`, `app/components/tamagui`,
  `app/hooks`, `app/screens`, `app/services`, `app/types`, `app/tamagui.config`
- **website** (`website`): Next.js 16 App Router site; route pages + thin shims over `app`
- **mobile** (`apps/mobile`): Expo 56 / expo-router app mounting the same `app` package (in progress)

**Tech Stack:**

- Effect-TS for functional programming and composability
- @effect/cli for command-line interface
- Effect Schema for runtime type validation
- React 19.2 + Tamagui 1.144 on both platforms (Next.js web, Expo/React Native mobile)

## Key Files

| File                                           | Purpose                   |
| ---------------------------------------------- | ------------------------- |
| `packages/civics2json/src/index.ts`            | CLI entry point           |
| `packages/civics2json/src/QuestionsManager.ts` | Main orchestration        |
| `packages/civics2json/src/types.ts`            | State/question types      |
| `packages/civics2json/src/schema.ts`           | Effect Schema definitions |
| `packages/app/src/components/index.ts`         | Shared component barrel   |
| `packages/app/src/tamagui.config.ts`           | Tamagui tokens + themes   |
| `packages/app/src/services/index.ts`           | Shared Effect services    |
| `website/src/app/*/page.tsx`                   | Web routes                |
| `apps/mobile/app/`                             | expo-router routes        |
| `plans/react-native-mobile-app.md`             | Native port plan + STATUS |

## Data Flow

1. Fetch raw data from USCIS and government sources
2. Parse HTML/XML into structured data
3. Construct questions with dynamic state-specific answers
4. Output JSON with static civics questions and dynamic political data

## Commands

### Root Level

```bash
npm test                    # Run tests across all workspaces
npm run lint                # ESLint across all workspaces (packages/app enforces react-hooks incl. set-state-in-effect)
```

### website

```bash
npm run dev -w website      # Next dev server (localhost:3000)
npm run build -w website    # lint + jest + production build (its TS pass is the website typecheck)
npm run test:e2e -w website -- --project=chromium   # Functional e2e (chromium only in the sandbox)
npm run test:visual -w website                      # 20 visual baselines (sandbox container only)
```

### apps/mobile

```bash
npm test -w mobile                                  # tsc --noEmit + jest-expo
npx expo export --platform ios --source-maps        # Bundle check (run in apps/mobile; android likewise)
```

### civics2json

```bash
npm run clean              # Clean build artifacts
npm run lint               # Run ESLint
npm run build              # Build for distribution
npm run package            # Full build pipeline
npm test                   # Run Jest tests
```

### CLI Usage

```bash
npx tsx src/index.ts questions fetch      # Fetch civics questions
npx tsx src/index.ts questions parse      # Parse civics questions
npx tsx src/index.ts questions construct  # Construct final questions
npx tsx src/index.ts senators fetch       # Fetch senator data
npx tsx src/index.ts senators parse       # Parse senator data
npx tsx src/index.ts representatives fetch [--force]
npx tsx src/index.ts governors fetch [--force]
```

## Essential Rules

- **Temporary files**: Prefix with `temp_`, delete after use
- **Plans**: Save to `plans/` directory in markdown
- **Never overwrite**: `.envrc` file
- **Linting**: Do not auto-fix; let maintainer address
- **Coding standards**: See [docs/index.md](./docs/index.md)

## Shared UI (`packages/app`) and Website Styling

All reusable components, hooks, and services live in `packages/app` and are
consumed by both the website and the mobile app. The native port is tracked in
`plans/react-native-mobile-app.md` (see its "Phase 5 — STATUS" block for what
has moved and the per-stage gate suite). Current state: every website component
except the web-only `Layout`, `TamaguiProvider`, `InstallPrompt`,
`OfflineIndicator`, `ServiceWorkerRegistration` is a one-line shim over
`app/components`; the results and statistics routes are thin
`<Layout><XScreen/></Layout>` wrappers over `app/screens`, and the other three
route pages are still full implementations that move to
`packages/app/src/screens/` next.

### Rules for shared code

- **New components/hooks go in `packages/app`**, not `website/src`. Website
  files at the old `@/components/X` paths are shims
  (`export { X as default } from 'app/components'`); keep them so route pages
  don't churn.
- **No web-only globals in shared code** (`window`, `document`, `next/*`,
  `localStorage`, CSS units like `vh`). Either platform-split the file
  (`X.tsx` web / `X.native.tsx` native / `X.shared.ts` for the shared props
  and pure helpers) or guard with `isWeb` from `tamagui`. Never expose a split
  through the package.json `exports` map - Metro only resolves `.native`
  inside relative imports.
- **Icons** come from `app/components` (the `icons.ts` / `icons.native.ts`
  pair). Never import `lucide-react` in shared code; add new icons to BOTH
  halves.
- **Navigation is a callback prop** (`onNavigateHome`, `onBack`, ...). No
  router imports in `packages/app`.
- **`react-hooks` lint is fully on in `packages/app`** (including
  `set-state-in-effect`): derive state with `useMemo`, reset with `key=`,
  read latest props in effects with `useEffectEvent`.
- Colors come from Tamagui theme keys (`packages/app/src/tamagui.config.ts`),
  not CSS variables. Use `styled()` components with `$editorial*`/`$theme*`
  keys, or `useTheme().<key>?.get()` for raw DOM elements, SVGs, and props.
  See [docs/react-guide.md](./docs/react-guide.md) for patterns and the key
  list.

### Remaining CSS Classes (web-only, route pages only)

- Cards: `card`, `card-elevated`, `card-interactive`
- Buttons: `btn-primary`, `btn-secondary`, `btn-success`, `btn-error`
  (only `game/page.tsx` and `settings/page.tsx` still use these)
- Utilities: `focus-ring`, `text-gradient`
- Responsive: `hidden`, `md:flex`, `md:hidden`

### Notes

- Tailwind CSS removed - do not add Tailwind classes
- Do not add new `var(--...)` references in components. Remaining sanctioned
  sites: the `var(--font-family-serif)` literals in the four unmoved route
  pages (they become `fontFamily: '$serif'` when each screen moves) and the
  web-only InstallPrompt/OfflineIndicator
- Test both light and dark themes when modifying styles
- Visual regression: `npm run test:visual -w website` (20 committed baselines;
  never `--update-snapshots` outside the sandbox container). UI that no
  baseline covers (e.g. the ErrorBoundary fallback) gets a throwaway `temp_`
  page + old-vs-new pixel diff instead - see the plan STATUS block
