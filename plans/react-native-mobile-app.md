# React Native (Expo) Mobile App — Phased Plan

## Context

The repo (`civics100`) is an npm-workspace monorepo whose user-facing app is `website` — a Next.js 16 + React 19 + **Tamagui** practice-test app for the USCIS civics exam. We want to ship the same app on **iOS and Android** as a native app.

This is far more tractable than a typical web→native port because the groundwork is already laid:

- **All game logic is platform-agnostic.** `civics2json` (data), `distractions` (distractor answers), and `questionnaire` (Effect-TS game engine: `GameService`, session state machine, scoring) are pure TS packages the UI merely consumes.
- **The UI already uses Tamagui** (`website/tamagui.config.ts`), which compiles to React Native primitives natively and HTML on web. Tokens, light/dark themes, and media queries already exist.
- **Services are already Effect `Layer`s.** `LocalStorageService` isolates every `localStorage` call behind helpers and already ships a swappable `TestLocalStorageServiceLayer` — proving per-platform layer swapping is trivial. `ServiceProvider.ts` is the single injection seam.

The web coupling that must be abstracted is the boundary layer only: Next routing, `localStorage`, `speechSynthesis`/Web-Audio, service worker/PWA, `next/font`, `lucide-react`, `framer-motion`, and — the largest item — a design system currently expressed as raw CSS variables (`var(--editorial-*)`) in inline styles across 12 files (158 occurrences; concentrated in `app/page.tsx`, `settings/page.tsx`, `StatsSummary.tsx`, `results/page.tsx`, `Layout.tsx`).

**Decisions made (by the user):** (1) Extract a shared `packages/app` consumed by both web and mobile — Tamagui's `apps/* + packages/app` pattern. (2) **Full parity** — all 5 screens. (3) **Expo** (managed + dev builds) with **expo-router**. (4) **Minimize website changes** — the website re-points imports to the shared package and keeps working; no rewrite.

Intended outcome: one shared UI/logic package, an Expo app that builds to iOS/Android at full feature parity, and a website that looks and behaves identically while now sourcing its UI from `packages/app`.

> Validated against the reference docs (mounted at `/references` in this environment — `tamagui`, `react-and-react-native`, `effect`, `playwright`) and the live `/workspace` source. The monorepo pattern, dual-toolchain shared config, `.web/.native` driver split, expo-router, AsyncStorage, dev-build requirement, EAS, and reanimated-plugin-last rule are all confirmed; the numbers, the `@tamagui/metro-plugin` step, the icon peer dep, the v1↔v2 animation-package naming, the SDK target, and the Hermes proof obligation below reflect that validation pass.

## Target Architecture

```
.                              # repo root
  package.json                 # workspaces: ["packages/*", "apps/*", "website"]
  packages/
    civics2json/ distractions/ questionnaire/   # unchanged
    app/                                          # NEW: shared UI + logic
      src/
        tamagui.config.ts
        animations.web.ts  animations.native.ts  # platform-split driver
        components/   # platform-neutral Tamagui components (ported from website)
        screens/      # Home, Game, Results, Settings, Statistics
        services/     # tags + schemas + web/native layers + makeAppServiceLayer
        hooks/        # platform-neutral hooks only
  apps/
    mobile/                                        # NEW: Expo app
      app/            # expo-router routes = thin wrappers over screens
      metro.config.js  babel.config.js  app.config.ts  eas.json
  website/                                         # MINIMAL changes
    next.config.ts    # transpilePackages += "app"
    src/app/*         # routes become thin wrappers over packages/app screens
    src/components/   # KEEP web-only: OfflineIndicator, InstallPrompt, ServiceWorkerRegistration
```

**Platform-abstraction pattern:** one Effect tag per capability, two `Layer`s, composed per app via a `makeAppServiceLayer(platformLayers)` factory in `packages/app` (generalizing the current `AppServiceLayer`):

