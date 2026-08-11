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

> Validated against the reference docs (mounted at `/references` in this environment — `tamagui`, `react-and-react-native`, `effect`, `playwright`, and the new **`expo` SDK 56 guide set**) and the live `/workspace` source. The monorepo pattern, dual-toolchain shared config, `.web/.native` driver split, expo-router, AsyncStorage, dev-build requirement, EAS, and reanimated-plugin-last rule are all confirmed; the numbers, the `@tamagui/metro-plugin` step, the icon peer dep, the v1↔v2 animation-package naming, the SDK target, and the Hermes proof obligation below reflect that validation pass.

### Expo Reference Guides

Authoritative source for every Expo claim below is the SDK 56 guide set at
`/references/expo/` ([index](/references/expo/index.md)). Most-cited chapters:
core model & CNG (Ch 01), getting started (Ch 02), app config + metro/babel (Ch 03),
config plugins (Ch 04), expo-router (Ch 06–08), dev builds (Ch 09), UI/assets (Ch 10),
monorepos/new-arch/deep-linking (Ch 11), SDK packages (Ch 12–15), EAS (Ch 16–19).
Inline citations below use the form `[Ch NN § Title](/references/expo/NN-file.md#anchor)`.

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
| `LocalStorageService` (tag + Schemas shared) | `localStorage` | `@react-native-async-storage/async-storage` ([Ch 14](/references/expo/14-sdk-data-auth-background.md#async-storage)) |
| `TtsService` | `speechSynthesis` | `expo-speech` ([Ch 13](/references/expo/13-sdk-device-sensors-system.md#speech)) |
| `SoundService` | Web Audio | `expo-audio` ([Ch 12](/references/expo/12-sdk-camera-media-graphics.md#audio) — current API; `expo-av` superseded) |
| `NavigationService` | `next/navigation` / `next/link` | `expo-router` ([Ch 06](/references/expo/06-expo-router-basics.md#navigation)) |

Screens stay router-agnostic by receiving navigation via `NavigationService`/callback props — neither router leaks into `packages/app`.

## Library Choices

- **Target the latest stable Expo SDK.** ✅ LOCKED in Phase 0 (2026-06-29): **Expo SDK 56.0.12 → React Native 0.85.3, React 19.2.3**, New Architecture on, Hermes default. (The earlier "≥54 floor / not RN 0.79" guidance is superseded by this locked matrix — full list in `spikes/mobile/GO-NO-GO.md` §4.) Note RN 0.85 ships **reanimated 4**, which requires a separate `react-native-worklets` dep and moves its babel plugin to `react-native-worklets/plugin`. Pin mobile React to the SDK's required version; `packages/app` declares `react` as a permissive **peerDependency** (not a hard dep) so web and native bundle their own copy. (SDK/workflow model: [Ch 01 § Workflows](/references/expo/01-overview-and-core-concepts.md#workflows); New Architecture: [Ch 11 § New Architecture](/references/expo/11-common-guides.md#new-architecture); reanimated 4 / worklets: [Ch 15 § Reanimated](/references/expo/15-sdk-ui-components.md#reanimated).)
- **Pin `tamagui` / `@tamagui/*` to the exact website version (`1.144.x`)** across `packages/app`, `website`, `apps/mobile` to avoid "two Tamagui instances" runtime errors. Include `@tamagui/metro-plugin` in this pinned set (see Phase 1).
- **Animations:** `@tamagui/animations-css` (web) / `@tamagui/animations-moti` + `react-native-reanimated` + `moti` (native), behind the `animations.web.ts`/`animations.native.ts` split. Note: the package is `@tamagui/animations-moti` on the pinned **v1.144** line; it was renamed `@tamagui/animations-motion` in Tamagui **v2** — rename only if/when the Tamagui upgrade happens. `@tamagui/animations-reanimated` is the non-Moti native fallback if Moti proves troublesome.
- **Icons:** `@tamagui/lucide-icons` (cross-platform, themed) replacing `lucide-react`. Requires the `react-native-svg` peer on native (`react-native-svg @tamagui/lucide-icons`) — [Ch 12 § SVG](/references/expo/12-sdk-camera-media-graphics.md#svg).
- **Animation in components:** `moti` replacing `framer-motion`.
- **Storage:** `@react-native-async-storage/async-storage` for v1 (async API maps onto existing Effect helpers; MMKV is a fast-follow only if profiling demands it). Confirmed appropriate for non-sensitive app state in [Ch 14 § AsyncStorage](/references/expo/14-sdk-data-auth-background.md#async-storage); the `expo-sqlite`/`kv-store` drop-in is the documented migration path if profiling demands it ([Ch 14 § SQLite](/references/expo/14-sdk-data-auth-background.md#sqlite)).
- **Fonts:** `expo-font` replacing `next/font` — [Ch 10 § Fonts](/references/expo/10-ui-and-assets.md#fonts).
- **TTS (mobile):** `expo-speech` — [Ch 13 § Speech](/references/expo/13-sdk-device-sensors-system.md#speech). Confirms the voice-enumeration caveat: `getAvailableVoicesAsync()` returns a platform- and language-pack-dependent list, so ship default voice + rate first (full picker is fast-follow).
- **Sound (mobile):** `expo-audio` — [Ch 12 § Audio](/references/expo/12-sdk-camera-media-graphics.md#audio). This is the current SDK 56 audio API (the older `expo-av` is superseded), which resolves the plan's only open library question.

## Phased Implementation

### Phase 0 — De-risk spikes (no committed app code)
- **Spike A (Metro + Effect on Hermes):** throwaway Expo app imports from `questionnaire/data` and runs a **non-trivial Effect — including a Schema decode — on a Hermes device/sim**, not just at bundle time. The Effect references document only `@effect/platform-{node,bun,browser}` and say nothing about React Native/Hermes, so "Effect core is Node-free → runs on Hermes" is a reasonable but *undocumented* assumption that must be proven on-device. Also confirm Metro does **not** pull in `@effect/platform-node` / `@effect/cli` (Node-only deps in `packages/questionnaire/package.json`). The website already runs `questionnaire` in-browser, so a Node-free path exists — confirm it's Metro-resolvable; if `.` is contaminated, plan a `questionnaire` export-map refinement.
- **Spike B (Tamagui dual toolchain):** confirm one `tamagui.config.ts` compiles under both `@tamagui/next-plugin` and the Tamagui babel plugin (+ `@tamagui/metro-plugin`) with the driver split.
- Lock the exact Expo SDK ↔ RN ↔ React version matrix (target the latest stable SDK; do not assume 53/RN-0.79).
- **Exit:** written go/no-go on `questionnaire` RN-safety, proven by an Effect+Schema run executing on Hermes, plus pinned versions.

#### Phase 0 — STATUS (updated 2026-06-29): ⚠️ CONDITIONAL GO — in-container work complete, one device-only gate remains

Executed in a Linux **aarch64** container (no Xcode/Android SDK/simulators). Full results
+ carry-forward findings in `spikes/mobile/GO-NO-GO.md`. Summary:

- ✅ **Matrix locked (0a):** Expo **SDK 56.0.12**, RN **0.85.3**, React **19.2.3**,
  reanimated **4.3.1** + worklets **0.8.3** (new), moti 0.30, async-storage 2.2.0,
  svg 15.15.4, expo-router 56.2.11, speech/audio/font 56.x, tamagui pinned 1.144.4.
- ✅ **Spike A bundle contamination (0b):** `metro build` produces a 4.65 MB bundle with
  **0** hits for `@effect/platform-node` / `@effect/cli` / Node built-ins; real data +
  276 Schema symbols present. The Node-only deps are isolated to
  `questionnaire/dist/src/cli/index.js` (off the `.`/`./data` graph). RN-safe.
- ⚠️ **Spike A Hermes exec (0c):** the exact Effect+Schema+`loadQuestions` graph runs
  correctly under Node/V8 (`spikes/mobile/headless-probe.mjs` → decode Q#1, TOTAL 128,
  3 paired/4 options). Genuine on-**Hermes** execution is deferred to the device gate
  (no aarch64-Linux Hermes VM exists here); residual risk LOW.
- ✅ **Spike B Tamagui (0d/0e):** split `tamagui.config.ts` compiles **native** under
  Metro (`@tamagui/babel-plugin` + metro-plugin), single `tamagui@1.144.4` instance, and
  the **website still builds** (all 5 routes).
- ⏸ **REMAINING GATE (0f) — DEVICE ONLY:** on iOS sim + Android emulator confirm Tamagui
  primitives render, the moti/reanimated-4 native animation plays, and the three Spike-A
  probes go green on real Hermes. Run `npx expo run:ios` / `run:android` from the spike on
  a Mac. This is the only thing blocking full Phase-0 sign-off.

**Phase-1 carry-forward (critical, details in GO-NO-GO.md):** (1) reanimated 4 ⇒ babel
plugin is `react-native-worklets/plugin` + a `react-native-worklets` dep. (2) Tamagui's
`react-dom@19.2.7` peer floor ⇒ install with `--legacy-peer-deps`. (3) Metro
`unstable_enablePackageExports = true` is REQUIRED (questionnaire → `civics2json/Questions`
subpath). (4) **`expo export` fails to resolve effect's `.` export while `metro build`
succeeds** — Phase 1 must retest `expo export` on the in-workspace app and add a
`resolveRequest` shim for `effect` if it still fails (most likely friction point).

### Phase 1 — Scaffold `apps/mobile`
- Add `apps/*` to root `workspaces` (`package.json`, currently `["packages/*","website"]`). Create `apps/mobile`.
- `metro.config.js`: wrap the config with `@tamagui/metro-plugin`'s `withTamagui(config, { components: ['tamagui'], config: './tamagui.config.ts' })` (the documented Tamagui↔Metro integration, paired with the babel plugin), then layer the monorepo resolver settings on top: `watchFolders` → repo root, `resolver.nodeModulesPaths` → app + root (npm hoists), `resolver.unstable_enablePackageExports = true` (honor ESM `exports`). Monorepo Metro setup: [Ch 11 § Monorepos](/references/expo/11-common-guides.md#monorepos), [Ch 03 § Metro Config](/references/expo/03-app-configuration.md#metro-config).
- `babel.config.js`: `babel-preset-expo` + Tamagui plugin + the worklets/reanimated plugins **last** ([Ch 03 § Babel Config](/references/expo/03-app-configuration.md#babel-config)). **Correction (reanimated 4):** the plugin is now `react-native-worklets/plugin` (it must be the last entry), with `react-native-reanimated/plugin` no longer used standalone — per the Phase-0 carry-forward and [Ch 15 § Reanimated](/references/expo/15-sdk-ui-components.md#reanimated).
- `app.config.ts` (TypeScript dynamic config — [Ch 03 § Static Config](/references/expo/03-app-configuration.md#static-config)) with the required fields set up front: `name`, `slug`, `scheme`, `version`, `ios.bundleIdentifier`, `android.package`, `newArchEnabled: true`, and `experiments.typedRoutes: true`. Note `slug` / `bundleIdentifier` / `package` are effectively immutable after store submission, so fix them now. (`scheme` enables native deep links and `typedRoutes` gives type-safe `<Link href>` — [Ch 07 § Typed Routes](/references/expo/07-expo-router-advanced.md#typed-routes), [Ch 07 § Deep Linking](/references/expo/07-expo-router-advanced.md#deep-linking).)
- `plugins` array ([Ch 03 § Plugins](/references/expo/03-app-configuration.md#plugins), [Ch 04 § Using Plugins](/references/expo/04-config-plugins.md#using-plugins)): `expo-router`, `expo-build-properties` (new-arch), `react-native-svg`, and the reanimated/worklets plugin **last**. AsyncStorage needs no config plugin (autolinked).
- `tsconfig.json` extending root composite, expo-router ([Ch 06 § Installation](/references/expo/06-expo-router-basics.md#installation)) with one placeholder screen reading `questionnaire` data.
- **Expect the first run to be slow:** `expo run:ios|android` auto-runs prebuild (CNG, ~2–5 min on first invocation) to generate `ios/`+`android/`; later runs skip it unless native config changes ([Ch 01 § CNG](/references/expo/01-overview-and-core-concepts.md#cng), [Ch 09 § Creating a Dev Build](/references/expo/09-development-builds-and-debugging.md#creating-a-dev-build)). This is a **dev-client** build, not Expo Go ([Ch 09 § Dev Build vs Expo Go](/references/expo/09-development-builds-and-debugging.md#dev-build-vs-expo-go)).
- **Exit:** `expo run:ios` and `run:android` boot and render data; **`npx expo export` succeeds locally** (it exercises the same resolution path EAS uses — if effect's `.` export still fails, add the `resolveRequest` shim now, before EAS, per the Phase-0 carry-forward and [Ch 16 § eas.json](/references/expo/16-eas-build.md#eas-json)); website still builds untouched.

#### Phase 1 — STATUS (updated 2026-06-30): ✅ DONE except the device boot (deferred, no simulator here)

Executed in the Linux container (network available; no Xcode/Android SDK). `apps/mobile`
is a real workspace member and every in-container gate is green:

- ✅ **Workspace wiring:** root `workspaces` → `["packages/*","apps/*","website"]`; root
  `tsconfig.json` references `./apps/mobile`. App identity fixed: `slug` **civics100**,
  `ios.bundleIdentifier`/`android.package` **com.civics100.app**.
- ✅ **Config files** (lifted from the spike, de-shimmed): `package.json` (locked SDK-56
  matrix), `app.config.ts` (TS dynamic; `newArchEnabled`/`jsEngine` widened locally since
  they're absent from the SDK-56 `ExpoConfig` type), `babel.config.js`
  (`react-native-worklets/plugin` last), `metro.config.js` (`withTamagui` +
  `watchFolders`/`nodeModulesPaths` + `unstable_enablePackageExports`; **`extraNodeModules`
  shim dropped** — hoisting replaces it; a commented `resolveRequest` effect-shim is parked
  but **unused**), `tamagui.config.ts`. **Plugins kept minimal** (`expo-router` only;
  svg/async-storage autolink). **`react-native-svg` removed from the `plugins` array** — it
  has no config plugin and autolinks.
- ✅ **Animations split corrected for `tsc`:** TypeScript can't resolve RN platform
  extensions, so the web/default driver is `animations.ts` (css) with `animations.native.ts`
  (moti) as the native override — `animations.web.ts` renamed to `animations.ts`. Native
  Metro still picks `.native.ts` (verified: identical bundle hash before/after).
- ✅ **expo-router placeholder:** `app/_layout.tsx` (TamaguiProvider + SafeAreaProvider +
  Stack), `app/index.tsx` reads `questionnaire/data` and runs a guarded
  `Effect.runPromise(loadQuestions(...))` probe + a `bouncy` enter animation.
- ✅ **Resolution gate — the predicted #4 friction DID NOT bite.** `npx expo export`
  succeeds for **both ios and android** (2372 modules, ~8 MB Hermes bytecode). Inside the
  workspace effect's `.` export resolves cleanly — **no `resolveRequest` shim needed.**
  Bundle is **CLEAN** (0 `@effect/platform-node`/`@effect/cli` hits) with real data present
  (positive control: "supreme law of the land" found in the `.hbc`). `tsc --noEmit` green;
  `npm ls tamagui` = single `1.144.4`.
- ⚠️ **Install side-effects of the required `--legacy-peer-deps` (carry-forward #2):** a
  plain `npm install` now ERESOLVE-fails (confirmed: `@tamagui/animations-css@1.144.4` →
  `react-dom@19.2.7` peers `react@^19.2.7` vs mobile's `react@19.2.3`). Fixed repo-wide with
  a root **`.npmrc` (`legacy-peer-deps=true`)** so `npm install` works again. That flag
  skips npm's auto-peer install, which dropped `@testing-library/dom` (RTL 16 peer) and
  broke 2 website tests — fixed by declaring **`@testing-library/dom@^10.4.1`** explicitly in
  `website/devDependencies` (RTL 16 wants it direct anyway). **Website re-verified green:**
  lint + 49 Jest tests + `next build` (all 5 routes, Turbopack). These two files
  (`.npmrc`, `website/package.json` devDep) are the only changes beyond the planned set.
- ⏸ **REMAINING (1E) — DEVICE ONLY:** `npx expo run:ios` / `run:android` to boot the
  dev-client and read the placeholder + animation + probes off a real Hermes device. Needs a
  Mac/simulator. This also closes Phase-0's open **0f** gate. Everything it depends on is green.

### Phase 2 — `packages/app` + shared Tamagui config
- Create `packages/app` (ESM, `dist/` build matching siblings, version `*`).
- **Move** `website/tamagui.config.ts` → `packages/app/src/tamagui.config.ts`; extract the animation driver to `animations.web.ts`/`animations.native.ts` (config imports `./animations`, resolved per platform). The `createTokens({color, space, size, radius, zIndex})` block (incl. editorial palette) is neutral and moves wholesale.
- Re-point `website` and `next.config.ts` `transpilePackages` (already lists Tamagui packages — add `app`) at the shared config.
- **Exit:** website renders byte-identical (visual diff on 5 screens); a `packages/app` Tamagui component renders in `apps/mobile`.

#### Phase 2 — STATUS (updated 2026-07-26): ✅ DONE — all in-container gates green

- ✅ **`packages/app` created — SOURCE distribution** (user-approved deviation from the
  "dist/ build matching siblings" wording above): `exports` point at `src/*.ts`, no build
  step. Rationale: a tsup bundle would inline `./animations` and destroy the `.native.ts`
  platform split, and stale-dist would hurt the Phases-4/5 dev loop; source-shipping is
  the standard Tamagui monorepo pattern this plan's architecture cites. Next compiles it
  via `transpilePackages`, Metro natively. Layout: `src/tamagui.config.ts` (canonical,
  imports `./animations`), `src/animations.ts` (css) + `src/animations.native.ts` (moti)
  lifted verbatim from apps/mobile, `src/components/SharedBadge.tsx` + barrel `index.ts`.
  Peers: `react "*"`, tamagui/animations-css/animations-moti pinned exact **1.144.4**
  (same pins duplicated as devDeps so `tsc --noEmit`/lint are self-sufficient).
- ✅ **Website re-pointed (4 files + 1 delete):** `TamaguiProvider.tsx` imports
  `app/tamagui.config`; `transpilePackages += 'app'`; `"app": "*"` dep; Jest
  `moduleNameMapper` routes `^app(/.*)?$` at the package source (its exports map is
  ESM-only, which jest-resolve can't consume); `website/tamagui.config.ts` deleted.
- ✅ **apps/mobile re-pointed:** the 216-line Phase-1 config copy replaced by a thin local
  re-export of `app/tamagui.config` (kept local because metro/babel hardcode
  `config: './tamagui.config.ts'` and the Tamagui static compiler loads it in Node —
  upstream Tamagui convention); `animations{,.native}.ts` deleted (moved);
  `index.tsx` mounts `SharedBadge` inside the existing `bouncy` wrapper.
- ✅ **Byte-identical gate:** `getCSS()` diff before/after = **empty** (6097 bytes).
  Rendered DOM of all 5 routes identical after normalizing build-varying artifacts
  (flight-payload module IDs, CSS-module class hashes — expected noise when the module
  graph changes). Website lint + 49 Jest tests + `next build` (5 routes) green.
- ✅ **Native gate:** mobile `tsc --noEmit` green; `expo export` both platforms green —
  the Tamagui compiler resolved the config **through the bare `app` re-export** (predicted
  risk #1 didn't bite; no relative-path fallback needed). Sourcemap `sources` proof:
  `packages/app/src/animations.native.ts` + SharedBadge.tsx bundled; css driver +
  `@tamagui/animations-css` **absent**; 0 `@effect/platform-node`/`@effect/cli` modules;
  positive control ("supreme law of the land") present in both `.hbc`.
- ✅ **Root `npm test` fixed** (was broken since Phase 1: npm errors on workspaces missing
  a `test` script): apps/mobile gained `"test": "tsc --noEmit"`; packages/app `test` =
  typecheck (Phase 3 replaces it with the real contract suite). All 6 workspaces green.
- **Carry-forwards:** (1) **Never add an `./animations` subpath to `packages/app`
  "exports"** — Metro doesn't apply `.native` substitution to exports-map targets; the
  platform split only works via package-internal relative imports. With
  `unstable_enablePackageExports` on, every new public subpath must be added to the
  exports map explicitly (matters for Phases 3–5). (2) SharedBadge's on-device render
  rides on the still-open 0f/1E device gate. (3) Root `build`/`build:vercel` intentionally
  exclude `app` (nothing to build — source-shipped).

### Phase 3 — Platform abstraction (Effect service swap)
- Move neutral services into `packages/app/src/services`: `SessionService`, `QuestionDataService`, `StatisticsService`, `DistrictDataService` (all already wrap `questionnaire`/JSON).
- For coupled services keep one tag, two layers:
  - `LocalStorageService`: tag + Schemas → `packages/app`; web keeps current `localStorage` Default (`.web.ts`); add `.native.ts` over AsyncStorage (mechanical re-impl of the 13 already-isolated methods; Schema logic shared verbatim) — [Ch 14 § AsyncStorage](/references/expo/14-sdk-data-auth-background.md#async-storage).
  - New `TtsService` / `SoundService` tags: web layers lift logic from `useTextToSpeech`/`useGameSounds`; native layers wrap `expo-speech` ([Ch 13](/references/expo/13-sdk-device-sensors-system.md#speech)) / `expo-audio` ([Ch 12](/references/expo/12-sdk-camera-media-graphics.md#audio)).
  - `NavigationService`: thin tag/callbacks, implemented per app — no router in shared package. **Optional refinement (maintainer's call):** the guides show expo-router *is itself* the routing abstraction ([Ch 06 § Navigation](/references/expo/06-expo-router-basics.md#navigation)) and web uses Next.js regardless, so a full Effect-tag may be more indirection than the two-router split needs. A lighter alternative: keep screens router-neutral by passing nav **callbacks** (`onNext`, `onNavigate`) and let the thin route wrappers in `apps/mobile/app/*` and `website/src/app/*` import `expo-router` / `next/navigation` directly. Either way, no router leaks into `packages/app`.
- Generalize `ServiceProvider.ts`'s `AppServiceLayer` into `makeAppServiceLayer(platformLayers)` + move `runWithServices*` to `packages/app`.
- **Exit:** a shared save→read `GameResult` Effect passes against both web (jsdom) and native (`jest-expo` + AsyncStorage mock) layers; existing website Jest tests using `TestLocalStorageServiceLayer` still pass. (`jest-expo` is chosen over the references' default Vitest deliberately — it keeps parity with the existing Jest suites already aggregated by `npm run test --workspaces` and lets the native layer reuse `TestLocalStorageServiceLayer` verbatim.)

#### Phase 3 — STATUS (updated 2026-07-26): ✅ DONE — all in-container gates green

Decisions (user-confirmed): **NavigationService deferred to Phase 5** as nav-callback props
(no Effect tag — `useRouter()` is a React hook and can't live in a long-lived Layer);
**native TTS/Sound ship as honest stubs** (`isSupported: false` / no-op) — Phase 6 fills in
expo-speech/expo-audio in the same `adapter.native.ts` files; no new expo libs installed.

- ✅ **Premise correction:** the exit criterion's "existing tests using
  `TestLocalStorageServiceLayer`" was a false premise — that export was dead (nothing
  imported it). The real behavioral gate used instead: the existing `.Default`-based
  `LocalStorageService.test.ts` passing **unchanged** against the restructured service
  (it did). The `Test*ServiceLayer`s moved with their services and remain available.
- ✅ **Services moved** to `packages/app/src/services` behind new exports subpaths
  `app/services`, `app/types`, `app/hooks` (each targets a non-split `index.ts`, per the
  Phase-2 carry-forward). Website keeps one-line re-export shims at every old path
  (`src/services/*`, `src/types/index.ts`, 3 hooks = 42 lines total) — **zero consumer
  files changed**.
- ✅ **LocalStorageService restructured** better than the planned "mechanical re-impl of
  13 methods": a 4-method `StorageBackend` port (get/set/remove/isAvailable) with the 13
  methods written once (`makeService.ts`); only the backend splits into `backend.ts`
  (localStorage) / `backend.native.ts` (AsyncStorage, `Effect.tryPromise`). API change:
  `checkStorageAvailable` is now `() => Effect<boolean>` (verified zero consumers; sync is
  unimplementable over AsyncStorage).
- ✅ **TtsService/SoundService extracted**: web adapters lift speechSynthesis/AudioContext
  out of the hooks; `useTextToSpeech` keeps React state while the segment chain (400ms
  pauses) runs in a forked fiber — **fiber interruption replaced the cancelledRef/timeout
  machinery**. Hooks live in `app/hooks`; AudioContext is now an app-wide singleton via
  the runtime (previously per-component).
- ✅ **`makeAppServiceLayer(platformLayers?)` + `AppRuntime` (ManagedRuntime)** in
  `ServiceLayer.ts`; `runWithServices*` keep exact signatures but run through the memoizing
  runtime. `ServiceProvider.ts` is a shim. Tag-collision hazard (questionnaire's internal
  `'QuestionDataService'`) documented in the barrel.
- ✅ **Contract suite (exit criterion)**: parameterized `describeStorageContract` factory
  (13 cases incl. TTS round-trip + availability) in `app/services/testing/`, run by the
  website jsdom suite AND a new **jest-expo ~56.0.5** harness in `apps/mobile` whose haste
  platform resolution picks `backend.native.ts` — same mechanism as Metro. Extras: an
  AsyncStorage write-through probe, a `.native.ts` resolution canary, and a verified
  negative control (hiding `backend.native.ts` fails 8 tests). Mobile `test` =
  `tsc --noEmit && jest`.
- ✅ **All gates green**: root `npm test` = 6 workspaces (mobile 15, website 51);
  website lint/build (5 routes); `expo export` ios+android clean bundles (0
  platform-node/cli hits, data positive-control present); Playwright chromium e2e 3/3 —
  the full-game e2e exercised the AppRuntime path end-to-end.
- **Unplanned fixes:** (1) `npm install` pruned a stray `@effect/cluster`, exposing that
  `@effect/platform-node`'s peers were never lockfile-satisfied under `legacy-peer-deps`
  (latent since Phase 1) — declared `@effect/{cluster,rpc,sql,workflow,experimental}`
  explicitly in `civics2json` devDeps. (2) Website Jest needed a `^questionnaire/data$`
  mock mapping (barrel now pulls `DistrictDataService`). (3) The e2e assertion
  `text=Game Complete!` was stale — app has always rendered "Test Complete"; assertion
  now checks `text=Final Score`. (4) `apps/mobile/tsconfig.json` gained `app`/`app/*`
  paths (test-only deep imports; Metro unaffected).
- **Phase 5/6 carry-forwards:** contract factory imports questionnaire **type-only**
  (keep it that way — the native runner has no questionnaire mock); jest-expo's
  `transformIgnorePatterns` must be re-copied from the preset if jest-expo is upgraded;
  native adapters' `.native.ts` files are the exact Phase-6 fill-in points; device gates
  0f/1E still open (no simulator in-container).

### Phase 4 — Port design system to Tamagui tokens (the long pole)
- Map every `var(--editorial-*)` usage to the matching `$editorial*` Tamagui token (the values already exist as tokens — this is a mapping, not a redesign).
- Drive `light`/`dark` via Tamagui themes, replacing the `html.t_dark` switch on both platforms.
- Convert the 12 files using `var(--...)` from raw `<div style>` to `<YStack/XStack/Text>` + `$token` props, starting with `Layout.tsx` and the `tamagui/` wrappers. Replace `.animate-*`/framer-motion with `moti`/Tamagui animations.
- Trim `globals.css`/`design-tokens.css` to genuinely web-only resets.
- **Exit:** zero `var(--editorial-*)` in components destined for `packages/app`; Playwright visual diffs of all 5 web routes within tolerance (baseline captured **before** this phase — the guardrail for decision #4).

#### Phase 4 — STATUS (updated 2026-08-09): ✅ DONE — all gates green, execution details in `plans/phase4-design-system-port.md`

Ten stages, one commit each (`39c58e7`..Stage 10). Visual harness: 20 committed
baselines (5 routes × light/dark × desktop/mobile), suite run twice per stage,
`phase4-baseline` tag; baselines are valid ONLY in the sandbox container's font
stack. Key outcomes:

- **Tamagui theme CSS was dead on the website** until `themeClassNameOnRoot:
  true` (Stage 2) — v1.144 emitted `:root .t_light` descendant selectors that
  never matched the class ON `<html>`. Activation changed game/settings
  renders (previously-dead keys); those 8 baselines re-captured with user
  approval.
- Theme keys: 6 `editorial*` + exact-parity `theme*` keys (`themeError(+Bg/
  Text)`, `themeSuccess(+Bg/Text)`, `themeWarning(+Bg/Text)`, `themePrimary`,
  `themePurple`, `themeCardBg`, `neutral100`, `shadowMd`) in BOTH themes.
  Pre-existing `error`/`success`/`warning`/`primary` keys have different
  values and remain untouched.
- New shared-bound primitives (website-local until Phase 5):
  `EditorialButton` (+ghost), `EditorialInput`/`EditorialSelect` (DOM-typed
  recasts), `LoadingSpinner` (ring variant, durationMs), `AnswerButton`
  variants in GameQuestion. Editorial buttons are Text-based single elements
  (tag=button) so ghost-hover text color inherits.
- Deleted CSS: `.btn-editorial*`, `.input-editorial`, `.badge*`,
  `.answer-btn*`, `.accuracy-*/.prob-*`, `.spinner`, `.animate-*` + 6
  keyframes. Kept: `.stats-strip` (statistics page consumer; its 480/768px
  grid breakpoints have no Tamagui media equivalent — re-pointed at the
  Tamagui-generated `--editorialRule` variable), `@keyframes spin`,
  `.theme-icon-*`, `.btn-primary/secondary/success`, `card*`, all
  `--editorial-*`/`--theme-*` definitions (InstallPrompt/OfflineIndicator).
- `animations` gained a `lazy` (500ms timing) key in BOTH driver files
  (css + moti) for the former `.animate-fade-in`.
- Exit gate green: zero `var(--` in shared-bound tsx (grep-verified; only
  InstallPrompt/OfflineIndicator/serif sites remain), root `npm test`,
  website lint + `next build`, functional e2e 3/3, visual 20/20 ×2, mobile
  `tsc` + `expo export` ios+android.

**Phase 5 carry-forwards:** (1) `createFont` obligation — 17 tagged
`// PHASE5: $fontFamily` sites keep literal `var(--font-family-serif)`;
(2) SpeakerButton `.speaker-pulse` keyframes → moti loop; (3) LoadingSpinner's
CSS `spin` animation → Tamagui `Spinner`/moti; (4) ThemeToggle dual-icon CSS
hack needs a state-based render on native; (5) icon `color=` props already
theme-resolved — ready for `@tamagui/lucide-icons` swap; (6) table-based
components (QuestionStatisticsTable, QuestionDetailModal history) keep native
`<table>`/hover `<style>` injection on web — native needs a list rebuild;
(7) StatsSummary/stats-strip grids are CSS grid — native needs flex rebuilds;
(8) `EditorialInput`/`EditorialSelect` are DOM-typed — native swaps to
TextInput/picker equivalents.

### Phase 5 — Move components + screens into `packages/app`
- Least-coupled first: `tamagui/*` wrappers, `StatsSummary`, `GameResults`, `QuestionStatisticsTable`, `StateSelector`, `DistrictSelector`, `GameQuestion`, `GameControls`, `PoliticianVerificationBox`, `QuestionDetailModal`, `SpeakerButton`, `ThemeToggle`, `ErrorBoundary`. Swap icons to `@tamagui/lucide-icons`; route `Layout` nav through `NavigationService`.
- **Keep web-only in `website`:** `OfflineIndicator`, `InstallPrompt`, `ServiceWorkerRegistration`.
- Build 5 shared screen components in `packages/app/src/screens` (the ~580-line `/game` state machine → shared `GameScreen` taking nav callbacks — its size makes the shared extraction the highest-effort step of this phase). Web routes and `apps/mobile/app/*` become thin wrappers.
- **Exit:** every website route renders the shared screen; mobile mounts the same screens; `/game` behaves identically on both.

#### Phase 5 — STATUS (updated 2026-08-11): 🔄 IN PROGRESS — Stages 1–7 committed, GameQuestion now shared

Running as small staged commits on `native`, one commit per stage, user confirms
each commit. Per-stage gate suite (all must be green before a stage commits):
root `npm test` ×2 · website `eslint .` + `NODE_ENV=production next build` ·
functional e2e chromium-only (`--project=chromium --workers=2`) · visual 20/20 ×2
(`--workers=2`; baselines valid only in the sandbox container) · `tsc --noEmit`
in packages/app + apps/mobile · `expo export` ios+android `--source-maps`, then
grep sourcemaps (`.native.ts` halves resolved, web halves absent, 0 lucide-react
/ @effect/platform-node / @effect/cli modules).

- **Stage 1 (997bbbf):** platform-split icon module — `components/icons.ts`
  (lucide-react, web) / `icons.native.ts` (@tamagui/lucide-icons per-icon
  subpaths; never expose the split via package.json "exports" — Metro doesn't
  apply `.native` substitution there).
- **Stage 2 (82c3ffb):** platform-split serif font — `fonts.ts` (web: literal
  `var(--font-family-serif)` chain) / `fonts.native.ts` (Georgia until Phase 6
  expo-font); `fonts: { serif }` in tamagui.config, no defaultFont on purpose.
- **Stage 3 (09c90aa):** moved `tamagui/*` wrappers + GameControls,
  PoliticianVerificationBox, GameResults. New exports subpath
  `./components/tamagui`; website files become one-line shims
  (`export { X as default } from 'app/components'`).
- **Stage 4 (a872c9c):** moved+converted SpeakerButton (SVGs → Volume1/Volume2
  icons, `.speaker-pulse` keyframes → new `pulse` animation-driver key +
  opacity ping-pong, no moti dep) and StatsSummary (CSS grid → flex-wrap
  `flexBasis 20% / $xs 50%`, clamp() → `fontSize 48 / $xs 32`, last two
  component `var(--font-family-serif)` sites → `$serif`).
- **Stage 5 (6312ded):** react-hooks lint for packages/app (the react-dev "NEW STAGE"
  below) — `eslint-plugin-react-hooks ^7.1.1` direct devDep + `configs.flat.recommended`
  (16 rules incl. `set-state-in-effect`; website keeps it off). Root `npm run lint` now
  enforces it. Fixes: StatsSummary rAF count-up starts from a `displayRef` (suppression
  removed) + a pre-existing prettier error; SpeakerButton's 750ms clock moved into a
  mount-scoped `PulsingIcon` (no setState in any effect body). Two documented deviations:
  (a) "drive the pulse purely via the animation key" is UNIMPLEMENTABLE — the v1.144 css
  driver emits only transitions, never keyframe loops, so a JS clock must remain (now
  encapsulated + lint-clean, identical visuals); (b) useTextToSpeech uses a lazy
  `useState` initializer, NOT `useRef` — the `refs` rule correctly rejects render reads,
  and `isSupported` needs the value during render. Also declared `@eslint/eslintrc`
  (was hoisting-only).
- **Stage 6 (cb3ee88):** `useKeyboardNavigation` → `packages/app/src/hooks/`, rewritten
  React-19 style: key handler is a `useEffectEvent`, so the `document`
  subscription is created once (`[]` deps) instead of re-subscribing on every
  game-state change (old 6-dep `useCallback`). Platform split:
  `useKeyboardNavigation.native.ts` is a same-signature no-op (no `document` in
  RN; Phase 6 drops keyboard nav on mobile); shared options interface +
  `KEYBOARD_SHORTCUTS` live in `useKeyboardNavigation.shared.ts` so the halves
  can't drift. Exported via the existing non-split `hooks/index.ts`; website
  file is now a one-line shim. Sourcemap note: mobile bundles no `app/hooks`
  modules yet (nothing imports them until GameQuestion moves in Stage 7), so
  the "native half resolved" grep legitimately returns 0 — the leak greps
  (web half / lucide-react / @effect) are the binding checks this stage.
  Live-verified beyond the gates: throwaway e2e pressed "2" then Enter on
  /game — select + advance both work through the rewritten hook.
- **Stage 7 (2b7a2ca):** GameQuestion → `packages/app/src/components/`.
  Conversions in the move: two inline feedback SVGs → `Check`/`X` from the
  shared icon module; the DOM-typed `AnswerButton` cast (styled TamaguiText
  `tag: 'button'` + `ButtonHTMLAttributes`) → `styled(YStack, { tag: 'button' })`
  with `onPress` (cursor/transition inline style stays web-only behind `isWeb`;
  `role`/`aria-*`/`data-answer-index` pass through — e2e depends on the data
  attr); the CSS `currentColor` inheritance (chip border/glyph/answer text
  follow the button state color) has no RN equivalent → an `answerStateColor`
  resolver maps state → `useTheme().<key>?.get()` using the same theme keys the
  old `color` variants used; answer badge/text raw `<div>/<span>` → Tamagui
  stacks/Text with explicit `lineHeight={21}` (strut lesson — visual gate
  passed first run, no drift); reset-on-question effect deleted (would violate
  `set-state-in-effect`) → `key={currentQuestion.id}` at the sole call site
  `game/page.tsx`; `noOp` `useCallback` → module-level constant (the Stage 6
  hook reads options via `useEffectEvent`, stability irrelevant). Sourcemap
  milestone: `app/components` index now pulls GameQuestion into the native
  bundle, so the hook/icon native halves resolve for the first time
  (`useKeyboardNavigation.native.ts`, `.shared.ts`, `icons.native.ts` present;
  web halves absent; forbidden-module greps still 0).
- **Pixel-parity lesson (recurs in later stages):** blockified Tamagui
  Text/flex children lose the body 16px/1.5 line-height strut that old inline
  spans/svgs got — pages render ~7px short per converted site. Reproduce the
  old line boxes explicitly (Stage 4: stat label `lineHeight={21} marginTop={3}`
  = 24px strut box; speaker icon wrapper `height={29}` = 22px svg + strut
  descent).
- **Remaining, least-coupled first:** ThemeToggle
  (blocked on `useThemeContext` from the non-moving TamaguiProvider: inject via
  prop or split the provider) → StateSelector (geolocation), DistrictSelector,
  QuestionDetailModal (focus trap/body scroll + `<table>`),
  QuestionStatisticsTable (`<table>` + injected `<style>`), ErrorBoundary
  (`window.location`) → then the 5 shared screens. Keep web-only:
  OfflineIndicator, InstallPrompt, ServiceWorkerRegistration.
- NOTE: website-wide `npx tsc --noEmit` fails in `website/test/*` (pre-existing
  fixture type errors) — not a gate; `next build`'s TS pass and jest are the
  real checks.

#### Phase 5 — React 19 guidance (added 2026-08-10, validated against `/references/react-dev`)

Review of the new react.dev reference guide against the implemented code found
nothing significant to change (zero `forwardRef` in the repo; ErrorBoundary is
already the canonical sanctioned class shape; existing manual memoization stays
per compiler guidance). Verified: `useEffectEvent` is a **stable export** in
both installed Reacts (web 19.2.5, mobile 19.2.3) — safe in shared code. The
small items below fold into the remaining stages; the larger opportunities
(reducer conversion, React Compiler, useSyncExternalStore) are deliberately
deferred to `plans/react19-modernization.md` (post-migration).

- **✅ DONE as Stage 5 (6312ded) — packages/app hooks linting** (see STATUS
  above for the two deviations). `packages/app/eslint.config.mjs` has NO react-hooks plugin —
  everything moved so far is unlinted for hooks rules. Declare
  `eslint-plugin-react-hooks` (^7.1.1, matching the hoisted copy) as a direct
  devDep of `packages/app` and add its flat `recommended` config (full 17-rule
  set, incl. `set-state-in-effect` — website keeps that rule off; the shared
  package starts clean). Fix the violations in already-moved files:
  `StatsSummary.tsx` (remove the repo's only `exhaustive-deps` suppression at
  line 29; rework the rAF count-up to track the current value in an effect
  local, not a stale state read), `SpeakerButton.tsx` (drop the 750 ms
  `setInterval`-toggled `dim` state; drive the pulse purely via the Stage-4
  `pulse` animation key), `useTextToSpeech.ts` (`useMemo`-as-lazy-init for the
  TtsService handle → `useRef` lazy-init pattern). Standard per-stage gate
  suite.
- **Mechanical React 19 idioms to apply as each remaining component moves**
  (not as separate rewrites — same stage as the move, covered by parity gates):
  - `useKeyboardNavigation`: rewrite as a subscribe-once effect (`[]` deps)
    with the key handler as a `useEffectEvent` — currently re-subscribes
    `document.addEventListener` every render (6-dep `useCallback` + callers
    passing inline arrows). Platform split for `document` still required.
  - `DistrictSelector`: replace the hand-rolled latest-ref
    (`onDistrictChangeRef`, lines 66–69) with `useEffectEvent`.
  - `QuestionDetailModal`: wrap `onClose` in `useEffectEvent` so the
    focus-trap/body-scroll effect (dep `[onClose]`) stops tearing down whenever
    the parent re-renders.
  - `GameQuestion`: reset-on-question effect (lines 315–319) →
    `key={question.id}` at call sites (canonical fix); keep the effect with a
    comment only if parity gates object.
  - ThemeToggle/provider-split stage: the new shared theme context uses the
    React 19 `<ThemeContext value={...}>` form (`.Provider` at
    `TamaguiProvider.tsx:61` is the legacy form).
  - Statistics screen extraction: `filteredStatistics` state+effect
    (`statistics/page.tsx:40-104`) → `useMemo`/plain derivation (textbook
    derived-state-in-effect; double-renders per keystroke today).
  - `StateSelector`: drop `isMountedRef` ceremony; add a cancellation guard to
    the unabortable `navigator.permissions.query` effect (lines 177–192).
  - **GameScreen extraction (user decision: move as-is + these cleanups only,
    NO reducer conversion now):** replace the three mirrored refs
    (`sessionRef`/`currentQuestionIndexRef`/`questionsRef`, lines 120–128) with
    one `useEffectEvent` feeding the `setTimeout` body; drop `mountedRef`
    ceremony; collapse the settings→init effect chain (lines 213–235) by
    initializing from the settings-load completion path. Direct `localStorage`
    keyboard-help reads stay (existing backlog item).
  - `ErrorBoundary`: keep it a class (react.dev's one sanctioned class use;
    shape already canonical) — only the planned nav-callback prop replaces
    `window.location.href`.

### Phase 6 — Native features & polish
- Wire native layers (AsyncStorage / `expo-speech` / `expo-audio`); `apps/mobile/app/_layout.tsx` tab/stack nav replacing the web header ([Ch 07 § Tabs](/references/expo/07-expo-router-advanced.md#tabs-navigator) / [§ Stack](/references/expo/07-expo-router-advanced.md#stack-navigator)); `expo-font` ([Ch 10 § Fonts](/references/expo/10-ui-and-assets.md#fonts)), safe-area ([Ch 10 § Safe Areas](/references/expo/10-ui-and-assets.md#safe-areas)), status/system bars ([Ch 10 § System Bars](/references/expo/10-ui-and-assets.md#system-bars)), splash/icon ([Ch 10 § Icon & Splash](/references/expo/10-ui-and-assets.md#icon-splash)), light/dark themes ([Ch 10 § Color Themes](/references/expo/10-ui-and-assets.md#color-themes)). Drop `useKeyboardNavigation` on mobile.
- **Add `expo-haptics`** (promoted from fast-follow — zero config, no plugin): tactile feedback on answer select/submit is an outsized polish win for a quiz, with graceful no-op when unsupported ([Ch 13 § Haptics](/references/expo/13-sdk-device-sensors-system.md#haptics)).
- **Add `expo-system-ui`**: set the root-view background color to eliminate the Android navigation-transition color flash ([Ch 15 § UI Components](/references/expo/15-sdk-ui-components.md)).
- **Exit:** all 5 screens fully functional on iOS sim + Android emulator with persistence, TTS, sounds, and haptic answer feedback.

### Phase 7 — Build, CI, release
- **EAS Build** (`eas.json`) dev/preview/production profiles with a dev-client (reanimated/async-storage/expo-audio aren't in Expo Go) — [Ch 16 § eas.json](/references/expo/16-eas-build.md#eas-json). Minimal skeleton:
  ```json
  {
    "cli": { "version": ">= 12.0.0" },
    "build": {
      "development": { "developmentClient": true, "distribution": "internal", "ios": { "simulator": true } },
      "preview": { "distribution": "internal" },
      "production": {}
    }
  }
  ```
  Signing/credentials are managed by EAS ([Ch 16 § Credentials](/references/expo/16-eas-build.md#credentials), [Ch 17 § App Signing](/references/expo/17-eas-submit-and-distribution.md#app-signing)). On EAS the monorepo installs from the root lockfile and resolves hoisted packages itself — the local `watchFolders`/`nodeModulesPaths` remapping is dev-only.
- **EAS Update (optional for v1):** setup is ~2 commands — `expo install expo-updates` then `eas update:configure` (writes `runtimeVersion`/channels) — so OTA hotfixes *can* land in v1 rather than waiting on a fast-follow retrofit ([Ch 18 § Publishing](/references/expo/18-eas-update.md#publishing)). Maintainer's call; see Fast-follow.
- Root scripts `dev:mobile`/`ios`/`android` (`dev`→website unchanged). Extend root `clean` to cover mobile artifacts. CI: `tsc --build`, `npm run test --workspaces`, EAS preview smoke build ([Ch 16 § CI](/references/expo/16-eas-build.md#ci); EAS Workflows is the native option — [Ch 19 § EAS Workflows](/references/expo/19-eas-workflows-hosting-insights.md#eas-workflows)).
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
- **Two Tamagui instances:** pin exact `1.144.x` everywhere (incl. `@tamagui/metro-plugin`); hoist at root. Monorepo hoisting/dedupe guidance: [Ch 11 § Monorepos](/references/expo/11-common-guides.md#monorepos).
- **Tamagui Metro integration:** native compilation needs `@tamagui/metro-plugin`'s `withTamagui()` wrapping the Metro config, paired with the babel plugin — don't rely on the babel plugin alone. Validate alongside Spike B.
- **Animation driver:** `css` is web-only — never share; resolve via `.web/.native` file extensions. Package is `@tamagui/animations-moti` on v1.144 (`@tamagui/animations-motion` only in v2). Native reanimated/worklets setup: [Ch 15 § Reanimated](/references/expo/15-sdk-ui-components.md#reanimated).
- **CSS-var design system:** mapping not redesign; Playwright visual gate prevents web regressions.
- **Effect/Schema under Hermes:** Effect core is Node-free so risk is low, but RN/Hermes support is *undocumented* in the Effect refs — prove it on-device in Spike A (Schema decode included), not by assumption; keep `@effect/platform-node` off-device.
- **React 19 alignment:** mobile pins SDK's React; `packages/app` treats `react` as peer dep — two separately-bundled copies is fine. New Architecture context: [Ch 11 § New Architecture](/references/expo/11-common-guides.md#new-architecture).

## Verification
- **Three-target dev loop:** web `npm run dev` + Playwright; iOS `npx expo run:ios`; Android `npx expo run:android` (dev-client, not Expo Go — [Ch 09 § Creating a Dev Build](/references/expo/09-development-builds-and-debugging.md#creating-a-dev-build)).
- **Shared contract tests:** one suite (save/read `GameResult`, settings, paired answers) run against both web and native layers; native via `jest-expo` + AsyncStorage mock. Existing `npm run test --workspaces` aggregates.
- **Visual regression:** capture website screenshots of all 5 routes before Phase 4; diff after each component move.
- **CI smoke:** `tsc --build`, workspace Jest, EAS preview build ([Ch 16 § Running a Build](/references/expo/16-eas-build.md#running-a-build) / [Ch 17 § Internal Distribution](/references/expo/17-eas-submit-and-distribution.md#internal-distribution)).

## Fast-follow (out of v1)
MMKV migration; `expo-notifications` push ([Ch 14 § Notifications](/references/expo/14-sdk-data-auth-background.md#notifications), [Ch 11 § Push Notifications](/references/expo/11-common-guides.md#push-notifications)); EAS Update/OTA ([Ch 18](/references/expo/18-eas-update.md#publishing) — see the optional Phase-7 sub-step; could land in v1); App Store/Play submission & signing ([Ch 17](/references/expo/17-eas-submit-and-distribution.md#ios-submission)); full TTS voice-picker parity (`expo-speech` enumeration is weaker than Web — ship default voice + rate first; [Ch 13 § Speech](/references/expo/13-sdk-device-sensors-system.md#speech)); deep linking ([Ch 07 § Deep Linking](/references/expo/07-expo-router-advanced.md#deep-linking), [Ch 11 § Deep Linking](/references/expo/11-common-guides.md#deep-linking) — nearly free once a `scheme` is set, since every expo-router file route already maps to a URL); localization ([Ch 11 § Localization](/references/expo/11-common-guides.md#localization)). (Haptics moved into Phase 6.)
