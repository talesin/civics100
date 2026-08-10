# React 19 Modernization — Post-Native-Migration Plan

## Context

During review of the react.dev reference guide (`$REFERENCES/react-dev/`, React
19 era) against this codebase (2026-08-10, mid-Phase-5 of
`plans/react-native-mobile-app.md`), several guide-prescribed improvements were
identified that are **not needed for correctness** and would add risk or noise
to the port's parity-gated component moves. They were deliberately deferred to
after the native migration ships (Phases 5–7 complete). The *small* mechanical
React 19 idioms (useEffectEvent adoption, `<Context value>`, packages/app hooks
linting) were folded into Phase 5 instead — see the "React 19 guidance" block
in `plans/react-native-mobile-app.md`; this plan is the remainder.

Prerequisite state assumed: shared screens live in `packages/app`, both apps
green, per-stage gate suite (root `npm test`, website lint + build, functional
e2e, visual 20/20, mobile `tsc` + `expo export`) still operational.

## 1. GameScreen reducer conversion

The guide-prescribed shape for a large state machine
([05-managing-state.md#scaling-up-with-reducer-and-context](/references/react-dev/05-managing-state.md#scaling-up-with-reducer-and-context));
`docs/react-guide.md` already prescribes useReducer for complex state. The
shared `GameScreen` (extracted as-is in Phase 5, per user decision) still
carries 10+ `useState` hooks and handler-driven timing logic.

- Pure reducer in its own module (`packages/app/src/screens/gameReducer.ts`):
  exportable, unit-testable with plain Jest — no renderer, no platform, which
  is the cross-platform payoff.
- Collapse mutually-exclusive booleans into a single `status` enum
  ([05-managing-state.md#avoid-contradictions-in-state](/references/react-dev/05-managing-state.md#avoid-contradictions-in-state));
  delete any state derivable in render
  ([06-refs-and-effects.md#updating-state-based-on-props-or-state](/references/react-dev/06-refs-and-effects.md#updating-state-based-on-props-or-state)).
- One action per user interaction, not per field
  ([05-managing-state.md#writing-reducers-well](/references/react-dev/05-managing-state.md#writing-reducers-well)).
- Wiring in one module: `GameStateContext` + `GameDispatchContext` (two
  contexts so dispatch-only consumers skip state churn), `GameProvider`,
  `useGame()` / `useGameDispatch()`
  ([05-managing-state.md#moving-all-wiring-into-a-single-file](/references/react-dev/05-managing-state.md#moving-all-wiring-into-a-single-file)).
- Gate: reducer unit suite + the full existing e2e/visual parity suite —
  behavior must be indistinguishable.

## 2. React Compiler enablement

Stable per
[08-react-compiler.md#is-it-safe-to-use](/references/react-dev/08-react-compiler.md#is-it-safe-to-use).
This codebase is an unusually good candidate: zero `memo()`, 5 `useMemo`,
`useCallback` concentrated in two files — little to preserve, much to gain.
`babel-plugin-react-compiler@1.0.0` is already installed (babel-preset-expo
optional peer). The react-hooks v7 lint rules (the compiler's diagnostics) are
already running.

- **Web:** `reactCompiler: true` in `website/next.config.ts` — Next ≥15.3.1
  uses the swc-invoked compiler, no Babel config needed
  ([08-react-compiler.md#per-build-tool-setup](/references/react-dev/08-react-compiler.md#per-build-tool-setup)).
- **Mobile:** babel-preset-expo's react-compiler option per Expo's guide
  (<https://docs.expo.dev/guides/react-compiler/>); compiler plugin must run
  first in the Babel pipeline (worklets plugin stays last).
- Leave ALL existing manual memoization in place — the compiler preserves it;
  stripping it changes output
  ([08-react-compiler.md#what-about-manual-memoization](/references/react-dev/08-react-compiler.md#what-about-manual-memoization)).
- `compilationMode` default (`infer`); `panicThreshold: 'none'` (default) for
  production; no `target` needed (React 19 everywhere).
- Known failure mode to watch: effects that relied on referential stability of
  un-memoized values
  ([08-react-compiler.md#common-breaking-patterns](/references/react-dev/08-react-compiler.md#common-breaking-patterns)).
  Debug loop: `"use no memo"` on the suspect component → confirm → fix → remove.
- Gate: full visual suite + functional e2e on web; mobile `tsc` +
  `expo export` + on-device smoke. Enable web first, mobile as a second stage.

## 3. useSyncExternalStore conversions

Every external store today is hand-subscribed with `useState` + `useEffect`
(tearing-prone; the theme case needs two DOM-reading effects purely as an SSR
workaround). Guide:
[12-form-and-misc-hooks.md#usesyncexternalstore](/references/react-dev/12-form-and-misc-hooks.md#usesyncexternalstore),
[06-refs-and-effects.md#subscribing-to-an-external-store](/references/react-dev/06-refs-and-effects.md#subscribing-to-an-external-store).

- **Theme** (shared provider, post Phase-5 split): replaces the duplicated
  `document.documentElement.classList.contains('t_dark')` effects.
  `getServerSnapshot` is MANDATORY under Next SSR and must match the first
  client render
  ([12-form-and-misc-hooks.md#usesyncexternalstore-server-rendering](/references/react-dev/12-form-and-misc-hooks.md#usesyncexternalstore-server-rendering)).
  `subscribe` at module scope; `getSnapshot` returns the raw string, never a
  fresh object.
- **`useOnlineStatus`** (`website/src/hooks/useOnlineStatus.ts`): textbook
  `useSyncExternalStore(subscribe, () => navigator.onLine, () => true)`.
- **`useTtsVoices`** (`packages/app/src/hooks/useTtsVoices.ts`): the TTS
  adapter's `onVoicesChanged` already returns an unsubscribe function
  (`services/TtsService/adapter.ts:63`) — a ready-made `subscribe`.
- Optional: `storage`-event listener for cross-tab settings sync (today
  cross-tab changes never propagate; every consumer re-reads on mount).

## 4. Re-enable `react-hooks/set-state-in-effect` on the website

`website/eslint.config.mjs:65` disables it ("maintain status quo").
`packages/app` runs it from the Phase-5 lint stage onward; the website should
follow once the port stops churning. Known sites it will flag (fix or verify
already fixed during Phase 5):

- `statistics/page.tsx:40-104` filter/sort derived-state effect (Phase 5
  screen extraction should have converted it to `useMemo`).
- `GameQuestion` reset effect (if the `key={question.id}` route wasn't taken).
- `game/page.tsx:358-368` first-visit keyboard-help effect.
- `TamaguiProvider` theme effects (item 3 removes these).

## 5. Smaller items

- **settings page: 14 no-op `useCallback`s** wrapping handlers passed to
  unmemoized children — drop them, or simply leave for the compiler (item 2)
  and delete opportunistically.
- **React version alignment:** web `react@19.2.5` vs mobile pinned `19.2.3`
  (SDK-required). Two copies is fine (packages/app treats react as a peer),
  but align when an SDK bump allows, before any shared code depends on a
  >19.2.3 fix.
- **`StateSelector` module-level `locationCache`** (mutable module global
  read/written from callbacks) — will be flagged by the compiler
  `purity`/`globals` lint rules; convert to a ref or service-held cache.
- **`useGameSounds` redundant memoization** (5 hooks, all deps `[sound]`,
  never changes): harmless; delete only if touching the file anyway.

## Explicitly out of scope

- `forwardRef` migration — zero occurrences in the repo.
- `ErrorBoundary` rewrite — stays a class (react.dev's one sanctioned class
  use; `react-error-boundary` only if maintenance becomes a burden).
- `<ViewTransition>` / Fragment refs — Canary-only, and ViewTransition is
  DOM-only (RN support "in progress").

## Verification

Same gate suite as the port: root `npm test`, website lint +
`NODE_ENV=production next build`, functional e2e (`--project=chromium`),
visual 20/20 (baselines valid only in the sandbox container), packages/app +
apps/mobile `tsc --noEmit`, `expo export` ios+android with sourcemap greps.
Item 1 adds a reducer unit suite; item 2 additionally needs an on-device smoke
(dev build) since compiled output differs on Hermes.