| Capability | Web layer | Native layer |
| --- | --- | --- |
| `LocalStorageService` (tag + Schemas shared) | `localStorage` | `@react-native-async-storage/async-storage` |
| `TtsService` | `speechSynthesis` | `expo-speech` |
| `SoundService` | Web Audio | `expo-audio` |
| `NavigationService` | `next/navigation` / `next/link` | `expo-router` |

Screens stay router-agnostic by receiving navigation via `NavigationService`/callback props — neither router leaks into `packages/app`.

## Library Choices

- **Target the latest stable Expo SDK (≥54 as of mid-2026; SDK 53 is the floor)** on the React 19 line. The exact Expo↔RN↔React matrix is locked in Phase 0 rather than assumed — do not hard-code the RN 0.79 / SDK 53 pairing. Pin mobile React to the SDK's required version; `packages/app` declares `react` as a permissive **peerDependency** (not a hard dep) so web and native bundle their own copy.
- **Pin `tamagui` / `@tamagui/*` to the exact website version (`1.144.x`)** across `packages/app`, `website`, `apps/mobile` to avoid "two Tamagui instances" runtime errors. Include `@tamagui/metro-plugin` in this pinned set (see Phase 1).
- **Animations:** `@tamagui/animations-css` (web) / `@tamagui/animations-moti` + `react-native-reanimated` + `moti` (native), behind the `animations.web.ts`/`animations.native.ts` split. Note: the package is `@tamagui/animations-moti` on the pinned **v1.144** line; it was renamed `@tamagui/animations-motion` in Tamagui **v2** — rename only if/when the Tamagui upgrade happens. `@tamagui/animations-reanimated` is the non-Moti native fallback if Moti proves troublesome.
- **Icons:** `@tamagui/lucide-icons` (cross-platform, themed) replacing `lucide-react`. Requires the `react-native-svg` peer on native (`react-native-svg @tamagui/lucide-icons`).
- **Animation in components:** `moti` replacing `framer-motion`.
- **Storage:** `@react-native-async-storage/async-storage` for v1 (async API maps onto existing Effect helpers; MMKV is a fast-follow only if profiling demands it).
- **Fonts:** `expo-font` replacing `next/font`.

## Phased Implementation

### Phase 0 — De-risk spikes (no committed app code)
- **Spike A (Metro + Effect on Hermes):** throwaway Expo app imports from `questionnaire/data` and runs a **non-trivial Effect — including a Schema decode — on a Hermes device/sim**, not just at bundle time. The Effect references document only `@effect/platform-{node,bun,browser}` and say nothing about React Native/Hermes, so "Effect core is Node-free → runs on Hermes" is a reasonable but *undocumented* assumption that must be proven on-device. Also confirm Metro does **not** pull in `@effect/platform-node` / `@effect/cli` (Node-only deps in `packages/questionnaire/package.json`). The website already runs `questionnaire` in-browser, so a Node-free path exists — confirm it's Metro-resolvable; if `.` is contaminated, plan a `questionnaire` export-map refinement.
- **Spike B (Tamagui dual toolchain):** confirm one `tamagui.config.ts` compiles under both `@tamagui/next-plugin` and the Tamagui babel plugin (+ `@tamagui/metro-plugin`) with the driver split.
- Lock the exact Expo SDK ↔ RN ↔ React version matrix (target the latest stable SDK; do not assume 53/RN-0.79).
- **Exit:** written go/no-go on `questionnaire` RN-safety, proven by an Effect+Schema run executing on Hermes, plus pinned versions.

### Phase 1 — Scaffold `apps/mobile`
- Add `apps/*` to root `workspaces` (`package.json`, currently `["packages/*","website"]`). Create `apps/mobile`.
- `metro.config.js`: wrap the config with `@tamagui/metro-plugin`'s `withTamagui(config, { components: ['tamagui'], config: './tamagui.config.ts' })` (the documented Tamagui↔Metro integration, paired with the babel plugin), then layer the monorepo resolver settings on top: `watchFolders` → repo root, `resolver.nodeModulesPaths` → app + root (npm hoists), `resolver.unstable_enablePackageExports = true` (honor ESM `exports`).
- `babel.config.js`: `babel-preset-expo` + Tamagui plugin + `react-native-reanimated/plugin` (last).
- `app.config.ts`, `tsconfig.json` extending root composite, expo-router with one placeholder screen reading `questionnaire` data.
- **Exit:** `expo run:ios` and `run:android` boot and render data; website still builds untouched.

### Phase 2 — `packages/app` + shared Tamagui config
- Create `packages/app` (ESM, `dist/` build matching siblings, version `*`).
- **Move** `website/tamagui.config.ts` → `packages/app/src/tamagui.config.ts`; extract the animation driver to `animations.web.ts`/`animations.native.ts` (config imports `./animations`, resolved per platform). The `createTokens({color, space, size, radius, zIndex})` block (incl. editorial palette) is neutral and moves wholesale.
- Re-point `website` and `next.config.ts` `transpilePackages` (already lists Tamagui packages — add `app`) at the shared config.
- **Exit:** website renders byte-identical (visual diff on 5 screens); a `packages/app` Tamagui component renders in `apps/mobile`.

### Phase 3 — Platform abstraction (Effect service swap)
- Move neutral services into `packages/app/src/services`: `SessionService`, `QuestionDataService`, `StatisticsService`, `DistrictDataService` (all already wrap `questionnaire`/JSON).
- For coupled services keep one tag, two layers:
  - `LocalStorageService`: tag + Schemas → `packages/app`; web keeps current `localStorage` Default (`.web.ts`); add `.native.ts` over AsyncStorage (mechanical re-impl of the 13 already-isolated methods; Schema logic shared verbatim).
  - New `TtsService` / `SoundService` tags: web layers lift logic from `useTextToSpeech`/`useGameSounds`; native layers wrap `expo-speech`/`expo-audio`.
  - `NavigationService`: thin tag/callbacks, implemented per app — no router in shared package.
- Generalize `ServiceProvider.ts`'s `AppServiceLayer` into `makeAppServiceLayer(platformLayers)` + move `runWithServices*` to `packages/app`.
- **Exit:** a shared save→read `GameResult` Effect passes against both web (jsdom) and native (`jest-expo` + AsyncStorage mock) layers; existing website Jest tests using `TestLocalStorageServiceLayer` still pass. (`jest-expo` is chosen over the references' default Vitest deliberately — it keeps parity with the existing Jest suites already aggregated by `npm run test --workspaces` and lets the native layer reuse `TestLocalStorageServiceLayer` verbatim.)

### Phase 4 — Port design system to Tamagui tokens (the long pole)
- Map every `var(--editorial-*)` usage to the matching `$editorial*` Tamagui token (the values already exist as tokens — this is a mapping, not a redesign).
- Drive `light`/`dark` via Tamagui themes, replacing the `html.t_dark` switch on both platforms.
- Convert the 12 files using `var(--...)` from raw `<div style>` to `<YStack/XStack/Text>` + `$token` props, starting with `Layout.tsx` and the `tamagui/` wrappers. Replace `.animate-*`/framer-motion with `moti`/Tamagui animations.
- Trim `globals.css`/`design-tokens.css` to genuinely web-only resets.
- **Exit:** zero `var(--editorial-*)` in components destined for `packages/app`; Playwright visual diffs of all 5 web routes within tolerance (baseline captured **before** this phase — the guardrail for decision #4).

### Phase 5 — Move components + screens into `packages/app`
- Least-coupled first: `tamagui/*` wrappers, `StatsSummary`, `GameResults`, `QuestionStatisticsTable`, `StateSelector`, `DistrictSelector`, `GameQuestion`, `GameControls`, `PoliticianVerificationBox`, `QuestionDetailModal`, `SpeakerButton`, `ThemeToggle`, `ErrorBoundary`. Swap icons to `@tamagui/lucide-icons`; route `Layout` nav through `NavigationService`.
- **Keep web-only in `website`:** `OfflineIndicator`, `InstallPrompt`, `ServiceWorkerRegistration`.
- Build 5 shared screen components in `packages/app/src/screens` (the ~580-line `/game` state machine → shared `GameScreen` taking nav callbacks — its size makes the shared extraction the highest-effort step of this phase). Web routes and `apps/mobile/app/*` become thin wrappers.
- **Exit:** every website route renders the shared screen; mobile mounts the same screens; `/game` behaves identically on both.

### Phase 6 — Native features & polish
- Wire native layers (AsyncStorage / `expo-speech` / `expo-audio`); `apps/mobile/app/_layout.tsx` tab/stack nav replacing the web header; `expo-font`, safe-area, status bar, splash/icon. Drop `useKeyboardNavigation` on mobile.
- **Exit:** all 5 screens fully functional on iOS sim + Android emulator with persistence, TTS, sounds.

### Phase 7 — Build, CI, release
- **EAS Build** (`eas.json`) dev/preview/production profiles with a dev-client (reanimated/async-storage/expo-audio aren't in Expo Go). Root scripts `dev:mobile`/`ios`/`android` (`dev`→website unchanged). Extend root `clean` to cover mobile artifacts. CI: `tsc --build`, `npm run test --workspaces`, EAS preview smoke build.
- **Exit:** green CI; EAS preview build installs on a device.

## Key Files
- `package.json` — add `apps/*` to `workspaces`; root scripts.
- `website/tamagui.config.ts` — move to `packages/app`; split animation driver.
- `website/src/services/LocalStorageService.ts` — tag + Schemas move; add AsyncStorage native layer re-implementing the 13 isolated methods (existing `TestLocalStorageServiceLayer` proves the swap).
- `website/src/services/ServiceProvider.ts` — generalize `AppServiceLayer`/`runWithServices` into `makeAppServiceLayer`.
- `website/src/components/Layout.tsx` — canonical `var(--editorial-*)` inline-style coupling to convert.
- `website/next.config.ts` — `transpilePackages += "app"`.
- `packages/questionnaire/package.json` — `@effect/platform-node` + `@effect/cli` Node-only deps driving the Phase 0 Metro spike.

## Risks & Mitigations
- **Metro + Node-only Effect deps (highest):** import only `questionnaire/data` + needed exports; refine `questionnaire` export map if `.` is contaminated; Metro `resolveRequest` shim as last resort. Validate in Phase 0.
- **Two Tamagui instances:** pin exact `1.144.x` everywhere (incl. `@tamagui/metro-plugin`); hoist at root.
- **Tamagui Metro integration:** native compilation needs `@tamagui/metro-plugin`'s `withTamagui()` wrapping the Metro config, paired with the babel plugin — don't rely on the babel plugin alone. Validate alongside Spike B.
- **Animation driver:** `css` is web-only — never share; resolve via `.web/.native` file extensions. Package is `@tamagui/animations-moti` on v1.144 (`@tamagui/animations-motion` only in v2).
- **CSS-var design system:** mapping not redesign; Playwright visual gate prevents web regressions.
- **Effect/Schema under Hermes:** Effect core is Node-free so risk is low, but RN/Hermes support is *undocumented* in the Effect refs — prove it on-device in Spike A (Schema decode included), not by assumption; keep `@effect/platform-node` off-device.
- **React 19 alignment:** mobile pins SDK's React; `packages/app` treats `react` as peer dep — two separately-bundled copies is fine.

## Verification
- **Three-target dev loop:** web `npm run dev` + Playwright; iOS `npx expo run:ios`; Android `npx expo run:android` (dev-client, not Expo Go).
- **Shared contract tests:** one suite (save/read `GameResult`, settings, paired answers) run against both web and native layers; native via `jest-expo` + AsyncStorage mock. Existing `npm run test --workspaces` aggregates.
- **Visual regression:** capture website screenshots of all 5 routes before Phase 4; diff after each component move.
- **CI smoke:** `tsc --build`, workspace Jest, EAS preview build.

## Fast-follow (out of v1)
MMKV migration; `expo-notifications` push; EAS Update/OTA; App Store/Play submission & signing; full TTS voice-picker parity (`expo-speech` enumeration is weaker than Web — ship default voice + rate first); deep linking; haptics.
